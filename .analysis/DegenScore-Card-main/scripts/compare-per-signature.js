/**
 * P&L Analysis - 1 Trade per Transaction (Signature)
 * The key insight: CSV counts 1 trade per transaction, not per tokenTransfer
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

const REFERENCE = {
    trades: 194,
    totalSpent: 80.7418,
    totalReceived: 78.9235,
    netBalance: -1.8184,
};

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

    console.log(`🔄 Fetching transactions...`);

    // Fetch SWAPs
    let swapBefore;
    for (let batch = 0; batch < 30; batch++) {
        try {
            const swaps = await getWalletTransactions(walletAddress, 100, swapBefore, 'SWAP');
            if (swaps.length === 0) break;
            for (const tx of swaps) {
                if (!seenSignatures.has(tx.signature)) {
                    seenSignatures.add(tx.signature);
                    allTransactions.push(tx);
                }
            }
            swapBefore = swaps[swaps.length - 1]?.signature;
            if (swaps.length < 100) break;
            await new Promise(r => setTimeout(r, 100));
        } catch { break; }
    }
    console.log(`  ✓ SWAPs: ${allTransactions.length}`);

    // Fetch regular
    let regularBefore;
    for (let batch = 0; batch < 100; batch++) {
        try {
            const txs = await getWalletTransactions(walletAddress, 100, regularBefore);
            if (txs.length === 0) break;
            for (const tx of txs) {
                if (!seenSignatures.has(tx.signature)) {
                    seenSignatures.add(tx.signature);
                    allTransactions.push(tx);
                }
            }
            regularBefore = txs[txs.length - 1]?.signature;
            await new Promise(r => setTimeout(r, 30));
        } catch { break; }
    }

    console.log(`  ✓ Total: ${allTransactions.length}`);
    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
}

function extractTrades(transactions, walletAddress) {
    const WSOL_MINT = 'So11111111111111111111111111111111111111112';
    const EXCLUDED = new Set([
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    ]);

    const trades = [];

    for (const tx of transactions) {
        if (tx.type === 'BURN') continue;
        if (!tx.tokenTransfers?.length) continue;

        const hasWsolInTransfers = tx.tokenTransfers.some(t => t.mint === WSOL_MINT);
        const hasNativeTransfers = tx.nativeTransfers?.length > 0;
        if (!hasNativeTransfers && !hasWsolInTransfers) continue;

        const relevantTransfers = tx.tokenTransfers.filter(
            t => t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress
        );
        if (relevantTransfers.length === 0) continue;

        // Calculate NET balances per mint
        const tokenNetBalances = new Map();
        for (const transfer of relevantTransfers) {
            const current = tokenNetBalances.get(transfer.mint) || 0;
            if (transfer.toUserAccount === walletAddress) {
                tokenNetBalances.set(transfer.mint, current + transfer.tokenAmount);
            }
            if (transfer.fromUserAccount === walletAddress) {
                tokenNetBalances.set(transfer.mint, current - transfer.tokenAmount);
            }
        }

        const wsolNet = tokenNetBalances.get(WSOL_MINT) || 0;
        tokenNetBalances.delete(WSOL_MINT);

        let solNet = 0;
        if (tx.accountData?.length) {
            const walletData = tx.accountData.find(acc => acc.account === walletAddress);
            if (walletData?.nativeBalanceChange) {
                solNet = walletData.nativeBalanceChange / 1e9;
            }
        }
        if (solNet === 0 && tx.nativeTransfers) {
            for (const nt of tx.nativeTransfers) {
                if (nt.fromUserAccount === walletAddress) solNet -= nt.amount / 1e9;
                if (nt.toUserAccount === walletAddress) solNet += nt.amount / 1e9;
            }
        }

        // Total SOL change = native + WSOL
        const totalSolChange = solNet + wsolNet;

        // Find primary token
        let primaryMint = '';
        let primaryTokenNet = 0;
        for (const [mint, netBalance] of tokenNetBalances.entries()) {
            if (EXCLUDED.has(mint)) continue;
            if (Math.abs(netBalance) > Math.abs(primaryTokenNet)) {
                primaryMint = mint;
                primaryTokenNet = netBalance;
            }
        }

        if (!primaryMint || primaryTokenNet === 0) continue;

        // 🔑 KEY: Determine trade type by the NET SOL change of the WHOLE transaction
        // BUY = SOL decreases (negative change), tokens increase
        // SELL = SOL increases (positive change), tokens decrease

        let tradeType;
        if (totalSolChange < -0.0001 && primaryTokenNet > 0) {
            tradeType = 'BUY';
        } else if (totalSolChange > 0.0001 && primaryTokenNet < 0) {
            tradeType = 'SELL';
        } else if (Math.abs(primaryTokenNet) > 0.001) {
            // Infer from token flow
            tradeType = primaryTokenNet > 0 ? 'BUY' : 'SELL';
        } else {
            continue;
        }

        const solAmount = Math.abs(totalSolChange);
        if (solAmount < 0.0001) continue;

        // 🔑 ONE TRADE PER SIGNATURE
        trades.push({
            signature: tx.signature,
            timestamp: tx.timestamp,
            date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            type: tradeType,
            token: primaryMint.substring(0, 8) + '...',
            solAmount: solAmount,
            source: tx.source || tx.type,
        });
    }

    return trades;
}

async function main() {
    console.log('🔍 P&L ANALYSIS - 1 Trade Per Signature');
    console.log('='.repeat(70));
    console.log(`📋 Wallet: ${WALLET}`);
    console.log(`📊 Reference: ${REFERENCE.trades} trades, ${REFERENCE.netBalance} SOL`);
    console.log('='.repeat(70));

    const transactions = await fetchAllTransactions(WALLET);
    const allTrades = extractTrades(transactions, WALLET);

    console.log(`\n📊 Total trades found: ${allTrades.length}`);

    // Get last 194
    const last194 = allTrades.slice(0, REFERENCE.trades);

    const buys = last194.filter(t => t.type === 'BUY');
    const sells = last194.filter(t => t.type === 'SELL');

    const totalSpent = buys.reduce((sum, t) => sum + t.solAmount, 0);
    const totalReceived = sells.reduce((sum, t) => sum + t.solAmount, 0);
    const netBalance = totalReceived - totalSpent;

    console.log('\n' + '='.repeat(70));
    console.log('📈 RESULTS (Last 194 - 1 per signature)');
    console.log('='.repeat(70));

    console.log(`\n| Metric          | Ours         | CSV          | Diff         |`);
    console.log(`|-----------------|--------------|--------------|--------------|`);
    console.log(`| Trades          | ${last194.length.toString().padStart(12)} | ${REFERENCE.trades.toString().padStart(12)} | ${(last194.length - REFERENCE.trades).toString().padStart(12)} |`);
    console.log(`| Buys            | ${buys.length.toString().padStart(12)} |              |              |`);
    console.log(`| Sells           | ${sells.length.toString().padStart(12)} |              |              |`);
    console.log(`| Total Spent     | ${totalSpent.toFixed(4).padStart(12)} | ${REFERENCE.totalSpent.toFixed(4).padStart(12)} | ${(totalSpent - REFERENCE.totalSpent).toFixed(4).padStart(12)} |`);
    console.log(`| Total Received  | ${totalReceived.toFixed(4).padStart(12)} | ${REFERENCE.totalReceived.toFixed(4).padStart(12)} | ${(totalReceived - REFERENCE.totalReceived).toFixed(4).padStart(12)} |`);
    console.log(`| Net Balance     | ${netBalance.toFixed(4).padStart(12)} | ${REFERENCE.netBalance.toFixed(4).padStart(12)} | ${(netBalance - REFERENCE.netBalance).toFixed(4).padStart(12)} |`);

    const netAccuracy = 100 - Math.abs((netBalance - REFERENCE.netBalance) / Math.abs(REFERENCE.netBalance)) * 100;
    console.log(`\n📊 Net Balance Accuracy: ${netAccuracy.toFixed(1)}%`);

    if (last194.length > 0) {
        console.log(`📅 Date range: ${last194[last194.length - 1].date} to ${last194[0].date}`);
    }

    console.log('\n📊 Trades by source:');
    const sources = {};
    last194.forEach(t => { sources[t.source] = (sources[t.source] || 0) + 1; });
    Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
        console.log(`   ${s}: ${c}`);
    });

    console.log('\n📝 Sample (first 10):');
    last194.slice(0, 10).forEach((t, i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${t.date} | ${t.type.padEnd(4)} | ${t.solAmount.toFixed(6).padStart(12)} SOL | ${t.source.padEnd(14)} | ${t.token}`);
    });

    console.log('\n✅ Done!');
}

main().catch(console.error);
