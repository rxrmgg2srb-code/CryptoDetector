// @ts-nocheck
const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(process.cwd(), 'data', 'defi_activities.csv');

async function analyzeCsvPnl() {
    console.log('🔍 Analyzing CSV P&L...');

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ CSV file not found at: ${CSV_PATH}`);
        console.log('Please place the "defi_activities.csv" file in the "data" directory.');
        return;
    }

    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        console.error('❌ CSV file is empty');
        return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    console.log('Headers detected:', headers);

    const trades = [];
    let skippedCount = 0;

    // Helper to find column index
    const getColIndex = (names) => headers.findIndex(h => names.some(n => h.includes(n)));

    // Attempt to identify columns based on common names
    const timeIdx = getColIndex(['time', 'date']);
    const typeIdx = getColIndex(['action', 'type']);
    const tokenInIdx = getColIndex(['token in', 'received token']);
    const amountInIdx = getColIndex(['amount in', 'received amount']);
    const tokenOutIdx = getColIndex(['token out', 'sent token']);
    const amountOutIdx = getColIndex(['amount out', 'sent amount']);
    const txIdx = getColIndex(['tx', 'hash', 'signature']);
    const feeIdx = getColIndex(['fee']);

    console.log('Column mapping:', { timeIdx, typeIdx, tokenInIdx, amountInIdx, tokenOutIdx, amountOutIdx, txIdx });

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));

        if (cols.length < headers.length) continue;

        try {
            const timeStr = (timeIdx >= 0 && cols[timeIdx]) ? cols[timeIdx] : '';
            const timestamp = timeStr ? new Date(timeStr).getTime() : 0;
            const typeStr = (typeIdx >= 0 && cols[typeIdx]) ? cols[typeIdx].toLowerCase() : '';

            let type = 'unknown';
            let solAmount = 0;
            let tokenAmount = 0;
            let tokenSymbol = '';
            let tokenMint = '';

            const tokenIn = (tokenInIdx >= 0 && cols[tokenInIdx]) ? cols[tokenInIdx] : '';
            const amountIn = (amountInIdx >= 0 && cols[amountInIdx]) ? parseFloat(cols[amountInIdx] || '0') : 0;
            const tokenOut = (tokenOutIdx >= 0 && cols[tokenOutIdx]) ? cols[tokenOutIdx] : '';
            const amountOut = (amountOutIdx >= 0 && cols[amountOutIdx]) ? parseFloat(cols[amountOutIdx] || '0') : 0;

            if (tokenOut === 'SOL' && tokenIn !== 'SOL') {
                type = 'buy';
                solAmount = amountOut;
                tokenAmount = amountIn;
                tokenSymbol = tokenIn;
            } else if (tokenIn === 'SOL' && tokenOut !== 'SOL') {
                type = 'sell';
                solAmount = amountIn;
                tokenAmount = amountOut;
                tokenSymbol = tokenOut;
            } else if (typeStr.includes('swap')) {
                if (tokenOut === 'SOL') {
                    type = 'buy';
                    solAmount = amountOut;
                    tokenAmount = amountIn;
                    tokenSymbol = tokenIn;
                } else if (tokenIn === 'SOL') {
                    type = 'sell';
                    solAmount = amountIn;
                    tokenAmount = amountOut;
                    tokenSymbol = tokenOut;
                }
            }

            if (type !== 'unknown') {
                trades.push({
                    date: timeStr,
                    timestamp,
                    type,
                    tokenSymbol,
                    tokenMint: tokenSymbol,
                    amountIn,
                    amountOut,
                    price: tokenAmount > 0 ? solAmount / tokenAmount : 0,
                    totalValue: solAmount,
                    txHash: (txIdx >= 0 && cols[txIdx]) ? cols[txIdx] : ''
                });
            } else {
                skippedCount++;
            }

        } catch (e) {
            console.warn(`Error parsing line ${i}:`, e);
            skippedCount++;
        }
    }

    console.log(`✅ Parsed ${trades.length} trades. Skipped ${skippedCount} lines.`);

    // Aggregate Stats
    const stats = new Map();

    for (const trade of trades) {
        if (!stats.has(trade.tokenSymbol)) {
            stats.set(trade.tokenSymbol, {
                symbol: trade.tokenSymbol,
                mint: trade.tokenMint,
                totalBuys: 0,
                totalSells: 0,
                tokensBought: 0,
                tokensSold: 0,
                realizedPnL: 0,
                tradeCount: 0
            });
        }

        const s = stats.get(trade.tokenSymbol);
        if (s) {
            s.tradeCount++;

            if (trade.type === 'buy') {
                s.totalBuys += trade.totalValue;
                s.tokensBought += trade.tokenAmount;
            } else if (trade.type === 'sell') {
                s.totalSells += trade.totalValue;
                s.tokensSold += trade.tokenAmount;
            }
        }
    }

    // Calculate P&L
    let totalRealizedPnL = 0;
    let totalInvested = 0;
    let totalReceived = 0;

    console.log('\n📊 P&L Analysis by Token:');
    console.log('----------------------------------------------------------------');
    console.log('Symbol | Buys (SOL) | Sells (SOL) | P&L (SOL) | ROI (%)');
    console.log('----------------------------------------------------------------');

    const sortedStats = Array.from(stats.values()).sort((a, b) => (b.totalSells - b.totalBuys) - (a.totalSells - a.totalBuys));

    for (const s of sortedStats) {
        s.realizedPnL = s.totalSells - s.totalBuys;
        totalRealizedPnL += s.realizedPnL;
        totalInvested += s.totalBuys;
        totalReceived += s.totalSells;

        const roi = s.totalBuys > 0 ? (s.realizedPnL / s.totalBuys) * 100 : 0;

        if (Math.abs(s.realizedPnL) > 0.1 || s.totalBuys > 1) { // Filter noise
            console.log(`${s.symbol.padEnd(8)} | ${s.totalBuys.toFixed(2).padStart(10)} | ${s.totalSells.toFixed(2).padStart(11)} | ${s.realizedPnL.toFixed(2).padStart(9)} | ${roi.toFixed(1)}%`);
        }
    }

    console.log('----------------------------------------------------------------');
    console.log(`\n💰 TOTAL SUMMARY:`);
    console.log(`  Total Invested (SOL): ${totalInvested.toFixed(2)}`);
    console.log(`  Total Received (SOL): ${totalReceived.toFixed(2)}`);
    console.log(`  Total Realized P&L:   ${totalRealizedPnL.toFixed(2)} SOL`);
    console.log(`  ROI:                  ${totalInvested > 0 ? ((totalRealizedPnL / totalInvested) * 100).toFixed(2) : 0}%`);

    console.log(`\n(Note: This analysis assumes 'SOL' is the quote currency and relies on CSV column detection.)`);
}

analyzeCsvPnl();
