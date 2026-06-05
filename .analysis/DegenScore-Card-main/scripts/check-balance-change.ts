/**
 * 🔍 Verificación de Balance Real (Prueba de la Verdad)
 */

import { getWalletTransactions } from '../lib/services/helius';

async function checkBalanceChange() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    console.log('🔍 VERIFICANDO CAMBIO DE BALANCE REAL (30 DÍAS)\n');

    // 1. Obtener transacción más reciente
    const recentTxs = await getWalletTransactions(wallet, 1);
    if (recentTxs.length === 0) {
        console.log('❌ No se encontraron transacciones recientes');
        return;
    }
    const lastTx = recentTxs[0];

    // 2. Obtener transacción de hace ~30 días
    // Vamos a buscar hacia atrás hasta encontrar una fecha > 30 días
    const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
    const targetTime = Date.now() - DAYS_30;

    let oldTx = null;
    let before = lastTx.signature;
    let keepSearching = true;
    let txCount = 0;

    console.log('📡 Buscando transacción de hace 30 días...');

    while (keepSearching) {
        const batch = await getWalletTransactions(wallet, 100, before);
        if (batch.length === 0) break;

        const oldestInBatch = batch[batch.length - 1];
        const oldestTime = oldestInBatch.timestamp * 1000;

        if (oldestTime < targetTime) {
            // Encontramos el límite. Buscar la primera tx que sea < targetTime
            oldTx = batch.find((tx: any) => tx.timestamp * 1000 < targetTime);
            keepSearching = false;
        } else {
            before = oldestInBatch.signature;
            txCount += batch.length;
            process.stdout.write(`  Analizadas ${txCount} txs... (Fecha: ${new Date(oldestTime).toISOString()})\r`);
        }
    }

    console.log('\n\n📊 RESULTADOS:');

    if (!lastTx || !oldTx) {
        console.log('❌ No se pudo determinar el rango de 30 días.');
        return;
    }

    // Obtener balances de accountData o nativeTransfers no es suficiente para ver el balance TOTAL.
    // Necesitamos el `postBalance` y `preBalance` que Helius suele dar en `meta`.
    // Pero nuestra función `getWalletTransactions` devuelve transacciones parseadas simplificadas.

    // Vamos a usar una llamada directa RPC para obtener el balance de esas transacciones específicas si es posible,
    // o confiar en que la API de Helius nos da esa info en el raw response si lo pedimos.

    // Como no tenemos acceso al raw response aquí fácil, vamos a inferir del flujo acumulado
    // que ya calculamos en el diagnóstico anterior.

    console.log(`📅 Inicio: ${new Date(oldTx.timestamp * 1000).toISOString()}`);
    console.log(`📅 Fin:    ${new Date(lastTx.timestamp * 1000).toISOString()}`);

    // Si el usuario dice que NO hay transfers, entonces:
    // P&L = Balance Final - Balance Inicial

    console.log('\n⚠️ NOTA: Para ver el balance exacto necesitamos acceso a la API raw o RPC.');
    console.log('   Pero si el diagnóstico anterior dio +0.10 SOL, y tú dices que ganaste +62 SOL,');
    console.log('   y NO hay transfers externos...');

    console.log('\n🤔 ANÁLISIS LÓGICO:');
    console.log('   1. Si ganaste 62 SOL y no los retiraste, deben estar en tu cuenta.');
    console.log('   2. Si no están en tu cuenta, los retiraste o los perdiste.');
    console.log('   3. Si GMGN dice que ganaste, y tu balance no subió, GMGN cuenta algo que no es SOL líquido.');

    console.log('\n   ¿Es posible que tengas 62 SOL en tokens "dust" acumulados?');
    console.log('   (Pequeñas cantidades de muchos tokens que suman 62 SOL)');
}

checkBalanceChange();
