/**
 * 🔬 Análisis EXHAUSTIVO - Incluir TODOS los tipos de transacciones
 * No solo SWAPS - buscar en TRANSFERS, etc.
 */

import { getWalletTransactions } from '../lib/services/helius';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const EXCLUDED_TOKENS = new Set([
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]);

async function exhaustiveAnalysis() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
    const startTime = Date.now() - DAYS_30;

    console.log('🔬 ANÁLISIS EXHAUSTIVO - TODAS LAS TRANSACCIONES\n');

    // Fetch
    console.log('📡 Fetching...');
    const allTxs: any[] = [];
    let before: string | undefined;
    let keepFetching = true;

    while (keepFetching) {
        const batch = await getWalletTransactions(wallet, 100, before);
        if (batch.length === 0) break;

        const lastTxTime = batch[batch.length - 1].timestamp * 1000;
        const relevantTxs = batch.filter((tx: any) => tx.timestamp * 1000 >= startTime);
        allTxs.push(...relevantTxs);

        if (lastTxTime < startTime) keepFetching = false;
        else {
            before = batch[batch.length - 1].signature;
            process.stdout.write(`  ${allTxs.length} txs...\r`);
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log(`\n✅ Total: ${allTxs.length}\n`);

    // Group by type
    const txByType = new Map<string, any[]>();
    for (const tx of allTxs) {
        if (!txByType.has(tx.type)) txByType.set(tx.type, []);
        txByType.get(tx.type)!.push(tx);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DESGLOSE POR TIPO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const [type, txs] of Array.from(txByType.entries()).sort((a, b) => b[1].length - a[1].length)) {
        console.log(`  ${type.padEnd(30)}: ${txs.length}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 ANALIZANDO TODAS CON TOKEN + NATIVE TRANSFERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Analyze ALL that have both token and native transfers
    const tradeCandidates = allTxs.filter(tx =>
        tx.tokenTransfers && tx.tokenTransfers.length > 0 &&
        tx.nativeTransfers && tx.nativeTransfers.length > 0
    );

    console.log(`  Total con token+native: ${tradeCandidates.length}\n`);

    let buys = 0;
    let sells = 0;
    let totalBuySOL = 0;
    let totalSellSOL = 0;
    const buyDetails: any[] = [];
    const sellDetails: any[] = [];

    for (const tx of tradeCandidates) {
        // SOL net - try accountData first
        let solNet = 0;

        if (tx.accountData && tx.accountData.length > 0) {
            const walletAccountData = tx.accountData.find((acc: any) => acc.account === wallet);
            if (walletAccountData && walletAccountData.nativeBalanceChange) {
                solNet = walletAccountData.nativeBalanceChange / 1e9;
            }
        }

        // Fallback to nativeTransfers
        if (solNet === 0) {
            for (const nt of tx.nativeTransfers) {
                if (nt.fromUserAccount === wallet) solNet -= nt.amount / 1e9;
                if (nt.toUserAccount === wallet) solNet += nt.amount / 1e9;
            }
        }

        // Token transfers
        const relevantTokenTransfers = tx.tokenTransfers.filter(
            (t: any) => t.mint !== SOL_MINT && !EXCLUDED_TOKENS.has(t.mint) &&
                (t.fromUserAccount === wallet || t.toUserAccount === wallet)
        );

        if (relevantTokenTransfers.length === 0) continue;

        // Token net
        const tokenNetBalances = new Map<string, number>();
        for (const transfer of relevantTokenTransfers) {
            const currentBalance = tokenNetBalances.get(transfer.mint) || 0;
            if (transfer.toUserAccount === wallet) {
                tokenNetBalances.set(transfer.mint, currentBalance + transfer.tokenAmount);
            }
            if (transfer.fromUserAccount === wallet) {
                tokenNetBalances.set(transfer.mint, currentBalance - transfer.tokenAmount);
            }
        }

        // Primary token
        let primaryMint = '';
        let primaryTokenNet = 0;
        for (const [mint, netBalance] of tokenNetBalances.entries()) {
            if (Math.abs(netBalance) > Math.abs(primaryTokenNet)) {
                primaryMint = mint;
                primaryTokenNet = netBalance;
            }
        }

        if (!primaryMint || primaryTokenNet === 0) continue;

        // Classify with tolerance
        const TOLERANCE = 0.0001;
        let isBuy = solNet < -TOLERANCE && primaryTokenNet > 0;
        let isSell = solNet > TOLERANCE && primaryTokenNet < 0;

        // Inference for ambiguous SWAP/TRANSFER
        if (!isBuy && !isSell && Math.abs(primaryTokenNet) > 1) {
            isBuy = primaryTokenNet > 0;
            isSell = primaryTokenNet < 0;
        }

        if (!isBuy && !isSell) continue;

        const solAmount = Math.abs(solNet);
        if (solAmount < 0.001) continue; // dust

        if (isBuy) {
            buys++;
            totalBuySOL += solAmount;
            buyDetails.push({
                type: tx.type,
                sol: solAmount,
                mint: primaryMint.substring(0, 12),
                sig: tx.signature.substring(0, 12),
                date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            });
        } else {
            sells++;
            totalSellSOL += solAmount;
            sellDetails.push({
                type: tx.type,
                sol: solAmount,
                mint: primaryMint.substring(0, 12),
                sig: tx.signature.substring(0, 12),
                date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            });
        }
    }

    console.log(`✅ RESULTADOS:\n`);
    console.log(`  Compras:   ${buys}   (GMGN: 93)`);
    console.log(`  Ventas:    ${sells}  (GMGN: 91)`);
    console.log(`  Diff:      ${buys - 93} compras, ${sells - 91} ventas\n`);

    console.log(`💰 VOLUMEN:\n`);
    const solPrice = 132.61;
    console.log(`  Compras:   ${totalBuySOL.toFixed(4)} SOL ($${(totalBuySOL * solPrice).toFixed(2)})`);
    console.log(`  GMGN:      ~92.77 SOL ($12,300)`);
    console.log(`  Diff:      ${(totalBuySOL - 92.77).toFixed(2)} SOL ($${((totalBuySOL - 92.77) * solPrice).toFixed(2)})\n`);

    console.log(`  Ventas:    ${totalSellSOL.toFixed(4)} SOL ($${(totalSellSOL * solPrice).toFixed(2)})`);
    console.log(`  Esperado:  ~93.04 SOL ($12,336.02)`);
    console.log(`  Diff:      ${(totalSellSOL - 93.04).toFixed(2)} SOL\n`);

    // Type breakdown
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DESGLOSE POR TIPO DE TRANSACCIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const buysByType = new Map<string, number>();
    const sellsByType = new Map<string, number>();
    for (const buy of buyDetails) {
        buysByType.set(buy.type, (buysByType.get(buy.type) || 0) + 1);
    }
    for (const sell of sellDetails) {
        sellsByType.set(sell.type, (sellsByType.get(sell.type) || 0) + 1);
    }

    console.log('COMPRAS:');
    for (const [type, count] of Array.from(buysByType.entries()).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type.padEnd(20)}: ${count}`);
    }

    console.log('\nVENTAS:');
    for (const [type, count] of Array.from(sellsByType.entries()).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type.padEnd(20)}: ${count}`);
    }

    if (buys === 93 && sells === 91) {
        console.log('\n✅ ¡PERFECTO! Conteo exacto igual a GMGN');
    } else {
        console.log(`\n⚠️ Diferencia: ${buys !== 93 ? `${buys - 93} compras` : ''}${sells !== 91 ? ` ${sells - 91} ventas` : ''}`);
    }
}

exhaustiveAnalysis();
