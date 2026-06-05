/**
 * 🧪 Test del sistema de scoring restaurado
 * Versión funcional: Solscan + Helius con extractTrades
 */

import { calculateAdvancedMetrics } from '../lib/metricsEngine';

async function testWallet() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

    console.log('🔥 Testing DegenScore Engine v2.0 (Restored)\n');
    console.log(`📍 Wallet: ${wallet}\n`);
    console.log('⏳ Analizando...\n');

    try {
        const metrics = await calculateAdvancedMetrics(
            wallet,
            (progress, message) => {
                console.log(`  ${progress.toFixed(0)}% - ${message}`);
            }
        );

        console.log('\n✅ Análisis completado!\n');
        console.log('📊 Resultados:\n');
        console.log(`  Total Trades: ${metrics.totalTrades}`);
        console.log(`  Volumen: ${metrics.totalVolume.toFixed(2)} SOL`);
        console.log(`  P&L: ${metrics.profitLoss.toFixed(4)} SOL`);
        console.log(`  Win Rate: ${metrics.winRate.toFixed(1)}%`);
        console.log(`  DegenScore: ${metrics.degenScore.toFixed(1)}/100`);
        console.log(`  Rugs Survived: ${metrics.rugsSurvived}`);
        console.log(`  Moonshots: ${metrics.moonshots}`);
        console.log(`  Trading Days: ${metrics.tradingDays}`);
        console.log(`  Avg Trade Size: ${metrics.avgTradeSize.toFixed(4)} SOL`);

        if (metrics.favoriteTokens.length > 0) {
            console.log('\n  Top Tokens (by Trades):');
            metrics.favoriteTokens.slice(0, 3).forEach((token, i) => {
                console.log(`    ${i + 1}. ${token.mint.substring(0, 8)}... (${token.count} trades)`);
            });
        }

        // ⭐ NUEVO: Mostrar Top P&L Tokens para depuración
        // Accedemos a las posiciones internas si es posible, o inferimos de favoriteTokens si tienen P&L
        // Como metrics no expone el P&L por token directamente en la interfaz pública, 
        // vamos a confiar en que el log de metricsEngine nos dio pistas, o modificar metricsEngine para exponerlo.
        // Por ahora, solo imprimimos lo que tenemos.

    } catch (error) {
        console.error('\n❌ Error:', error);
        if (error instanceof Error) {
            console.error('   Mensaje:', error.message);
        }
    }
}

testWallet();
