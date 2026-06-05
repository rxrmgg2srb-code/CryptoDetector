/**
 * Deep analysis - fetch transactions in chunks and look for any with tokens
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

async function fetchBatch(walletAddress, limit = 100, before) {
    let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    if (before) url += `&before=${before}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

// Try parsing specific transactions
async function parseTransaction(signature) {
    const url = `https://api.helius.xyz/v0/transactions?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [signature] })
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

async function main() {
    console.log('🔍 Deep analysis for:', WALLET);
    console.log('='.repeat(70));

    // Fetch many batches
    let allTxs = [];
    let before = undefined;

    for (let i = 0; i < 20; i++) { // Up to 2000 transactions
        console.log(`📡 Batch ${i + 1}/20...`);
        const batch = await fetchBatch(WALLET, 100, before);
        if (batch.length === 0) {
            console.log('   No more transactions');
            break;
        }
        allTxs.push(...batch);
        before = batch[batch.length - 1]?.signature;

        // Progress: show transactions with tokenTransfers
        const withTokens = batch.filter(tx => tx.tokenTransfers?.length > 0);
        if (withTokens.length > 0) {
            console.log(`   ✅ Found ${withTokens.length} with tokenTransfers!`);
        }

        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n📊 Total fetched: ${allTxs.length}`);

    // Analyze types
    const typeCounts = {};
    const sourceCounts = {};

    allTxs.forEach(tx => {
        typeCounts[tx.type] = (typeCounts[tx.type] || 0) + 1;
        if (tx.source) sourceCounts[tx.source] = (sourceCounts[tx.source] || 0) + 1;
    });

    console.log('\n📋 Types:', typeCounts);
    console.log('📋 Sources:', Object.entries(sourceCounts).slice(0, 5));

    // Filter transactions with tokenTransfers
    const withTokens = allTxs.filter(tx => tx.tokenTransfers?.length > 0);
    console.log(`\n🎯 Transactions with tokenTransfers: ${withTokens.length}`);

    if (withTokens.length === 0) {
        console.log('\n⚠️ No tokenTransfers found in normal endpoint.');
        console.log('Trying to parse a known swap signature...');

        // The SWAP txs we found earlier
        const knownSwaps = [
            '5LLRLgCeqU1njnJbWvCSPdhyJjhGaWFrDTcmCTKaWLhc3rKQp1ELkYqvqepqg89zLPpDKyYhVpZGr26F1xT8QKNY',
            '125Popzmxoh77itG4hQYReE4wNxDe3ZPr7LdMGT1t2LvuKK3QWMU8xDPcEogihGmeLYwrKc3LM7cJzHEU7Fo5PjU'
        ];

        // Show oldest transactions to find where the trades are
        console.log('\n📅 Oldest 10 transactions:');
        const oldest = allTxs.slice(-10);
        oldest.forEach((tx, i) => {
            console.log(`${i + 1}. ${new Date(tx.timestamp * 1000).toLocaleDateString()} | ${tx.type} | ${tx.signature.substring(0, 20)}...`);
        });

        console.log('\n📅 Most recent 10 transactions:');
        const newest = allTxs.slice(0, 10);
        newest.forEach((tx, i) => {
            console.log(`${i + 1}. ${new Date(tx.timestamp * 1000).toLocaleDateString()} | ${tx.type} | ${tx.signature.substring(0, 20)}...`);
        });

    } else {
        // Show the trades
        console.log('\n🎯 Trades found:');
        withTokens.slice(0, 20).forEach((tx, i) => {
            console.log(`${i + 1}. ${tx.type} | ${tx.source} | ${new Date(tx.timestamp * 1000).toLocaleDateString()}`);
            tx.tokenTransfers.forEach(t => {
                const dir = t.toUserAccount === WALLET ? 'IN ' : (t.fromUserAccount === WALLET ? 'OUT' : '???');
                if (!t.mint.startsWith('So111')) { // Skip WSOL
                    console.log(`   ${dir}: ${t.mint.substring(0, 12)}... = ${t.tokenAmount?.toFixed?.(4) || t.tokenAmount}`);
                }
            });
        });
    }

    // Check time range
    if (allTxs.length > 0) {
        const oldest = new Date(allTxs[allTxs.length - 1].timestamp * 1000);
        const newest = new Date(allTxs[0].timestamp * 1000);
        console.log(`\n📅 Time range: ${oldest.toLocaleDateString()} - ${newest.toLocaleDateString()}`);

        const daysAgo = Math.floor((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`📅 Oldest transaction: ${daysAgo} days ago`);
    }

    console.log('\n✅ Done!');
}

main().catch(console.error);
