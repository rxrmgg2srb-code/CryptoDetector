/**
 * FETCH BY SIGNATURE BATCH
 * Analyze ALL transactions by fetching details directly
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

const WSOL = 'So11111111111111111111111111111111111111112';

async function getHeliusTxs(wallet, limit = 100, before) {
    let url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    if (before) url += `&before=${before}`;
    const res = await fetch(url);
    return res.json();
}

async function getTransactionDetails(signatures) {
    const url = `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: signatures })
    });

    if (!response.ok) return [];
    return response.json();
}

function analyzeTransaction(tx, walletAddress) {
    if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) return null;

    // Calculate WSOL flows
    let wsolIn = 0;
    let wsolOut = 0;

    // Track all non-WSOL tokens
    const tokenFlows = new Map();

    for (const t of tx.tokenTransfers) {
        if (t.toUserAccount === walletAddress) {
            if (t.mint === WSOL) {
                wsolIn += t.tokenAmount;
            } else {
                tokenFlows.set(t.mint, (tokenFlows.get(t.mint) || 0) + t.tokenAmount);
            }
        }
        if (t.fromUserAccount === walletAddress) {
            if (t.mint === WSOL) {
                wsolOut += t.tokenAmount;
            } else {
                tokenFlows.set(t.mint, (tokenFlows.get(t.mint) || 0) - t.tokenAmount);
            }
        }
    }

    // Find main token
    let mainToken = null;
    let mainTokenFlow = 0;

    const EXCLUDED = new Set([
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    ]);

    for (const [mint, flow] of tokenFlows.entries()) {
        if (EXCLUDED.has(mint)) continue;
        if (Math.abs(flow) > Math.abs(mainTokenFlow)) {
            mainToken = mint;
            mainTokenFlow = flow;
        }
    }

    if (!mainToken) return null;

    // Determine type based on token flow
    const type = mainTokenFlow > 0 ? 'BUY' : 'SELL';

    // For SOL amount, use the RELEVANT flow direction
    let solAmount;
    if (type === 'BUY') {
        solAmount = wsolOut;
    } else {
        solAmount = wsolIn;
    }

    // Skip if no meaningful SOL amount
    if (solAmount < 0.001) return null;

    return {
        type,
        solAmount,
        tokenMint: mainToken,
        tokenAmount: Math.abs(mainTokenFlow),
        date: new Date(tx.timestamp * 1000),
        signature: tx.signature,
        source: tx.source
    };
}

async function main() {
    console.log('💰 COMPREHENSIVE TRADE ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Wallet: ${WALLET}\n`);

    // Fetch all transaction signatures first
    console.log('📡 Step 1: Fetching all transaction signatures...');

    let allSignatures = [];
    let before;

    for (let i = 0; i < 50; i++) {
        const txs = await getHeliusTxs(WALLET, 100, before);
        if (!txs || txs.length === 0) break;

        // Only keep signatures of transactions with tokenTransfers
        for (const tx of txs) {
            if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
                allSignatures.push(tx.signature);
            }
        }

        before = txs[txs.length - 1]?.signature;
        if (i % 10 === 0) process.stdout.write('.');
        if (txs.length < 100) break;
        await new Promise(r => setTimeout(r, 50));
    }

    console.log(`\n✅ Found ${allSignatures.length} transactions with token transfers`);

    // Fetch full details in batches
    console.log('\n📡 Step 2: Fetching full transaction details...');

    const batchSize = 100;
    let allTxDetails = [];

    for (let i = 0; i < allSignatures.length; i += batchSize) {
        const batch = allSignatures.slice(i, i + batchSize);
        const details = await getTransactionDetails(batch);
        allTxDetails = allTxDetails.concat(details);
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n✅ Retrieved ${allTxDetails.length} full transaction details`);

    // Sort by timestamp descending
    allTxDetails.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Analyze for trades
    console.log('\n📡 Step 3: Analyzing trades...');

    const trades = [];

    for (const tx of allTxDetails) {
        const trade = analyzeTransaction(tx, WALLET);
        if (trade) trades.push(trade);
    }

    console.log(`✅ Valid trades extracted: ${trades.length}\n`);

    // Take first 40
    const first40 = trades.slice(0, 40);

    // Calculate totals
    let totalSpent = 0;
    let totalReceived = 0;

    first40.forEach(t => {
        if (t.type === 'BUY') totalSpent += t.solAmount;
        else totalReceived += t.solAmount;
    });

    console.log('='.repeat(70));
    console.log('📊 FIRST 40 TRADES RESULTS');
    console.log('='.repeat(70));

    console.log(`\n🔢 Trades Analyzed: ${first40.length}`);
    console.log(`   └─ Buys:  ${first40.filter(t => t.type === 'BUY').length}`);
    console.log(`   └─ Sells: ${first40.filter(t => t.type === 'SELL').length}`);

    console.log(`\n💸 Total Spent (Buys):     ${totalSpent.toFixed(4)} SOL`);
    console.log(`💰 Total Received (Sells): ${totalReceived.toFixed(4)} SOL`);
    console.log('─'.repeat(40));

    const net = totalReceived - totalSpent;
    console.log(`${net >= 0 ? '🟢' : '🔴'} Net P&L: ${net.toFixed(4)} SOL`);

    // Date range
    if (first40.length > 0) {
        const newest = first40[0].date.toISOString().split('T')[0];
        const oldest = first40[first40.length - 1].date.toISOString().split('T')[0];
        console.log(`\n📅 Date Range: ${oldest} to ${newest}`);
    }

    // Show all 40 trades
    console.log('\n📝 ALL 40 TRADES:');
    console.log('─'.repeat(95));
    console.log('#   | Date       | Type | SOL Amount  | Token Amount     | Source         | Token');
    console.log('─'.repeat(95));

    first40.forEach((t, i) => {
        const date = t.date.toISOString().split('T')[0];
        const tokenAmt = t.tokenAmount > 1000000 ? (t.tokenAmount / 1000000).toFixed(2) + 'M' :
            t.tokenAmount > 1000 ? (t.tokenAmount / 1000).toFixed(2) + 'K' :
                t.tokenAmount.toFixed(2);
        console.log(`${(i + 1).toString().padStart(3)} | ${date} | ${t.type.padEnd(4)} | ${t.solAmount.toFixed(4).padStart(10)} | ${tokenAmt.padStart(14)} | ${(t.source || 'N/A').padEnd(14)} | ${t.tokenMint.substring(0, 8)}...`);
    });
}

main().catch(console.error);
