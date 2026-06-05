/**
 * Improved P&L Analysis - Fix duplicate counting
 * 
 * Key insight: Some transactions have multiple tokenTransfers for the same token
 * We should group by signature and only count once per trade, not per transfer
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

// Reference data from CSV
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

    // Fase 1: Fetch SWAPs
    let swapBefore;
    for (let batch = 0; batch < 20; batch++) {
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
        } catch (error) {
            break;
        }
    }

    console.log(`  ✓ SWAPs: ${seenSignatures.size}`);

    // Fase 2: Fetch regular transactions
    let regularBefore;
    for (let batch = 0; batch < 50; batch++) {
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

            const oldestTx = txs[txs.length - 1];
            if (oldestTx && new Date(oldestTx.timestamp * 1000) < new Date('2025-11-01')) break;

            await new Promise(r => setTimeout(r, 50));
        } catch (error) {
            break;
        }
    }

    console.log(`  ✓ Total: ${allTransactions.length}`);
    return allTransactions.sort((a, b) => a.timestamp - b.timestamp);
}

function extractTrades(transactions, walletAddress) {
    const WSOL_MINT = 'So11111111111111111111111111111111111111112';
    const EXCLUDED = new Set([
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
    ]);

    const trades = [];
    const startDate = new Date('2025-11-06').getTime() / 1000;
    const endDate = new Date('2025-12-10T23:59:59').getTime() / 1000;

    for (const tx of transactions) {
        // Date filter
        if (tx.timestamp < startDate || tx.timestamp > endDate) continue;
        if (tx.type === 'BURN') continue;
        if (!tx.tokenTransfers?.length) continue;

        const hasWsolInTransfers = tx.tokenTransfers.some(t => t.mint === WSOL_MINT);
        const hasNativeTransfers = tx.nativeTransfers?.length > 0;
        if (!hasNativeTransfers && !hasWsolInTransfers) continue;

        const relevantTransfers = tx.tokenTransfers.filter(
            t => t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress
        );
        if (relevantTransfers.length === 0) continue;

        // Calculate NET token balances per mint
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

        // WSOL is part of SOL flow
        const wsolNet = tokenNetBalances.get(WSOL_MINT) || 0;
        tokenNetBalances.delete(WSOL_MINT);

        // Native SOL
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

        const effectiveSolNet = solNet + wsolNet;

        // Find THE primary token (the one we're trading)
        let primaryMint = '';
        let primaryTokenNet = 0;
        for (const [mint, netBalance] of tokenNetBalances.entries()) {
            if (EXCLUDED.has(mint) || mint === WSOL_MINT) continue;
            if (Math.abs(netBalance) > Math.abs(primaryTokenNet)) {
                primaryMint = mint;
                primaryTokenNet = netBalance;
            }
        }

        if (!primaryMint || primaryTokenNet === 0) continue;

        // Determine trade type
        // BUY: SOL goes out (negative), tokens come in (positive)
        // SELL: SOL comes in (positive), tokens go out (negative)
        const TOLERANCE = 0.0001;
        let isBuy = effectiveSolNet < -TOLERANCE && primaryTokenNet > 0;
        let isSell = effectiveSolNet > TOLERANCE && primaryTokenNet < 0;

        // Extended detection
        if (!isBuy && !isSell && Math.abs(primaryTokenNet) > 0.001) {
            const isSwapSource = ['SWAP', 'SWAP_AGGREGATOR', 'JUPITER', 'RAYDIUM', 'ORCA',
                'PUMP_FUN', 'PUMP_AMM', 'METEORA', 'LIFINITY', 'OKX_DEX_ROUTER'].includes(tx.source || tx.type);
            const hasFlow = Math.abs(wsolNet) > 0.0001 || Math.abs(effectiveSolNet) > 0.0001 || tx.type === 'SWAP';

            if (isSwapSource || hasFlow) {
                isBuy = primaryTokenNet > 0;
                isSell = primaryTokenNet < 0;
            }
        }

        if (!isBuy && !isSell) continue;

        const solAmount = Math.abs(effectiveSolNet);
        if (solAmount < 0.0001) continue;

        // 🔑 KEY FIX: Each transaction = ONE trade
        // Even if there are multiple tokenTransfers, it's one atomic trade
        trades.push({
            signature: tx.signature,
            timestamp: tx.timestamp,
            date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            type: isBuy ? 'BUY' : 'SELL',
            token: primaryMint,
            tokenShort: primaryMint.substring(0, 8) + '...',
            solAmount: solAmount,
            tokenAmount: Math.abs(primaryTokenNet),
            source: tx.source || tx.type,
        });
    }

    return trades;
}

async function main() {
    console.log('🔍 IMPROVED P&L ANALYSIS (v2)');
    console.log('='.repeat(70));
    console.log(`📋 Wallet: ${WALLET}`);
    console.log(`📅 Date Range: Nov 6 - Dec 10, 2025`);
    console.log(`📊 Reference: ${REFERENCE.trades} trades, ${REFERENCE.netBalance} SOL`);
    console.log('='.repeat(70));

    const transactions = await fetchAllTransactions(WALLET);
    const trades = extractTrades(transactions, WALLET);

    // P&L Calculation
    const buys = trades.filter(t => t.type === 'BUY');
    const sells = trades.filter(t => t.type === 'SELL');

    const totalSpent = buys.reduce((sum, t) => sum + t.solAmount, 0);
    const totalReceived = sells.reduce((sum, t) => sum + t.solAmount, 0);
    const netBalance = totalReceived - totalSpent;

    console.log('\n' + '='.repeat(70));
    console.log('📈 P&L RESULTS (v2 - Grouped by Signature)');
    console.log('='.repeat(70));

    console.log(`\n🎯 TRADES: ${trades.length} (Ref: ${REFERENCE.trades}, Diff: ${trades.length - REFERENCE.trades})`);
    console.log(`   📈 Buys: ${buys.length}`);
    console.log(`   📉 Sells: ${sells.length}`);

    console.log(`\n💰 P&L:`);
    console.log(`   Spent:    ${totalSpent.toFixed(4)} SOL (Ref: ${REFERENCE.totalSpent}, Diff: ${(totalSpent - REFERENCE.totalSpent).toFixed(4)})`);
    console.log(`   Received: ${totalReceived.toFixed(4)} SOL (Ref: ${REFERENCE.totalReceived}, Diff: ${(totalReceived - REFERENCE.totalReceived).toFixed(4)})`);
    console.log(`   Net:      ${netBalance.toFixed(4)} SOL (Ref: ${REFERENCE.netBalance}, Diff: ${(netBalance - REFERENCE.netBalance).toFixed(4)})`);

    // Analyze why we have more trades
    console.log('\n📊 Trades by source:');
    const sources = {};
    trades.forEach(t => {
        sources[t.source] = (sources[t.source] || 0) + 1;
    });
    Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
        console.log(`   ${source}: ${count}`);
    });

    // Check for potential issues
    console.log('\n🔍 Looking for anomalies...');

    // 1. Find transactions with multiple tokens traded (might be wrong)
    const txWithMultiTokens = transactions.filter(tx => {
        if (!tx.tokenTransfers?.length) return false;
        const tokensInvolved = new Set();
        const WSOL_MINT = 'So11111111111111111111111111111111111111112';
        tx.tokenTransfers.forEach(t => {
            if (t.mint !== WSOL_MINT &&
                (t.fromUserAccount === WALLET || t.toUserAccount === WALLET)) {
                tokensInvolved.add(t.mint);
            }
        });
        return tokensInvolved.size > 1;
    });
    console.log(`   Transactions with multiple tokens: ${txWithMultiTokens.length}`);

    // 2. Find small trades that might be dust
    const smallTrades = trades.filter(t => t.solAmount < 0.01);
    console.log(`   Small trades (<0.01 SOL): ${smallTrades.length}`);

    // 3. Find SYSTEM_PROGRAM or UNKNOWN sources
    const unknownTrades = trades.filter(t => t.source === 'SYSTEM_PROGRAM' || t.source === 'UNKNOWN');
    console.log(`   SYSTEM_PROGRAM/UNKNOWN trades: ${unknownTrades.length}`);

    // Show some trades from SYSTEM_PROGRAM
    if (unknownTrades.length > 0) {
        console.log('\n   Sample SYSTEM_PROGRAM/UNKNOWN trades:');
        unknownTrades.slice(0, 5).forEach(t => {
            console.log(`     ${t.date} | ${t.type} | ${t.solAmount.toFixed(4)} SOL | ${t.tokenShort}`);
        });
    }

    // List unique tokens traded
    const uniqueTokens = new Set(trades.map(t => t.token));
    console.log(`\n📋 Unique tokens traded: ${uniqueTokens.size}`);

    console.log('\n✅ Done!');
}

main().catch(console.error);
