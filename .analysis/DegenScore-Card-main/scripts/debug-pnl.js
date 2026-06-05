/**
 * Debug Script: Analyze wallet trades and P&L
 * Run with: node scripts/debug-pnl.js
 */

require('dotenv').config({ path: '.env.local' });

const WALLET = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';

// Excluded tokens (stablecoins, wrapped tokens)
const EXCLUDED_TOKENS = new Set([
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    'So11111111111111111111111111111111111111112',   // WSOL
]);

async function fetchSwaps(wallet, limit = 100, before) {
    const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&type=SWAP&limit=${limit}${before ? `&before=${before}` : ''}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

function analyzeTransaction(tx, wallet) {
    // Get SOL change from accountData
    let solNet = 0;

    if (tx.accountData && tx.accountData.length > 0) {
        const walletData = tx.accountData.find(acc => acc.account === wallet);
        if (walletData && walletData.nativeBalanceChange !== undefined) {
            solNet = walletData.nativeBalanceChange / 1e9;
        }
    }

    // Get token transfers
    const tokenTransfers = tx.tokenTransfers || [];
    const relevantTransfers = tokenTransfers.filter(
        t => t.fromUserAccount === wallet || t.toUserAccount === wallet
    );

    // Calculate net token balances per mint
    const tokenBalances = new Map();

    for (const transfer of relevantTransfers) {
        if (EXCLUDED_TOKENS.has(transfer.mint)) continue;

        const current = tokenBalances.get(transfer.mint)?.net || 0;
        const change = transfer.toUserAccount === wallet
            ? transfer.tokenAmount
            : -transfer.tokenAmount;

        tokenBalances.set(transfer.mint, {
            net: current + change,
            mint: transfer.mint
        });
    }

    // Find primary token (largest absolute movement)
    let primaryMint = '';
    let primaryNet = 0;

    for (const [mint, data] of tokenBalances.entries()) {
        if (Math.abs(data.net) > Math.abs(primaryNet)) {
            primaryMint = mint;
            primaryNet = data.net;
        }
    }

    if (!primaryMint || primaryNet === 0) return null;
    if (Math.abs(solNet) < 0.001) return null; // Dust filter

    // Determine buy/sell
    // Buy = SOL out (negative), tokens in (positive)
    // Sell = SOL in (positive), tokens out (negative)
    const isBuy = solNet < 0 && primaryNet > 0;
    const isSell = solNet > 0 && primaryNet < 0;

    if (!isBuy && !isSell) return null;

    return {
        signature: tx.signature?.substring(0, 12) || 'unknown',
        timestamp: tx.timestamp,
        type: isBuy ? 'buy' : 'sell',
        solAmount: Math.abs(solNet),
        tokenMint: primaryMint.substring(0, 12),
        description: tx.description || 'No description',
    };
}

async function main() {
    console.log('🔍 Analyzing wallet:', WALLET);
    console.log('='.repeat(60));

    if (!HELIUS_API_KEY) {
        console.error('❌ HELIUS_API_KEY not found in environment');
        return;
    }

    const allTrades = [];
    let lastSignature;
    let page = 0;

    // Fetch up to 500 swaps (5 pages of 100)
    while (page < 5) {
        console.log(`\n📄 Fetching page ${page + 1}...`);
        const swaps = await fetchSwaps(WALLET, 100, lastSignature);

        if (swaps.length === 0) break;

        for (const swap of swaps) {
            const trade = analyzeTransaction(swap, WALLET);
            if (trade) {
                allTrades.push(trade);
            }
        }

        lastSignature = swaps[swaps.length - 1]?.signature;
        page++;

        console.log(`   Found ${swaps.length} swaps, ${allTrades.length} valid trades so far`);

        // Rate limiting
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS');
    console.log('='.repeat(60));

    const buys = allTrades.filter(t => t.type === 'buy');
    const sells = allTrades.filter(t => t.type === 'sell');

    const totalSpent = buys.reduce((sum, t) => sum + t.solAmount, 0);
    const totalReceived = sells.reduce((sum, t) => sum + t.solAmount, 0);
    const pnl = totalReceived - totalSpent;

    console.log(`\n🔢 Total Trades Found: ${allTrades.length}`);
    console.log(`   - Buys: ${buys.length}`);
    console.log(`   - Sells: ${sells.length}`);
    console.log(`\n💰 SOL Flow:`);
    console.log(`   - Total Spent (buys): ${totalSpent.toFixed(4)} SOL`);
    console.log(`   - Total Received (sells): ${totalReceived.toFixed(4)} SOL`);
    console.log(`\n📈 P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL`);
    console.log(`   (~$${(pnl * 135).toFixed(2)} USD at $135/SOL)`);

    // Show first 10 trades
    console.log('\n\n📜 Sample Trades (first 10):');
    console.log('-'.repeat(80));

    for (const trade of allTrades.slice(0, 10)) {
        const date = new Date(trade.timestamp * 1000).toISOString().split('T')[0];
        console.log(`${date} | ${trade.type.toUpperCase().padEnd(4)} | ${trade.solAmount.toFixed(4).padStart(10)} SOL | Token: ${trade.tokenMint}`);
    }

    // Show last 10 trades
    console.log('\n\n📜 Sample Trades (last 10):');
    console.log('-'.repeat(80));

    for (const trade of allTrades.slice(-10)) {
        const date = new Date(trade.timestamp * 1000).toISOString().split('T')[0];
        console.log(`${date} | ${trade.type.toUpperCase().padEnd(4)} | ${trade.solAmount.toFixed(4).padStart(10)} SOL | Token: ${trade.tokenMint}`);
    }
}

main().catch(console.error);
