/**
 * 🔍 Script de análisis de P&L para los últimos 30 días
 */

import { calculateAdvancedMetrics } from '../lib/metricsEngine';
import { PnLCalculator, convertTradeToTransaction } from '../lib/pnlCalculator';

async function debug30Days() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
    const startTime = Date.now() - DAYS_30;

    console.log('🔍 ANÁLISIS DE P&L - ÚLTIMOS 30 DÍAS\n');
    console.log(`📍 Wallet: ${wallet}`);
    console.log(`📅 Desde: ${new Date(startTime).toISOString()}\n`);

    try {
        // Obtenemos todas las métricas (el engine ya extrae todos los trades)
        // Nota: Esto es ineficiente porque procesa todo, pero seguro para debugging
        const metrics = await calculateAdvancedMetrics(wallet);

        // Accedemos a los trades internos si es posible, o los reconstruimos
        // Como calculateAdvancedMetrics no devuelve los trades raw, vamos a usar 
        // una versión modificada localmente o filtrar lo que tenemos.
        // Por ahora, vamos a confiar en que metricsEngine.ts tiene una exportación de trades
        // O mejor, importamos las funciones internas para tener control total.
    } catch (error) {
        console.log('Error inicializando...');
    }

    // Re-implementamos la lógica básica aquí para poder filtrar por fecha
    // Importamos las dependencias necesarias
    const { getWalletTransactions } = require('../lib/services/helius');

    // Copiamos la lógica de extracción de trades de metricsEngine para tener acceso a los trades raw
    // Esto es necesario porque calculateAdvancedMetrics no devuelve el array de trades
    console.log('📡 Fetching transactions...');

    // Fetch manual para filtrar por fecha
    const allTxs: any[] = [];
    let before: string | undefined;
    let keepFetching = true;

    // Fetch loop
    while (keepFetching) {
        const batch = await getWalletTransactions(wallet, 100, before);
        if (batch.length === 0) break;

        // Check timestamps
        const lastTxTime = batch[batch.length - 1].timestamp * 1000;

        // Filter batch for 30 days
        const relevantTxs = batch.filter((tx: any) => tx.timestamp * 1000 >= startTime);
        allTxs.push(...relevantTxs);

        if (lastTxTime < startTime) {
            keepFetching = false;
            console.log('  ✅ Reached 30 day limit');
        } else {
            before = batch[batch.length - 1].signature;
            process.stdout.write(`  Fetched ${allTxs.length} txs...\r`);
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log(`\n\n📊 Transacciones últimos 30 días: ${allTxs.length}`);

    // Ahora extraemos los trades usando una lógica simplificada pero robusta
    const trades: any[] = [];
    let totalSolOut = 0;
    let totalSolIn = 0;
    let totalFees = 0;

    for (const tx of allTxs) {
        // Fees
        if (tx.feePayer === wallet || !tx.feePayer) {
            totalFees += tx.fee / 1e9;
        }

        if (!tx.nativeTransfers) continue;

        let solNet = 0;
        for (const nt of tx.nativeTransfers) {
            if (nt.fromUserAccount === wallet) solNet -= nt.amount / 1e9;
            if (nt.toUserAccount === wallet) solNet += nt.amount / 1e9;
        }

        // Si hay movimiento de SOL significativo
        if (Math.abs(solNet) > 0.001) {
            if (solNet < 0) totalSolOut += Math.abs(solNet);
            else totalSolIn += solNet;

            // Intentar identificar token
            let tokenMint = 'UNKNOWN';
            if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
                // Buscar transferencias que no sean SOL
                const nonSolTransfers = tx.tokenTransfers.filter((t: any) =>
                    t.mint !== 'So11111111111111111111111111111111111111112'
                );

                if (nonSolTransfers.length > 0) {
                    tokenMint = nonSolTransfers[0].mint;
                }
            }

            trades.push({
                timestamp: tx.timestamp,
                type: solNet < 0 ? 'buy' : 'sell',
                solAmount: Math.abs(solNet),
                tokenMint
            });
        }
    }

    const solPrice = 132.61; // Usando el precio promedio de tu reporte ($12.3K / ~93 SOL)

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 COMPARACIÓN 30 DÍAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const myCost = totalSolOut * solPrice;
    const myVol = (totalSolOut + totalSolIn) * solPrice;
    const myFees = totalFees * solPrice;
    const myPnL = (totalSolIn - totalSolOut) * solPrice;

    console.log('METRICA            | NUESTRO CÁLCULO      | GMGN (REAL)        | DIFERENCIA');
    console.log('-------------------|----------------------|--------------------|-----------');
    console.log(`Transacciones      | ${allTxs.length.toString().padEnd(20)} | 184 (93+91)        | ${allTxs.length - 184}`);
    console.log(`Costo Total ($)    | $${myCost.toFixed(2).padEnd(19)} | $12,300.00         | $${(myCost - 12300).toFixed(2)}`);
    console.log(`Volumen ($)        | $${myVol.toFixed(2).padEnd(19)} | $24,800.00         | $${(myVol - 24800).toFixed(2)}`);
    console.log(`Fees ($)           | $${myFees.toFixed(2).padEnd(19)} | $547.47            | $${(myFees - 547.47).toFixed(2)}`);
    console.log(`P&L ($)            | $${myPnL.toFixed(2).padEnd(19)} | +$36.02            | $${(myPnL - 36.02).toFixed(2)}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 DIAGNÓSTICO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (Math.abs(myCost - 12300) > 1000) {
        console.log('❌ COSTO: Gran discrepancia. Nos faltan transacciones de compra.');
    } else {
        console.log('✅ COSTO: Razonablemente cerca.');
    }

    if (Math.abs(myFees - 547) > 100) {
        console.log('❌ FEES: Gran discrepancia. Helius no está reportando todos los fees o txs fallidas.');
    }

    console.log(`\nTotal SOL Out: ${totalSolOut.toFixed(4)}`);
    console.log(`Total SOL In: ${totalSolIn.toFixed(4)}`);
}

debug30Days();
