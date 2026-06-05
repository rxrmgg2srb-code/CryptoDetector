/**
 * 🧪 Script de ejemplo para probar el nuevo servicio Helius DeFi
 * 
 * Este script muestra cómo usar el nuevo servicio para obtener
 * SOLO swaps/trades reales de una wallet, excluyendo transfers.
 * 
 * Uso:
 * npx ts-node scripts/ejemplo-helius-defi.ts
 */

import {
    getAllDeFiSwaps,
    convertHeliusSwapsToTrades,
} from '../lib/services/heliusDeFiService';

async function main() {
    // Wallet del usuario a analizar
    const walletAddress = 'VAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';

    console.log('🔥 Helius DeFi Service - Análisis de Wallet\n');
    console.log(`📍 Wallet: ${walletAddress}\n`);

    try {
        // 1. Obtener SOLO swaps (no transfers, no NFTs, no staking)
        console.log('📡 Obteniendo swaps de Helius DeFi Service...\n');

        const swaps = await getAllDeFiSwaps(
            walletAddress,
            1000,
            (progress, message) => {
                console.log(`  ${progress.toFixed(0)}% - ${message}`);
            }
        );

        console.log(`\n✅ Swaps encontrados: ${swaps.length}\n`);

        if (swaps.length === 0) {
            console.log('⚠️  Esta wallet no tiene swaps');
            console.log('💡 Puede ser wallet nueva o solo hace transfers\n');
            return;
        }

        // 2. Mostrar estadísticas
        console.log('📊 Estadísticas de Swaps:\n');

        const dexCounts = new Map<string, number>();
        swaps.forEach((swap) => {
            const dex = swap.source || 'UNKNOWN';
            dexCounts.set(dex, (dexCounts.get(dex) || 0) + 1);
        });

        console.log('  DEX utilizados:');
        Array.from(dexCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([dex, count]) => {
                console.log(`    ${dex}: ${count} swaps`);
            });

        const timestamps = swaps.map((s) => s.timestamp);
        const firstSwap = new Date(Math.min(...timestamps) * 1000);
        const lastSwap = new Date(Math.max(...timestamps) * 1000);

        console.log(`\n  Primer swap: ${firstSwap.toLocaleString()}`);
        console.log(`  Último swap: ${lastSwap.toLocaleString()}`);

        // 3. Convertir a formato Trade
        console.log('\n🔄 Convirtiendo a formato Trade...\n');

        const trades = convertHeliusSwapsToTrades(swaps, walletAddress);

        console.log(`✅ Trades válidos: ${trades.length}`);
        console.log(`   Filtrados: ${swaps.length - trades.length} (stablecoins, dust)\n`);

        if (trades.length === 0) {
            console.log('⚠️  No hay trades válidos (solo stablecoins/wrapped)\n');
            return;
        }

        // 4. Análisis
        console.log('📈 Análisis de Trades:\n');

        const buys = trades.filter((t) => t.type === 'buy');
        const sells = trades.filter((t) => t.type === 'sell');

        console.log(`  Compras: ${buys.length}`);
        console.log(`  Ventas: ${sells.length}`);

        const totalVolume = trades.reduce((sum, t) => sum + t.solAmount, 0);
        console.log(`  Volumen total: ${totalVolume.toFixed(2)} SOL`);

        const avgTrade = totalVolume / trades.length;
        console.log(`  Trade promedio: ${avgTrade.toFixed(4)} SOL`);

        const uniqueTokens = new Set(trades.map((t) => t.tokenMint));
        console.log(`  Tokens únicos: ${uniqueTokens.size}`);

        // 5. Ejemplos
        console.log('\n📋 Ejemplos (primeros 5):\n');

        trades.slice(0, 5).forEach((trade, i) => {
            const date = new Date(trade.timestamp * 1000).toLocaleString();
            const type = trade.type === 'buy' ? '🟢 BUY ' : '🔴 SELL';
            const token = trade.tokenMint.substring(0, 8) + '...';

            console.log(`  ${i + 1}. ${type} | ${date}`);
            console.log(`     Token: ${token}`);
            console.log(`     SOL: ${trade.solAmount.toFixed(4)}`);
            console.log(`     Cantidad: ${trade.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
            console.log(`     Precio: ${trade.pricePerToken.toExponential(3)} SOL/token\n`);
        });

        console.log('✅ Análisis completado!\n');
    } catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('   Mensaje:', error.message);
        }
    }
}

main()
    .then(() => {
        console.log('🏁 Finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
