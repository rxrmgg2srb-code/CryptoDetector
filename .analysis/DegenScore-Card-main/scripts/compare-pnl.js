/**
 * Comprehensive P&L Analysis Script
 * Target Wallet: B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1
 * 
 * Reference Data (from CSV):
 * - 194 trades (Nov 6 - Dec 10, 2025)
 * - Total Spent: 80.7418 SOL
 * - Total Received: 78.9235 SOL
 * - Net Balance: -1.8184 SOL
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
    startDate: new Date('2025-11-06'),
    endDate: new Date('2025-12-10'),
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

    console.log(`🔄 Fetching transactions for: ${walletAddress}`);
    console.log('='.repeat(70));

    // Fase 1: Fetch SWAPs
    console.log('\n📡 Phase 1: Fetching SWAP transactions...');
    let swapBefore;
    let swapCount = 0;

    for (let batch = 0; batch < 20; batch++) {
        try {
            const swaps = await getWalletTransactions(walletAddress, 100, swapBefore, 'SWAP');
            if (swaps.length === 0) break;

            for (const tx of swaps) {
                if (!seenSignatures.has(tx.signature)) {
                    seenSignatures.add(tx.signature);
                    allTransactions.push(tx);
                    swapCount++;
                }
            }

            swapBefore = swaps[swaps.length - 1]?.signature;
            console.log(`  ✓ SWAP batch ${batch + 1}: ${swaps.length} (Total: ${swapCount})`);

            if (swaps.length < 100) break;
            await new Promise(r => setTimeout(r, 100));
        } catch (error) {
            if (error.message.includes('404')) break;
            break;
        }
    }

    console.log(`📊 Phase 1: ${swapCount} SWAPs found`);

    // Fase 2: Fetch regular transactions
    console.log('\n📡 Phase 2: Fetching regular transactions...');
    let regularBefore;
    let regularCount = 0;

    for (let batch = 0; batch < 50; batch++) {
        try {
            const txs = await getWalletTransactions(walletAddress, 100, regularBefore);
            if (txs.length === 0) break;

            for (const tx of txs) {
                if (!seenSignatures.has(tx.signature)) {
                    seenSignatures.add(tx.signature);
                    allTransactions.push(tx);
                    regularCount++;
                }
            }

            regularBefore = txs[txs.length - 1]?.signature;

            if (batch % 10 === 0) {
                console.log(`  ✓ Batch ${batch + 1}: Total ${allTransactions.length}`);
            }

            // Stop if we've gone past our date range
            const oldestTx = txs[txs.length - 1];
            if (oldestTx && new Date(oldestTx.timestamp * 1000) < new Date('2025-11-01')) {
                console.log(`  ⏱️ Reached November cutoff`);
                break;
            }

            await new Promise(r => setTimeout(r, 50));
        } catch (error) {
            break;
        }
    }

    console.log(`📊 Fetch complete: ${allTransactions.length} total transactions`);

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
    const stats = {
        total: transactions.length,
        noTokens: 0,
        noNativeOrWsol: 0,
        noRelevant: 0,
        noPrimary: 0,
        cantClassify: 0,
        dust: 0,
        burned: 0,
        outOfRange: 0,
    };

    // Date range filter (Nov 6 - Dec 10, 2025)
    const startDate = new Date('2025-11-06').getTime() / 1000;
    const endDate = new Date('2025-12-10T23:59:59').getTime() / 1000;

    for (const tx of transactions) {
        // Date filter
        if (tx.timestamp < startDate || tx.timestamp > endDate) {
            stats.outOfRange++;
            continue;
        }

        // Skip BURN
        if (tx.type === 'BURN') {
            stats.burned++;
            continue;
        }

        // Must have token transfers
        if (!tx.tokenTransfers?.length) {
            stats.noTokens++;
            continue;
        }

        // Check for WSOL in token transfers
        const hasWsolInTransfers = tx.tokenTransfers.some(t => t.mint === WSOL_MINT);
        const hasNativeTransfers = tx.nativeTransfers?.length > 0;

        if (!hasNativeTransfers && !hasWsolInTransfers) {
            stats.noNativeOrWsol++;
            continue;
        }

        // Get relevant token transfers
        const relevantTransfers = tx.tokenTransfers.filter(
            t => t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress
        );

        if (relevantTransfers.length === 0) {
            stats.noRelevant++;
            continue;
        }

        // Calculate token net balances
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

        // Get WSOL net (this IS part of SOL flow)
        const wsolNet = tokenNetBalances.get(WSOL_MINT) || 0;
        tokenNetBalances.delete(WSOL_MINT);

        // Calculate native SOL net
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

        // Effective SOL = Native + WSOL
        const effectiveSolNet = solNet + wsolNet;

        // Find primary token (non-WSOL, non-stablecoin)
        let primaryMint = '';
        let primaryTokenNet = 0;
        for (const [mint, netBalance] of tokenNetBalances.entries()) {
            if (EXCLUDED.has(mint) || mint === WSOL_MINT) continue;
            if (Math.abs(netBalance) > Math.abs(primaryTokenNet)) {
                primaryMint = mint;
                primaryTokenNet = netBalance;
            }
        }

        if (!primaryMint || primaryTokenNet === 0) {
            stats.noPrimary++;
            continue;
        }

        // Detect buy/sell with improved logic
        const TOLERANCE = 0.0001;
        let isBuy = effectiveSolNet < -TOLERANCE && primaryTokenNet > 0;
        let isSell = effectiveSolNet > TOLERANCE && primaryTokenNet < 0;

        // Extended detection for swap-like transactions
        if (!isBuy && !isSell && Math.abs(primaryTokenNet) > 0.001) {
            const isSwapSource = ['SWAP', 'SWAP_AGGREGATOR', 'JUPITER', 'RAYDIUM', 'ORCA',
                'PUMP_FUN', 'PUMP_AMM', 'METEORA', 'LIFINITY'].includes(tx.source || tx.type);
            const hasWsolFlow = Math.abs(wsolNet) > 0.0001;
            const hasSolFlow = Math.abs(effectiveSolNet) > 0.0001;

            if (isSwapSource || hasWsolFlow || hasSolFlow || tx.type === 'SWAP') {
                isBuy = primaryTokenNet > 0;
                isSell = primaryTokenNet < 0;
            }
        }

        if (!isBuy && !isSell) {
            stats.cantClassify++;
            continue;
        }

        const solAmount = Math.abs(effectiveSolNet);

        // Allow smaller amounts (0.0001 SOL minimum)
        if (solAmount < 0.0001) {
            stats.dust++;
            continue;
        }

        trades.push({
            timestamp: tx.timestamp,
            date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            type: isBuy ? 'BUY' : 'SELL',
            token: primaryMint,
            tokenShort: primaryMint.substring(0, 8) + '...',
            solAmount: solAmount,
            tokenAmount: Math.abs(primaryTokenNet),
            source: tx.source || tx.type,
            signature: tx.signature,
        });
    }

    return { trades, stats };
}

async function main() {
    console.log('🔍 P&L ANALYSIS SCRIPT');
    console.log('='.repeat(70));
    console.log(`📋 Wallet: ${WALLET}`);
    console.log(`📅 Date Range: Nov 6 - Dec 10, 2025`);
    console.log(`📊 Reference: ${REFERENCE.trades} trades, ${REFERENCE.netBalance} SOL net`);
    console.log('='.repeat(70));

    const transactions = await fetchAllTransactions(WALLET);

    console.log('\n' + '='.repeat(70));
    console.log('🔍 EXTRACTING TRADES');
    console.log('='.repeat(70));

    const { trades, stats } = extractTrades(transactions, WALLET);

    // Calculate P&L
    const buys = trades.filter(t => t.type === 'BUY');
    const sells = trades.filter(t => t.type === 'SELL');

    const totalSpent = buys.reduce((sum, t) => sum + t.solAmount, 0);
    const totalReceived = sells.reduce((sum, t) => sum + t.solAmount, 0);
    const netBalance = totalReceived - totalSpent;

    console.log('\n📊 EXTRACTION STATS:');
    console.log(`   Total transactions: ${stats.total}`);
    console.log(`   Out of date range: ${stats.outOfRange}`);
    console.log(`   No token transfers: ${stats.noTokens}`);
    console.log(`   No native/WSOL: ${stats.noNativeOrWsol}`);
    console.log(`   No relevant transfers: ${stats.noRelevant}`);
    console.log(`   No primary token: ${stats.noPrimary}`);
    console.log(`   Can't classify: ${stats.cantClassify}`);
    console.log(`   Dust (<0.0001 SOL): ${stats.dust}`);
    console.log(`   Burned: ${stats.burned}`);

    console.log('\n' + '='.repeat(70));
    console.log('📈 P&L RESULTS');
    console.log('='.repeat(70));

    console.log(`\n🎯 TRADES DETECTED: ${trades.length}`);
    console.log(`   📈 Buys: ${buys.length}`);
    console.log(`   📉 Sells: ${sells.length}`);

    console.log(`\n💰 P&L CALCULATION:`);
    console.log(`   Total Spent (Buys):    ${totalSpent.toFixed(4)} SOL`);
    console.log(`   Total Received (Sells): ${totalReceived.toFixed(4)} SOL`);
    console.log(`   Net Balance:           ${netBalance.toFixed(4)} SOL`);

    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPARISON WITH REFERENCE (CSV)');
    console.log('='.repeat(70));

    const tradesDiff = trades.length - REFERENCE.trades;
    const spentDiff = totalSpent - REFERENCE.totalSpent;
    const receivedDiff = totalReceived - REFERENCE.totalReceived;
    const netDiff = netBalance - REFERENCE.netBalance;

    console.log(`\n| Metric          | Our Result   | CSV Reference | Difference   |`);
    console.log(`|-----------------|--------------|---------------|--------------|`);
    console.log(`| Trades          | ${trades.length.toString().padStart(12)} | ${REFERENCE.trades.toString().padStart(13)} | ${(tradesDiff >= 0 ? '+' : '') + tradesDiff.toString().padStart(11)} |`);
    console.log(`| Total Spent     | ${totalSpent.toFixed(4).padStart(12)} | ${REFERENCE.totalSpent.toFixed(4).padStart(13)} | ${(spentDiff >= 0 ? '+' : '') + spentDiff.toFixed(4).padStart(11)} |`);
    console.log(`| Total Received  | ${totalReceived.toFixed(4).padStart(12)} | ${REFERENCE.totalReceived.toFixed(4).padStart(13)} | ${(receivedDiff >= 0 ? '+' : '') + receivedDiff.toFixed(4).padStart(11)} |`);
    console.log(`| Net Balance     | ${netBalance.toFixed(4).padStart(12)} | ${REFERENCE.netBalance.toFixed(4).padStart(13)} | ${(netDiff >= 0 ? '+' : '') + netDiff.toFixed(4).padStart(11)} |`);

    // Accuracy
    const tradeAccuracy = Math.min(trades.length, REFERENCE.trades) / Math.max(trades.length, REFERENCE.trades) * 100;
    const netAccuracy = 100 - Math.abs(netDiff / REFERENCE.netBalance) * 100;

    console.log(`\n📊 ACCURACY:`);
    console.log(`   Trade count: ${tradeAccuracy.toFixed(1)}%`);
    console.log(`   Net balance: ${netAccuracy.toFixed(1)}%`);

    // Show sample trades
    console.log('\n📝 First 15 trades:');
    console.log('-'.repeat(90));
    trades.slice(0, 15).forEach((t, i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${t.date} | ${t.type.padEnd(4)} | ${t.solAmount.toFixed(6).padStart(12)} SOL | ${t.source.padEnd(12)} | ${t.tokenShort}`);
    });

    console.log('\n📝 Last 15 trades:');
    console.log('-'.repeat(90));
    trades.slice(-15).forEach((t, i) => {
        const num = trades.length - 15 + i + 1;
        console.log(`${num.toString().padStart(2)}. ${t.date} | ${t.type.padEnd(4)} | ${t.solAmount.toFixed(6).padStart(12)} SOL | ${t.source.padEnd(12)} | ${t.tokenShort}`);
    });

    // Group by source
    const sources = {};
    trades.forEach(t => {
        sources[t.source] = (sources[t.source] || 0) + 1;
    });
    console.log('\n📊 Trades by source:');
    Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
        console.log(`   ${source}: ${count}`);
    });

    console.log('\n✅ Analysis complete!');
}

main().catch(console.error);
