/**
 * 🔍 Diagnóstico de Disponibilidad de AccountData y P&L Histórico
 */

import { getWalletTransactions } from '../lib/services/helius';

async function diagnoseHistory() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    console.log('🔍 DIAGNÓSTICO DE HISTORIAL COMPLETO\n');
    console.log(`📍 Wallet: ${wallet}\n`);

    console.log('📡 Fetching transactions (sampling)...');

    let totalTxs = 0;
    let withAccountData = 0;
    let withoutAccountData = 0;

    let totalSolSpent = 0;
    let totalSolReceived = 0;

    let before: string | undefined;
    let keepFetching = true;
    let batches = 0;

    // Vamos a analizar hasta 20 batches (2000 txs) para tener una buena muestra
    while (keepFetching && batches < 20) {
        const batch = await getWalletTransactions(wallet, 100, before);
        if (batch.length === 0) break;

        batches++;
        totalTxs += batch.length;

        for (const tx of batch) {
            // Check accountData availability
            if (tx.accountData && tx.accountData.length > 0) {
                withAccountData++;
            } else {
                withoutAccountData++;
            }

            // Basic P&L calc logic (simplified from metricsEngine)
            if (!tx.tokenTransfers || !tx.nativeTransfers) continue;

            let solNet = 0;

            // Try accountData
            if (tx.accountData) {
                const wad = tx.accountData.find((a: any) => a.account === wallet);
                if (wad && wad.nativeBalanceChange) solNet = wad.nativeBalanceChange / 1e9;
            }

            // Fallback
            if (solNet === 0 && tx.nativeTransfers) {
                for (const nt of tx.nativeTransfers) {
                    if (nt.fromUserAccount === wallet) solNet -= nt.amount / 1e9;
                    if (nt.toUserAccount === wallet) solNet += nt.amount / 1e9;
                }
            }

            // Classify
            if (Math.abs(solNet) > 0.001) {
                if (solNet < 0) totalSolSpent += Math.abs(solNet);
                else totalSolReceived += solNet;
            }
        }

        before = batch[batch.length - 1].signature;
        process.stdout.write(`  Batch ${batches}: ${withAccountData} with data, ${withoutAccountData} without... P&L: ${(totalSolReceived - totalSolSpent).toFixed(2)}\r`);
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n\n📊 RESULTADOS (${totalTxs} txs analizadas)`);
    console.log(`  Con accountData:    ${withAccountData} (${((withAccountData / totalTxs) * 100).toFixed(1)}%)`);
    console.log(`  Sin accountData:    ${withoutAccountData} (${((withoutAccountData / totalTxs) * 100).toFixed(1)}%)`);

    console.log('\n💰 P&L ESTIMADO (Muestra):');
    console.log(`  Gastado:  ${totalSolSpent.toFixed(2)} SOL`);
    console.log(`  Recibido: ${totalSolReceived.toFixed(2)} SOL`);
    console.log(`  Neto:     ${(totalSolReceived - totalSolSpent).toFixed(2)} SOL`);

    if (withoutAccountData > 0) {
        console.log('\n⚠️ ALERTA: Muchas transacciones antiguas no tienen accountData.');
        console.log('   Esto explica por qué el P&L histórico sigue siendo incorrecto.');
        console.log('   Necesitamos un fallback mejor para transacciones antiguas.');
    }
}

diagnoseHistory();
