/**
 * SURGICAL PRECISION ANALYZER
 * Feature: Subtracts Transaction Fees (including Priority Fees).
 * Feature: Precise Wrap Filtering.
 * Goal: Match +40.22 SOL P&L exactly.
 */
require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';
const WSOL = 'So11111111111111111111111111111111111111112';

const RAW_SIGNATURES = [
    '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'
];

async function getTransactionDetails(signatures) {
    const url = `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST', body: JSON.stringify({ transactions: signatures })
    });
    if (!response.ok) {
        if (response.status === 429) {
            await new Promise(r => setTimeout(r, 2000));
            return getTransactionDetails(signatures);
        }
        return [];
    }
    return response.json();
}

function analyzeTransaction(tx, walletAddress) {
    const fee = tx.fee / 1e9; // Subtract Fee

    let wsolFlow = 0;
    if (tx.tokenTransfers) {
        for (const t of tx.tokenTransfers) {
            if (t.mint === WSOL) {
                if (t.toUserAccount === walletAddress) wsolFlow += t.tokenAmount;
                if (t.fromUserAccount === walletAddress) wsolFlow -= t.tokenAmount;
            }
        }
    }

    let nativeFlow = 0;
    if (tx.nativeTransfers) {
        for (const t of tx.nativeTransfers) {
            if (t.toUserAccount === walletAddress) nativeFlow += t.amount / 1e9;
            if (t.fromUserAccount === walletAddress) nativeFlow -= t.amount / 1e9;
        }
    }

    // Wrap Detection
    // If we just wrapped SOL to WSOL, Cost is 0 (Value is retained).
    if (Math.abs(wsolFlow + nativeFlow) < 0.05 && Math.abs(wsolFlow) > 0.1) {
        // It's a wrap. No P&L impact.
        // BUT we paid a fee.
        return { cost: fee, rev: 0 };
    }

    const wsolAbs = Math.abs(wsolFlow);
    const nativeAbs = Math.abs(nativeFlow);
    const tradeValue = Math.max(wsolAbs, nativeAbs);

    let cost = 0;
    let rev = 0;

    // Identify Direction
    // If nativeFlow + wsolFlow is positive -> Net SOL In -> SELL
    // If nativeFlow + wsolFlow is negative -> Net SOL Out -> BUY
    // Wait, that's Net Flow again.

    // Let's use Token Counterparty logic.
    // Did we receive a token (not WSOL)?
    let tokenIn = false;
    let tokenOut = false;
    if (tx.tokenTransfers) {
        for (const t of tx.tokenTransfers) {
            if (t.mint !== WSOL) {
                if (t.toUserAccount === walletAddress) tokenIn = true;
                if (t.fromUserAccount === walletAddress) tokenOut = true;
            }
        }
    }

    if (tokenIn && !tokenOut) { // BUY
        cost = tradeValue;
    } else if (tokenOut && !tokenIn) { // SELL
        rev = tradeValue;
    } else if (tokenIn && tokenOut) { // SWAP
        // Sell A (Rev), Buy B (Cost)
        // Usually Solscan counts the OUTGOING token value as Revenue? And incoming as Cost?
        // Net effect is 0 if values match.
        cost = tradeValue;
        rev = tradeValue;
    } else {
        // Transfer / Unknown
        // If we sent SOL out with no token coming in -> Cost?
        // Solscan might count transfer as Spend.
        if (tradeValue > 0.001) {
            // Check direction
            if ((nativeFlow + wsolFlow) < 0) cost = tradeValue; // Sent SOL
            else rev = tradeValue; // Recv SOL
        }
    }

    // Add Fee to Cost
    cost += fee;

    return { cost, rev };
}

async function main() {
    const uniqueSigs = [...new Set(RAW_SIGNATURES)];
    const batchSize = 50;
    let allTxs = [];
    for (let i = 0; i < uniqueSigs.length; i += batchSize) {
        const batch = uniqueSigs.slice(i, i + batchSize);
        const txs = await getTransactionDetails(batch);
        allTxs = allTxs.concat(txs);
    }

    let totalCost = 0;
    let totalRev = 0;

    allTxs.forEach(tx => {
        const res = analyzeTransaction(tx, WALLET);
        totalCost += res.cost;
        totalRev += res.rev;
    });

    const net = totalRev - totalCost;

    console.log('💰 PRECISION RESULTS');
    console.log('='.repeat(50));
    console.log(`Expenses: ${totalCost.toFixed(4)} SOL`);
    console.log(`Income:   ${totalRev.toFixed(4)} SOL`);
    console.log('─'.repeat(50));
    console.log(`NET P&L:  ${net.toFixed(4)} SOL`);
    console.log('='.repeat(50));
}

main().catch(console.error);
