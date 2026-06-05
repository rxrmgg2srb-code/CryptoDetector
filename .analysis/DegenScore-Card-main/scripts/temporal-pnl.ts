/**
 * 🔍 Temporal analysis - Check if old trades are inflating P&L
 */

import { calculateAdvancedMetrics } from '../lib/metricsEngine';

async function analyzeTemporalPnL() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

    console.log('📅 TEMPORAL P&L ANALYSIS\n');

    try {
        const metrics = await calculateAdvancedMetrics(wallet);
        const positions = metrics._debugPositions || [];
        const closedPositions = positions.filter(p => !p.isOpen);

        // Group by time periods
        const now = Math.floor(Date.now() / 1000);
        const day = 24 * 3600;

        const periods = [
            { name: 'Last 7 days', days: 7 },
            { name: 'Last 30 days', days: 30 },
            { name: 'Last 90 days', days: 90 },
            { name: 'All time', days: 99999 }
        ];

        console.log('📊 P&L BY TIME PERIOD:\n');

        for (const period of periods) {
            const cutoff = now - (period.days * day);
            const recentPositions = closedPositions.filter(p =>
                (p.exitTime || 0) >= cutoff
            );

            const pnl = recentPositions.reduce((sum, p) => sum + (p.profitLoss || 0), 0);
            const count = recentPositions.length;

            console.log(`${period.name}:`);
            console.log(`  Positions: ${count}`);
            console.log(`  Total P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} SOL`);
            console.log('');
        }

        // First and last trade dates
        const sortedByExit = [...closedPositions].sort((a, b) => (a.exitTime || 0) - (b.exitTime || 0));
        if (sortedByExit.length > 0) {
            const first = new Date((sortedByExit[0]?.exitTime || 0) * 1000);
            const last = new Date((sortedByExit[sortedByExit.length - 1]?.exitTime || 0) * 1000);

            console.log('📅 TRADING PERIOD:');
            console.log(`  First exit: ${first.toISOString()}`);
            console.log(`  Last exit: ${last.toISOString()}`);
            console.log(`  Days active: ${((last.getTime() - first.getTime()) / (1000 * day)).toFixed(0)}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

analyzeTemporalPnL();
