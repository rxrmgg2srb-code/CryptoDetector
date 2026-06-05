/**
 * 🔍 Script para buscar un token específico en los trades
 */

import { calculateAdvancedMetrics } from '../lib/metricsEngine';

async function findToken() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    const targetToken = 'HJBoRECiJddTZQZpuY8pHenf5CZ2yjju4npekmvbpump';

    console.log('🔍 BUSCANDO TOKEN ESPECÍFICO\n');
    console.log(`📍 Wallet: ${wallet}`);
    console.log(`🎯 Token: ${targetToken}\n`);

    try {
        const metrics = await calculateAdvancedMetrics(wallet);

        // Buscar en topGainers
        const found = metrics.topGainers?.find(t => t.mint === targetToken);

        if (found) {
            console.log('✅ TOKEN ENCONTRADO EN TOP GAINERS:');
            console.log(`  Mint: ${found.mint}`);
            console.log(`  P&L: ${found.pnl.toFixed(4)} SOL`);
            console.log(`  ROI: ${found.roi.toFixed(2)}%`);
        } else {
            console.log('❌ TOKEN NO ENCONTRADO EN TOP GAINERS');
            console.log('\nBuscando en todos los gainers...');

            // Buscar en topGainers completo (no solo top 5)
            if (metrics.topGainers) {
                const allGainers = metrics.topGainers;
                console.log(`Total de gainers: ${allGainers.length}`);

                const tokenInAll = allGainers.find(t => t.mint === targetToken);
                if (tokenInAll) {
                    const position = allGainers.findIndex(t => t.mint === targetToken) + 1;
                    console.log(`✅ Encontrado en posición #${position}`);
                    console.log(`  P&L: ${tokenInAll.pnl.toFixed(4)} SOL`);
                    console.log(`  ROI: ${tokenInAll.roi.toFixed(2)}%`);
                } else {
                    console.log('❌ No encontrado en la lista de gainers');
                }
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 COMPARACIÓN CON EL GAINER REPORTADO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (metrics.topGainers && metrics.topGainers.length > 0) {
            const top1 = metrics.topGainers[0];
            console.log(`Nuestro Top #1:`);
            console.log(`  Token: ${top1.mint}`);
            console.log(`  ROI: ${top1.roi.toFixed(2)}%`);
            console.log(`  P&L: ${top1.pnl.toFixed(4)} SOL\n`);
        }

        console.log(`ROI Real (usuario dice): 668.32%`);
        console.log(`Token real: ${targetToken}\n`);

        if (found) {
            const diff = Math.abs(found.roi - 668.32);
            console.log(`Diferencia: ${diff.toFixed(2)}%`);
            if (diff > 100) {
                console.log('⚠️ GRAN DISCREPANCIA - Hay un error en el cálculo');
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
        if (error instanceof Error) {
            console.error('   Stack:', error.stack);
        }
    }
}

findToken();
