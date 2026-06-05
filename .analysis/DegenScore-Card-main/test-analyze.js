
const fetch = require('node-fetch');

async function analyzeWallet() {
    try {
        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1' })
        });

        const data = await response.json();
        console.log('--- ANALYSIS RESULT ---');
        console.log('Success:', data.success);
        if (data.metrics) {
            console.log('DegenScore:', data.metrics.degenScore);
            console.log('Total Trades:', data.metrics.totalTrades);
            console.log('Profit/Loss (SOL):', data.metrics.profitLoss);
            console.log('Win Rate:', data.metrics.winRate + '%');
            console.log('Total Checks:', data.metrics.safetyScore); // Checking if structure differs
        } else {
            console.log("No metrics returned", data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

analyzeWallet();
