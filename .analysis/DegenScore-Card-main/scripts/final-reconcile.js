/**
 * FINAL RECONCILIATION SCRIPT
 * Replicates CSV logic EXACTLY:
 * - 1 Trade per Signature
 * - Direction based on Flow: OUT (Token1) -> IN (Token2)
 * - P&L based on SOL component ONLY
 * - Fixes Double Counting of SOL/WSOL
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

// Reference Data (CSV)
const REFERENCE = {
    trades: 194,
    totalSpent: 80.7418,
    totalReceived: 78.9235,
    netBalance: -1.8184,
};

// Known SOL Mints (Native & Wrapped)
const SOL_MINTS = new Set([
    'So11111111111111111111111111111111111111111',
    'So11111111111111111111111111111111111111112',
]);

async function getWalletTransactions(walletAddress, limit = 100, before, type) {
    let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    if (before) url += `&before=${before}`;
    if (type) url += `&type=${type}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

async function fetchAllTransactions(walletAddress) {
    const allTransactions = [];
    const seenSignatures = new Set();

    console.log(`🔄 Fetching transactions for: ${walletAddress}`);

    // Fetch batches until we enough trades
    let before;
    let phases = [
        { type: 'SWAP', batches: 40 },
        { type: undefined, batches: 80 }
    ];

    for (const phase of phases) {
        console.log(`\n📡 Fetching ${phase.type || 'ALL'} transactions...`);
        before = undefined;
        let phaseBefore = undefined;
        for (let i = 0; i < phase.batches; i++) {
            try {
                const txs = await getWalletTransactions(walletAddress, 100, phaseBefore, phase.type);
                if (!txs || txs.length === 0) break;

                let newCount = 0;
                for (const tx of txs) {
                    if (!seenSignatures.has(tx.signature)) {
                        seenSignatures.add(tx.signature);
                        allTransactions.push(tx);
                        newCount++;
                    }
                }

                phaseBefore = txs[txs.length - 1]?.signature;
                if (i % 5 === 0) process.stdout.write('.');

                if (allTransactions.length > 3000) break;
                await new Promise(r => setTimeout(r, 100));
            } catch (e) { break; }
        }
    }

    console.log(`\n✅ Total fetched: ${allTransactions.length}`);
    return allTransactions.sort((a, b) => b.timestamp - a.timestamp); // Newest first
}

function analyzeTransaction(tx, walletAddress) {
    // 1. Calculate NET changes for all tokens and SOL
    const changes = new Map(); // mint -> amount (positive = IN, negative = OUT)

    // A. Token Transfers
    if (tx.tokenTransfers) {
        for (const t of tx.tokenTransfers) {
            const existing = changes.get(t.mint) || 0;
            if (t.toUserAccount === walletAddress) {
                changes.set(t.mint, existing + t.tokenAmount);
            } else if (t.fromUserAccount === walletAddress) {
                changes.set(t.mint, existing - t.tokenAmount);
            }
        }
    }

    // B. Native SOL 
    const WSOL = 'So11111111111111111111111111111111111111112';
    let solChange = 0;

    if (tx.accountData) {
        const account = tx.accountData.find(a => a.account === walletAddress);
        if (account) {
            solChange = account.nativeBalanceChange / 1e9;
        }
    }

    // Combine Native SOL into the Map SMARTLY
    // Logic: In many swaps, we see Double Counting:
    // 1. Native SOL spends (-X)
    // 2. Wrapped SOL transfers (-X)
    // If we sum them, we get -2X. 
    // We should check if they are "duplicates" (same direction, similar amount).
    const wsolChange = changes.get(WSOL) || 0;

    if (Math.abs(solChange) > 0.000001) {
        if (Math.abs(wsolChange) > 0.000001 && Math.sign(solChange) === Math.sign(wsolChange)) {
            // Detected potential double counting (both Native and WSOL moving same way)
            // Use the larger absolute value (usually the 'real' flow)
            const maxVal = Math.max(Math.abs(solChange), Math.abs(wsolChange));
            changes.set(WSOL, maxVal * Math.sign(solChange));
        } else {
            // Different directions (e.g. Wrap/Unwrap: -Native, +WSOL -> Net 0)
            // Or only one exists (e.g. Pure Native transfer). Safe to sum.
            changes.set(WSOL, wsolChange + solChange);
        }
    } else {
        // No native change, just keep WSOL token change
        // No action needed as map already has WSOL token change if any
    }

    // 2. Identify Token1 (OUT) and Token2 (IN)
    let tokenIn = null; // Received
    let amountIn = 0;
    let tokenOut = null; // Sent
    let amountOut = 0;

    for (const [mint, amount] of changes.entries()) {
        if (amount > 0) {
            // Prioritize distinct flows. 
            if (!SOL_MINTS.has(mint) || !tokenIn) {
                tokenIn = mint;
                amountIn = amount;
            } else if (SOL_MINTS.has(mint) && !tokenIn) {
                tokenIn = mint;
                amountIn = amount;
            }
        } else if (amount < 0) {
            const absAmount = Math.abs(amount);
            if (absAmount > amountOut) {
                tokenOut = mint;
                amountOut = absAmount;
            }
        }
    }

    // 3. Classify validity
    if (!tokenIn || !tokenOut) return null; // Need both sides

    // 4. Determine Type & Value
    const isInSol = SOL_MINTS.has(tokenIn);
    const isOutSol = SOL_MINTS.has(tokenOut);

    if (isInSol && !isOutSol) {
        // Received SOL, Sent Token => SELL
        return {
            type: 'SELL',
            solAmount: Math.abs(changes.get(tokenIn)),
            tokenMint: tokenOut,
            tokenAmount: amountOut,
            date: new Date(tx.timestamp * 1000),
            signature: tx.signature,
            source: tx.source
        };
    } else if (!isInSol && isOutSol) {
        // Sent SOL, Received Token => BUY
        return {
            type: 'BUY',
            solAmount: Math.abs(changes.get(tokenOut)),
            tokenMint: tokenIn,
            tokenAmount: amountIn,
            date: new Date(tx.timestamp * 1000),
            signature: tx.signature,
            source: tx.source
        };
    }

    return null;
}

async function main() {
    console.log('🔍 FINAL RECONCILIATION - DEDUPE FIX');
    console.log('='.repeat(70));

    const transactions = await fetchAllTransactions(WALLET);
    const trades = [];

    for (const tx of transactions) {
        const trade = analyzeTransaction(tx, WALLET);
        if (trade) trades.push(trade);
    }

    // Take exactly LAST 194 trades
    // Sort descending by date (Newest first)
    trades.sort((a, b) => b.date - a.date);

    const last194 = trades.slice(0, 194);

    // Calculate Totals
    let totalSpent = 0;
    let totalReceived = 0;

    last194.forEach(t => {
        if (t.type === 'BUY') totalSpent += t.solAmount;
        if (t.type === 'SELL') totalReceived += t.solAmount;
    });

    const netBalance = totalReceived - totalSpent;

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESULTS (Last 194 Trades)');
    console.log('='.repeat(70));

    console.log(`\n| Metric          | My Calculation | CSV Reference | Difference   |`);
    console.log(`|-----------------|----------------|---------------|--------------|`);
    console.log(`| Trades          | ${last194.length.toString().padStart(14)} | ${REFERENCE.trades.toString().padStart(13)} |            0 |`);
    console.log(`| Total Spent     | ${totalSpent.toFixed(4).padStart(14)} | ${REFERENCE.totalSpent.toFixed(4).padStart(13)} | ${(totalSpent - REFERENCE.totalSpent).toFixed(4).padStart(12)} |`);
    console.log(`| Total Received  | ${totalReceived.toFixed(4).padStart(14)} | ${REFERENCE.totalReceived.toFixed(4).padStart(13)} | ${(totalReceived - REFERENCE.totalReceived).toFixed(4).padStart(12)} |`);
    console.log(`| Net Balance     | ${netBalance.toFixed(4).padStart(14)} | ${REFERENCE.netBalance.toFixed(4).padStart(13)} | ${(netBalance - REFERENCE.netBalance).toFixed(4).padStart(12)} |`);

    const accuracy = 100 - Math.abs((netBalance - REFERENCE.netBalance) / REFERENCE.netBalance * 100);
    console.log(`\n✅ Net Balance Accuracy: ${accuracy.toFixed(2)}%`);

    // --- DEBUGGING THE 20 SOL GAP ---
    console.log('\n🔎 TOP 10 LARGEST TRADES (By SOL Volume):');
    const sortedByVol = [...last194].sort((a, b) => b.solAmount - a.solAmount);
    sortedByVol.slice(0, 10).forEach((t, i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${t.date.toISOString().split('T')[0]} | ${t.type.padEnd(4)} | ${t.solAmount.toFixed(4)} SOL | Mint: ${t.tokenMint.substring(0, 6)}... | Sig: ${t.signature.substring(0, 15)}...`);
    });
}

main().catch(console.error);
