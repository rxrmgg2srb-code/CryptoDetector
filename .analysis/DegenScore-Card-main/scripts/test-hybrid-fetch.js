/**
 * Test the improved hybrid fetch with the actual metricsEngine
 */
require('dotenv').config({ path: '.env.local' });

// Simulating what the metricsEngine does
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function getWalletTransactions(walletAddress, limit = 100, before, type) {
    let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    if (before) url += `&before=${before}`;
    if (type) url += `&type=${type}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

async function hybridFetch(walletAddress) {
    const allTransactions = [];
    const seenSignatures = new Set();

    const BATCH_SIZE = 100;
    const DELAY_MS = 50;
    const TIME_LIMIT_MS = 55000;
    const startTime = Date.now();
    const TWELVE_MONTHS_AGO = Date.now() / 1000 - (365 * 24 * 60 * 60);

    console.log(`🔄 HYBRID FETCH for: ${walletAddress}`);
    console.log('='.repeat(70));

    // ========== FASE 1: Fetch SWAPs ===========
    console.log('\n📡 Phase 1: Fetching SWAP transactions...');

    let swapBefore;
    let swapCount = 0;
    let consecutiveErrors = 0;

    for (let batch = 0; batch < 10; batch++) {
        if (Date.now() - startTime > TIME_LIMIT_MS / 2) break;

        try {
            const swaps = await getWalletTransactions(walletAddress, BATCH_SIZE, swapBefore, 'SWAP');

            if (swaps.length === 0) break;

            for (const tx of swaps) {
                if (!seenSignatures.has(tx.signature) && tx.timestamp >= TWELVE_MONTHS_AGO) {
                    seenSignatures.add(tx.signature);
                    allTransactions.push(tx);
                    swapCount++;
                }
            }

            swapBefore = swaps[swaps.length - 1]?.signature;
            consecutiveErrors = 0;

            console.log(`  ✓ SWAP batch ${batch + 1}: ${swaps.length} (Total SWAPs: ${swapCount})`);

            if (swaps.length < BATCH_SIZE) break;

            await new Promise(r => setTimeout(r, DELAY_MS));
        } catch (error) {
            consecutiveErrors++;
            if (consecutiveErrors >= 3 || error.message.includes('404')) break;
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log(`📊 Phase 1 complete: ${swapCount} SWAP transactions`);

    // ========== FASE 2: Fetch transacciones regulares ===========
    console.log('\n📡 Phase 2: Fetching regular transactions...');

    let regularBefore;
    let regularCount = 0;
    consecutiveErrors = 0;
    const MAX_REGULAR = 3000;

    for (let batch = 0; batch < 30; batch++) {
        if (Date.now() - startTime > TIME_LIMIT_MS) break;
        if (regularCount >= MAX_REGULAR) break;

        try {
            const txs = await getWalletTransactions(walletAddress, BATCH_SIZE, regularBefore);

            if (txs.length === 0) break;

            const oldestTxTimestamp = txs[txs.length - 1]?.timestamp;
            if (oldestTxTimestamp && oldestTxTimestamp < TWELVE_MONTHS_AGO) {
                const recentTxs = txs.filter(tx => tx.timestamp >= TWELVE_MONTHS_AGO);
                for (const tx of recentTxs) {
                    if (!seenSignatures.has(tx.signature)) {
                        seenSignatures.add(tx.signature);
                        allTransactions.push(tx);
                        regularCount++;
                    }
                }
                console.log(`  ⏱️ Reached 12-month limit`);
                break;
            }

            for (const tx of txs) {
                if (!seenSignatures.has(tx.signature)) {
                    seenSignatures.add(tx.signature);
                    allTransactions.push(tx);
                    regularCount++;
                }
            }

            regularBefore = txs[txs.length - 1]?.signature;

            if (batch % 5 === 0) {
                console.log(`  ✓ Regular batch ${batch + 1}: ${txs.length} (Total: ${allTransactions.length})`);
            }

            await new Promise(r => setTimeout(r, 10));
        } catch (error) {
            consecutiveErrors++;
            if (consecutiveErrors >= 5) break;
            await new Promise(r => setTimeout(r, 300));
        }
    }

    console.log(`\n📊 Fetch complete: ${allTransactions.length} total (${swapCount} SWAPs + ${regularCount} regular)`);

    return allTransactions;
}

// Simplified trade extraction
function extractTrades(transactions, walletAddress) {
    const WSOL_MINT = 'So11111111111111111111111111111111111111112';
    const EXCLUDED = new Set([
        WSOL_MINT,
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    ]);

    const trades = [];
    const stats = { noTokens: 0, noNative: 0, noRelevant: 0, noPrimary: 0, cantClassify: 0, dust: 0 };

    for (const tx of transactions) {
        if (tx.type === 'BURN') continue;

        if (!tx.tokenTransfers?.length) {
            stats.noTokens++;
            continue;
        }

        const hasWsolInTransfers = tx.tokenTransfers.some(t => t.mint === WSOL_MINT);
        const hasNativeTransfers = tx.nativeTransfers?.length > 0;

        if (!hasNativeTransfers && !hasWsolInTransfers) {
            stats.noNative++;
            continue;
        }

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

        // Get WSOL net
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

        const effectiveSolNet = solNet + wsolNet;

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

        if (!primaryMint || primaryTokenNet === 0) {
            stats.noPrimary++;
            continue;
        }

        // Detect buy/sell
        const TOLERANCE = 0.0001;
        let isBuy = effectiveSolNet < -TOLERANCE && primaryTokenNet > 0;
        let isSell = effectiveSolNet > TOLERANCE && primaryTokenNet < 0;

        // Improved detection
        if (!isBuy && !isSell && Math.abs(primaryTokenNet) > 1) {
            const isSwapType = tx.type === 'SWAP' || tx.type === 'SWAP_AGGREGATOR' ||
                tx.source === 'JUPITER' || tx.source === 'RAYDIUM' || tx.source === 'PUMP_AMM';
            const hasWsolFlow = Math.abs(wsolNet) > 0.001;
            const hasSolFlow = Math.abs(effectiveSolNet) > 0.001;

            if (isSwapType || hasWsolFlow || hasSolFlow) {
                isBuy = primaryTokenNet > 0;
                isSell = primaryTokenNet < 0;
            }
        }

        if (!isBuy && !isSell) {
            stats.cantClassify++;
            continue;
        }

        const solAmount = Math.abs(effectiveSolNet);
        if (solAmount < 0.001) {
            stats.dust++;
            continue;
        }

        trades.push({
            timestamp: tx.timestamp,
            type: isBuy ? 'BUY' : 'SELL',
            token: primaryMint.substring(0, 12) + '...',
            solAmount: solAmount.toFixed(4),
            tokenAmount: Math.abs(primaryTokenNet).toFixed(2),
            source: tx.source || tx.type,
            date: new Date(tx.timestamp * 1000).toLocaleDateString(),
        });
    }

    return { trades, stats };
}

async function main() {
    const transactions = await hybridFetch(WALLET);

    console.log('\n' + '='.repeat(70));
    console.log('🔍 TRADE EXTRACTION');
    console.log('='.repeat(70));

    const { trades, stats } = extractTrades(transactions, WALLET);

    console.log(`\n🎯 TRADES DETECTED: ${trades.length}`);
    console.log(`   📈 Buys: ${trades.filter(t => t.type === 'BUY').length}`);
    console.log(`   📉 Sells: ${trades.filter(t => t.type === 'SELL').length}`);

    console.log('\n📊 Skipped stats:');
    Object.entries(stats).forEach(([key, val]) => {
        console.log(`   ${key}: ${val}`);
    });

    if (trades.length > 0) {
        console.log('\n📝 Trades:');
        console.log('-'.repeat(70));
        trades.slice(0, 30).forEach((t, i) => {
            console.log(`${(i + 1).toString().padStart(2)}. ${t.date} | ${t.type.padEnd(4)} | ${t.solAmount.padStart(10)} SOL | ${t.source.padEnd(10)} | ${t.token}`);
        });
        if (trades.length > 30) {
            console.log(`   ... and ${trades.length - 30} more trades`);
        }
    }

    console.log('\n✅ Done!');
}

main().catch(console.error);
