/**
 * Debug script to test trade detection for a wallet
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function fetchTransactions(walletAddress, limit = 100, before) {
    let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    if (before) url += `&before=${before}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Helius error: ${response.status}`);
    }
    return response.json();
}

async function analyzeWallet() {
    console.log('🔍 Analyzing wallet:', WALLET);
    console.log('📅 Date:', new Date().toISOString());
    console.log('');

    // Fetch all transactions (up to 500)
    let allTxs = [];
    let before = undefined;

    for (let i = 0; i < 5; i++) {
        console.log(`📡 Fetching batch ${i + 1}...`);
        const batch = await fetchTransactions(WALLET, 100, before);
        if (batch.length === 0) break;
        allTxs.push(...batch);
        before = batch[batch.length - 1]?.signature;
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n📊 Total transactions fetched: ${allTxs.length}\n`);

    // Analyze transaction types
    const types = {};
    const sources = {};

    for (const tx of allTxs) {
        types[tx.type] = (types[tx.type] || 0) + 1;
        if (tx.source) sources[tx.source] = (sources[tx.source] || 0) + 1;
    }

    console.log('📋 Transaction Types:');
    Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
    });

    console.log('\n📋 Sources:');
    Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
        console.log(`   ${source}: ${count}`);
    });

    // WSOL detection
    const WSOL_MINT = 'So11111111111111111111111111111111111111112';

    // Excluded tokens (stablecoins, wrapped tokens, etc.)
    const EXCLUDED_TOKENS = new Set([
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        WSOL_MINT, // Wrapped SOL
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
    ]);

    // Apply trade detection logic
    const trades = [];
    let stats = {
        noTokenTransfers: 0,
        noNativeOrWsol: 0,
        noRelevantTransfers: 0,
        noToken: 0,
        cantClassify: 0,
        dust: 0,
        sanity: 0,
    };

    for (const tx of allTxs) {
        // Skip BURN
        if (tx.type === 'BURN') continue;

        // Must have token transfers
        if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) {
            stats.noTokenTransfers++;
            continue;
        }

        // Check for WSOL in token transfers
        const hasWsolInTransfers = tx.tokenTransfers.some(t => t.mint === WSOL_MINT);
        const hasNativeTransfers = tx.nativeTransfers && tx.nativeTransfers.length > 0;

        if (!hasNativeTransfers && !hasWsolInTransfers) {
            stats.noNativeOrWsol++;
            continue;
        }

        // Get relevant token transfers for this wallet
        const relevantTransfers = tx.tokenTransfers.filter(
            t => t.fromUserAccount === WALLET || t.toUserAccount === WALLET
        );

        if (relevantTransfers.length === 0) {
            stats.noRelevantTransfers++;
            continue;
        }

        // Calculate net token balances
        const tokenNetBalances = new Map();
        for (const transfer of relevantTransfers) {
            const current = tokenNetBalances.get(transfer.mint) || 0;
            if (transfer.toUserAccount === WALLET) {
                tokenNetBalances.set(transfer.mint, current + transfer.tokenAmount);
            }
            if (transfer.fromUserAccount === WALLET) {
                tokenNetBalances.set(transfer.mint, current - transfer.tokenAmount);
            }
        }

        // Get WSOL net
        let wsolNet = tokenNetBalances.get(WSOL_MINT) || 0;
        tokenNetBalances.delete(WSOL_MINT);

        // Calculate native SOL net
        let solNet = 0;
        if (tx.accountData && tx.accountData.length > 0) {
            const walletData = tx.accountData.find(acc => acc.account === WALLET);
            if (walletData && walletData.nativeBalanceChange) {
                solNet = walletData.nativeBalanceChange / 1e9;
            }
        }
        if (solNet === 0 && tx.nativeTransfers) {
            for (const nt of tx.nativeTransfers) {
                if (nt.fromUserAccount === WALLET) solNet -= nt.amount / 1e9;
                if (nt.toUserAccount === WALLET) solNet += nt.amount / 1e9;
            }
        }

        const effectiveSolNet = solNet + wsolNet;

        // Find primary token (non-excluded)
        let primaryMint = '';
        let primaryTokenNet = 0;
        for (const [mint, netBalance] of tokenNetBalances.entries()) {
            if (EXCLUDED_TOKENS.has(mint)) continue;
            if (Math.abs(netBalance) > Math.abs(primaryTokenNet)) {
                primaryMint = mint;
                primaryTokenNet = netBalance;
            }
        }

        if (!primaryMint || primaryTokenNet === 0) {
            stats.noToken++;
            continue;
        }

        // Detect buy/sell
        const TOLERANCE = 0.0001;
        let isBuy = effectiveSolNet < -TOLERANCE && primaryTokenNet > 0;
        let isSell = effectiveSolNet > TOLERANCE && primaryTokenNet < 0;

        // Improved detection for WSOL-based swaps
        if (!isBuy && !isSell && Math.abs(primaryTokenNet) > 1) {
            const isSwapType = tx.type === 'SWAP' || tx.type === 'SWAP_AGGREGATOR' ||
                tx.source === 'JUPITER' || tx.source === 'RAYDIUM';
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

        // Skip dust
        if (solAmount < 0.001) {
            stats.dust++;
            continue;
        }

        trades.push({
            type: isBuy ? 'BUY' : 'SELL',
            token: primaryMint.substring(0, 8) + '...',
            solAmount: solAmount.toFixed(4),
            tokenAmount: Math.abs(primaryTokenNet).toFixed(2),
            source: tx.source || tx.type,
            signature: tx.signature.substring(0, 12) + '...',
            timestamp: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
        });
    }

    console.log('\n' + '='.repeat(70));
    console.log(`🎯 TRADES DETECTED: ${trades.length}`);
    console.log('='.repeat(70));

    console.log('\n📊 Skipped stats:');
    console.log(`   No token transfers: ${stats.noTokenTransfers}`);
    console.log(`   No native/WSOL:     ${stats.noNativeOrWsol}`);
    console.log(`   No relevant txfers: ${stats.noRelevantTransfers}`);
    console.log(`   No primary token:   ${stats.noToken}`);
    console.log(`   Can't classify:     ${stats.cantClassify}`);
    console.log(`   Dust (<0.001 SOL):  ${stats.dust}`);

    console.log('\n📝 Detected trades (last 20):');
    console.log('-'.repeat(70));

    const buys = trades.filter(t => t.type === 'BUY').length;
    const sells = trades.filter(t => t.type === 'SELL').length;
    console.log(`   📈 Buys: ${buys}  |  📉 Sells: ${sells}`);
    console.log('-'.repeat(70));

    trades.slice(0, 20).forEach((trade, i) => {
        console.log(`${i + 1}. ${trade.type.padEnd(4)} | ${trade.solAmount.padStart(8)} SOL | ${trade.source.padEnd(12)} | ${trade.timestamp} | ${trade.token}`);
    });

    if (trades.length > 20) {
        console.log(`   ... and ${trades.length - 20} more trades`);
    }

    console.log('\n✅ Analysis complete!');
}

analyzeWallet().catch(console.error);
