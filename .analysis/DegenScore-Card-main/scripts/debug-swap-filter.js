/**
 * Debug script - fetch SWAP transactions specifically
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function fetchSwaps(walletAddress, limit = 100, before) {
    // Using SWAP type filter
    let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}&type=SWAP`;
    if (before) url += `&before=${before}`;

    const response = await fetch(url);
    if (!response.ok) {
        console.log(`Error: ${response.status} - ${await response.text()}`);
        throw new Error(`Helius error: ${response.status}`);
    }
    return response.json();
}

async function fetchAllTypes(walletAddress, limit = 100, before) {
    // Usando parsedtransactions endpoint con más info
    let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    if (before) url += `&before=${before}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Helius error: ${response.status}`);
    }
    return response.json();
}

async function main() {
    console.log('🔍 Testing SWAP filter for wallet:', WALLET);
    console.log('='.repeat(70));

    // Try fetching SWAPs specifically
    console.log('\n📡 Fetching with type=SWAP filter...');
    try {
        const swaps = await fetchSwaps(WALLET, 100);
        console.log(`Found ${swaps.length} SWAP transactions`);

        if (swaps.length > 0) {
            console.log('\nFirst 5 SWAPs:');
            swaps.slice(0, 5).forEach((tx, i) => {
                console.log(`${i + 1}. ${tx.type} | ${tx.source} | ${tx.signature.substring(0, 20)}... | ${new Date(tx.timestamp * 1000).toLocaleDateString()}`);
                if (tx.tokenTransfers) {
                    console.log(`   Token transfers: ${tx.tokenTransfers.length}`);
                    tx.tokenTransfers.slice(0, 3).forEach(t => {
                        console.log(`     - ${t.mint.substring(0, 8)}... : ${t.tokenAmount.toFixed(4)}`);
                    });
                }
            });
        }
    } catch (e) {
        console.log('SWAP filter error:', e.message);
    }

    // Try the "Enhanced Transactions" endpoint 
    console.log('\n📡 Checking for transactions with tokenTransfers...');
    const allTxs = await fetchAllTypes(WALLET, 100);

    const withTokens = allTxs.filter(tx => tx.tokenTransfers && tx.tokenTransfers.length > 0);
    console.log(`Out of ${allTxs.length} transactions:`);
    console.log(`  - With tokenTransfers: ${withTokens.length}`);
    console.log(`  - Without tokenTransfers: ${allTxs.length - withTokens.length}`);

    if (withTokens.length > 0) {
        console.log('\nTransactions with tokenTransfers:');
        withTokens.slice(0, 10).forEach((tx, i) => {
            console.log(`${i + 1}. Type: ${tx.type.padEnd(15)} | Source: ${(tx.source || 'N/A').padEnd(15)} | ${new Date(tx.timestamp * 1000).toLocaleDateString()}`);
            tx.tokenTransfers.forEach(t => {
                const direction = t.toUserAccount === WALLET ? '📥 IN' : (t.fromUserAccount === WALLET ? '📤 OUT' : '↔️');
                console.log(`   ${direction} ${t.mint.substring(0, 8)}... : ${t.tokenAmount.toFixed(4)}`);
            });
        });
    }

    // Check un sample de "UNKNOWN" para ver qué hay adentro
    console.log('\n📡 Checking UNKNOWN transactions...');
    const unknowns = allTxs.filter(tx => tx.type === 'UNKNOWN');
    console.log(`Found ${unknowns.length} UNKNOWN transactions`);

    if (unknowns.length > 0) {
        console.log('\nFirst UNKNOWN transaction details:');
        const u = unknowns[0];
        console.log(JSON.stringify({
            signature: u.signature?.substring(0, 20),
            type: u.type,
            source: u.source,
            hasTokenTransfers: !!u.tokenTransfers?.length,
            hasNativeTransfers: !!u.nativeTransfers?.length,
            hasAccountData: !!u.accountData?.length,
            description: u.description?.substring(0, 100),
        }, null, 2));
    }

    console.log('\n✅ Done!');
}

main().catch(console.error);
