/**
 * 🔍 Script de análisis de P&L mejorado con comparación GMGN
 */

import { calculateAdvancedMetrics } from '../lib/metricsEngine';
import { PnLCalculator, convertTradeToTransaction } from '../lib/pnlCalculator';

async function debugWalletDetailed() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

    console.log('🔍 ANÁLISIS DETALLADO DE P&L\n');
    console.log(`📍 Wallet: ${wallet}\n`);

    try {
        const metrics = await calculateAdvancedMetrics(wallet);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN GENERAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log(`  Total Trades: ${metrics.totalTrades}`);
        console.log(`  Volume Total: ${metrics.totalVolume.toFixed(2)} SOL`);
        console.log(`  Win Rate: ${metrics.winRate.toFixed(2)}%`);
        console.log(`  DegenScore: ${metrics.degenScore}`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💰 FLUJO DE CAJA (CASH FLOW)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (metrics.totalExpenses !== undefined && metrics.totalIncome !== undefined) {
            console.log(`  Total Invertido (Compras):     ${metrics.totalExpenses.toFixed(4)} SOL`);
            console.log(`  Total Recibido (Ventas):       ${metrics.totalIncome.toFixed(4)} SOL`);
            console.log(`  Balance Bruto:                 ${metrics.netBalance?.toFixed(4)} SOL`);
            console.log(`  Fees Totales:                  ${metrics.totalFees.toFixed(4)} SOL`);
            console.log(`  Balance Neto (después fees):   ${metrics.netBalanceAfterFees?.toFixed(4)} SOL`);

            const roi = metrics.totalExpenses > 0
                ? (((metrics.netBalance || 0) / metrics.totalExpenses) * 100).toFixed(2)
                : '0.00';
            console.log(`  ROI:                           ${roi}%`);

            // Comparación con GMGN
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📈 COMPARACIÓN CON GMGN');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // Asumiendo SOL a ~$128 (precio aprox)
            const solPrice = 128;
            const costTotalUSD = metrics.totalExpenses * solPrice;
            const pnlUSD = (metrics.netBalance || 0) * solPrice;
            const feesUSD = metrics.totalFees * solPrice;

            console.log(`  Nuestro Cálculo:`);
            console.log(`    - Costo Total:    $${costTotalUSD.toFixed(2)} (${metrics.totalExpenses.toFixed(2)} SOL)`);
            console.log(`    - P&L:            $${pnlUSD.toFixed(2)} (${(metrics.netBalance || 0).toFixed(2)} SOL)`);
            console.log(`    - Fees:           $${feesUSD.toFixed(2)} (${metrics.totalFees.toFixed(2)} SOL)`);
            console.log(`    - Win Rate:       ${metrics.winRate.toFixed(2)}%`);
            console.log(`\n  GMGN Report:`);
            console.log(`    - Costo Total:    $468,300`);
            console.log(`    - P&L:            $8,870 (+1.89%)`);
            console.log(`    - Fees:           $1,644.70`);
            console.log(`    - Win Rate:       43.97%`);

            console.log('\n  ⚠️ DISCREPANCIAS DETECTADAS:');
            const costDiff = Math.abs(costTotalUSD - 468300);
            const pnlDiff = Math.abs(pnlUSD - 8870);
            const feesDiff = Math.abs(feesUSD - 1644.70);
            const wrDiff = Math.abs(metrics.winRate - 43.97);

            console.log(`    - Costo Total:    $${costDiff.toFixed(2)} diferencia`);
            console.log(`    - P&L:            $${pnlDiff.toFixed(2)} diferencia`);
            console.log(`    - Fees:           $${feesDiff.toFixed(2)} diferencia`);
            console.log(`    - Win Rate:       ${wrDiff.toFixed(2)}% diferencia`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏆 TOP 5 MEJORES TRADES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (metrics.topGainers && metrics.topGainers.length > 0) {
            metrics.topGainers.slice(0, 5).forEach((token, i) => {
                console.log(`  ${i + 1}. ${token.mint.substring(0, 12)}...`);
                console.log(`     P&L: +${token.pnl.toFixed(4)} SOL (+${token.roi.toFixed(2)}%)\n`);
            });
        } else {
            console.log('  No hay datos de ganadores');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📉 TOP 5 PEORES TRADES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (metrics.topLosers && metrics.topLosers.length > 0) {
            metrics.topLosers.slice(0, 5).forEach((token, i) => {
                console.log(`  ${i + 1}. ${token.mint.substring(0, 12)}...`);
                console.log(`     P&L: ${token.pnl.toFixed(4)} SOL (${token.roi.toFixed(2)}%)\n`);
            });
        } else {
            console.log('  No hay datos de perdedores');
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
        if (error instanceof Error) {
            console.error('   Stack:', error.stack);
        }
    }
}

debugWalletDetailed();
