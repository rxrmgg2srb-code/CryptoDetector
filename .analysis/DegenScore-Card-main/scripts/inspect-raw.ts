/**
 * 🔍 RAW Transaction Inspector
 * Muestra las transacciones sin procesar para verificar qué estamos interpretando mal
 */

import { calculateAdvancedMetrics } from '../lib/metricsEngine';

async function inspectRawTrades() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

    console.log('🔍 RAW TRADE INSPECTION\n');

    try {
        const metrics = await calculateAdvancedMetrics(wallet);
        const positions = metrics._debugPositions || [];

        console.log(`📦 Total Positions Found: ${positions.length}`);

        // Verificar posiciones abiertas
        const openPositions = positions.filter(p => p.isOpen);
        console.log(`🔓 Open Positions: ${openPositions.length}\n`);

        if (openPositions.length > 0) {
            console.log('⚠️  OPEN POSITIONS (Should be 0 according to user):');
            openPositions.forEach((pos, i) => {
                console.log(`  ${i + 1}. Token: ${pos.tokenMint}`);
                console.log(`     Buy: ${pos.buyAmount.toFixed(4)} SOL`);
                console.log(`     Tokens Bought: ${pos.tokensBought}`);
                console.log(`     Tokens Sold: ${pos.tokensSold || 0}`);
                console.log(`     Entry Date: ${new Date(pos.entryTime * 1000).toISOString()}`);
                console.log('');
            });
        }

        // Verificar los supuestos moonshots
        const moonshots = positions.filter(p => p.isMoonshot);
        console.log(`🚀 Moonshots Found: ${moonshots.length} (User says 0)\n`);

        if (moonshots.length > 0) {
            console.log('⚠️  TOP 5 MOONSHOTS (Should not exist according to user):');
            moonshots.slice(0, 5).forEach((pos, i) => {
                console.log(`  ${i + 1}. Token: ${pos.tokenMint}`);
                console.log(`     Buy: ${pos.buyAmount.toFixed(6)} SOL for ${pos.tokensBought} tokens`);
                console.log(`     Sell: ${(pos.sellAmount || 0).toFixed(4)} SOL for ${pos.tokensSold || 0} tokens`);
                console.log(`     P&L: ${(pos.profitLoss || 0).toFixed(4)} SOL (${(pos.profitLossPercent || 0).toFixed(1)}%)`);
                console.log(`     Entry: ${new Date(pos.entryTime * 1000).toISOString()}`);
                if (pos.exitTime) {
                    console.log(`     Exit: ${new Date(pos.exitTime * 1000).toISOString()}`);
                }
                console.log('');
            });
        }

        // Total summary
        const closedPositions = positions.filter(p => !p.isOpen);
        const totalBuy = closedPositions.reduce((sum, p) => sum + p.buyAmount, 0);
        const totalSell = closedPositions.reduce((sum, p) => sum + (p.sellAmount || 0), 0);

        console.log('\n💰 FINANCIAL SUMMARY:');
        console.log(`  Total SOL Spent (Buys): ${totalBuy.toFixed(2)} SOL`);
        console.log(`  Total SOL Received (Sells): ${totalSell.toFixed(2)} SOL`);
        console.log(`  Net Difference: ${(totalSell - totalBuy).toFixed(2)} SOL`);
        console.log(`  Reported P&L: ${(metrics.realizedPnL || 0).toFixed(2)} SOL`);
        console.log(`  GMGN P&L: ~38 SOL (user reference)`);
        console.log(`\n  Discrepancy: ${((metrics.realizedPnL || 0) - 38).toFixed(2)} SOL\n`);

        // Análisis de volumen
        console.log('📊 VOLUME ANALYSIS:');
        console.log(`  Total Volume: ${metrics.totalVolume.toFixed(2)} SOL`);
        console.log(`  Total Trades: ${metrics.totalTrades}`);
        console.log(`  Avg Trade Size: ${(metrics.totalVolume / metrics.totalTrades).toFixed(4)} SOL`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

inspectRawTrades();
