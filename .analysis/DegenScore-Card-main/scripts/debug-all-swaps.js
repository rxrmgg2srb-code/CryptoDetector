/**
 * Fetch ALL SWAP transactions (paginated)
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function fetchSwaps(walletAddress, before) {
    let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=100&type=SWAP`;
    if (before) url += `&before=${before}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

async function main() {
    console.log('🔍 Fetching ALL SWAP transactions for:', WALLET);
    console.log('='.repeat(70));

    let allSwaps = [];
    let before = undefined;

    for (let i = 0; i < 20; i++) {
        console.log(`📡 Batch ${i + 1}...`);
        const batch = await fetchSwaps(WALLET, before);
        console.log(`   Found ${batch.length} SWAPs`);

        if (batch.length === 0) break;
        allSwaps.push(...batch);
        before = batch[batch.length - 1]?.signature;
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n📊 Total SWAP transactions: ${allSwaps.length}`);

    // Sources
    const sources = {};
    allSwaps.forEach(tx => {
        sources[tx.source] = (sources[tx.source] || 0) + 1;
    });
    console.log('📋 Sources:', sources);

    // Time range
    if (allSwaps.length > 0) {
        const oldest = new Date(allSwaps[allSwaps.length - 1].timestamp * 1000);
        const newest = new Date(allSwaps[0].timestamp * 1000);
        console.log(`📅 Time range: ${oldest.toLocaleDateString()} - ${newest.toLocaleDateString()}`);
    }

    // Analyze trades
    console.log('\n🎯 SWAP Details:');
    console.log('-'.repeat(70));

    const trades = [];

    for (const tx of allSwaps) {
        if (!tx.tokenTransfers?.length) continue;

        // Find non-WSOL tokens
        const WSOL = 'So11111111111111111111111111111111111111112';
        const tokenTransfers = tx.tokenTransfers.filter(t =>
            t.mint !== WSOL &&
            (t.fromUserAccount === WALLET || t.toUserAccount === WALLET)
        );

        for (const t of tokenTransfers) {
            const isBuy = t.toUserAccount === WALLET;
            trades.push({
                date: new Date(tx.timestamp * 1000).toLocaleDateString(),
                type: isBuy ? 'BUY' : 'SELL',
                token: t.mint.substring(0, 12) + '...',
                amount: t.tokenAmount,
                source: tx.source,
            });
        }
    }

    console.log(`\n📈 Total trades extracted: ${trades.length}`);
    console.log(`   Buys: ${trades.filter(t => t.type === 'BUY').length}`);
    console.log(`   Sells: ${trades.filter(t => t.type === 'SELL').length}`);

    console.log('\n📝 Trades:');
    trades.forEach((t, i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${t.date} | ${t.type.padEnd(4)} | ${t.amount.toFixed(2).padStart(15)} | ${t.source} | ${t.token}`);
    });

    console.log('\n✅ Done!');
}

main().catch(console.error);
