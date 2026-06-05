/**
 * 🔍 Script de debugging para analizar el volumen de compras vs ventas
 */

import { getWalletTransactions } from '../lib/services/helius';

async function debugVolumeAnalysis() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    console.log('🔍 ANÁLISIS DE VOLUMEN RAW\n');
    console.log(`📍 Wallet: ${wallet}\n`);

    try {
        // Fetch first batch
        console.log('Fetching transactions...\n');
        const allTxs: any[] = [];
        let before: string | undefined;

        // Fetch all transactions (limit to reasonable amount for debugging)
        for (let i = 0; i < 100; i++) {
            const batch = await getWalletTransactions(wallet, 100, before);
            if (batch.length === 0) break;
            allTxs.push(...batch);
            before = batch[batch.length - 1]?.signature;
            if (i % 10 === 0) {
                console.log(`Fetched ${allTxs.length} transactions...`);
            }
            await new Promise(r => setTimeout(r, 300));
        }

        console.log(`\nTotal transactions fetched: ${allTxs.length}\n`);

        // Analyze all SOL movements
        let totalSolOut = 0; // SOL spent (compras)
        let totalSolIn = 0;  // SOL received (ventas)
        let totalFees = 0;

        const swapTxs = allTxs.filter(tx =>
            tx.type === 'SWAP' ||
            (tx.source && ['PUMP_AMM', 'PUMP_FUN', 'RAYDIUM', 'JUPITER'].includes(tx.source))
        );

        console.log(`Found ${swapTxs.length} swap/DEX transactions\n`);

        for (const tx of swapTxs) {
            if (!tx.nativeTransfers) continue;

            let solNet = 0;

            for (const nt of tx.nativeTransfers) {
                if (nt.fromUserAccount === wallet) {
                    const amount = nt.amount / 1e9;
                    solNet -= amount;
                    totalSolOut += amount;
                }
                if (nt.toUserAccount === wallet) {
                    const amount = nt.amount / 1e9;
                    solNet += amount;
                    totalSolIn += amount;
                }
            }

            // Count fees
            if (tx.feePayer === wallet || !tx.feePayer) {
                totalFees += tx.fee / 1e9;
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💰 ANÁLISIS DE FLUJO DE SOL (RAW)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log(`  Total SOL Saliente (Compras):  ${totalSolOut.toFixed(4)} SOL`);
        console.log(`  Total SOL Entrante (Ventas):   ${totalSolIn.toFixed(4)} SOL`);
        console.log(`  Balance Bruto:                 ${(totalSolIn - totalSolOut).toFixed(4)} SOL`);
        console.log(`  Total Fees:                    ${totalFees.toFixed(4)} SOL`);
        console.log(`  Balance Neto:                  ${(totalSolIn - totalSolOut - totalFees).toFixed(4)} SOL`);

        const solPrice = 128;
        console.log(`\n  En USD (@ $${solPrice}/SOL):`);
        console.log(`  Total Invertido:               $${(totalSolOut * solPrice).toFixed(2)}`);
        console.log(`  Total Recibido:                $${(totalSolIn * solPrice).toFixed(2)}`);
        console.log(`  P&L:                           $${((totalSolIn - totalSolOut) * solPrice).toFixed(2)}`);
        console.log(`  Fees:                          $${(totalFees * solPrice).toFixed(2)}`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 COMPARACIÓN CON GMGN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const gmgnCost = 468300;
        const gmgnPnL = 8870;
        const gmgnFees = 1644.70;

        console.log(`  GMGN Costo Total:    $${gmgnCost.toFixed(2)}`);
        console.log(`  Nuestro Cálculo:     $${(totalSolOut * solPrice).toFixed(2)}`);
        console.log(`  Diferencia:          $${Math.abs((totalSolOut * solPrice) - gmgnCost).toFixed(2)}\n`);

        console.log(`  GMGN P&L:            $${gmgnPnL.toFixed(2)}`);
        console.log(`  Nuestro Cálculo:     $${((totalSolIn - totalSolOut) * solPrice).toFixed(2)}`);
        console.log(`  Diferencia:          $${Math.abs(((totalSolIn - totalSolOut) * solPrice) - gmgnPnL).toFixed(2)}\n`);

        console.log(`  GMGN Fees:           $${gmgnFees.toFixed(2)}`);
        console.log(`  Nuestro Cálculo:     $${(totalFees * solPrice).toFixed(2)}`);
        console.log(`  Diferencia:          $${Math.abs((totalFees * solPrice) - gmgnFees).toFixed(2)}\n`);

    } catch (error) {
        console.error('\n❌ Error:', error);
        if (error instanceof Error) {
            console.error('   Stack:', error.stack);
        }
    }
}

debugVolumeAnalysis();
