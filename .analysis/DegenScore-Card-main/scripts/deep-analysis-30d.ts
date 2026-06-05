/**
 * 🔬 Análisis PROFUNDO - Comparación transacción por transacción
 * Objetivo: Identificar EXACTAMENTE por qué los valores no coinciden con GMGN
 */

import { getWalletTransactions } from '../lib/services/helius';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const EXCLUDED_TOKENS = new Set([
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]);

async function deepAnalysis30d() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
    const startTime = Date.now() - DAYS_30;

    console.log('🔬 ANÁLISIS PROFUNDO - 30 DÍAS\n');
    console.log(`📍 Wallet: ${wallet}\n`);

    // Fetch 30d transactions
    console.log('📡 Fetching transactions...');
    const allTxs: any[] = [];
    let before: string | undefined;
    let keepFetching = true;

    while (keepFetching) {
        const batch = await getWalletTransactions(wallet, 100, before);
        if (batch.length === 0) break;

        const lastTxTime = batch[batch.length - 1].timestamp * 1000;
        const relevantTxs = batch.filter((tx: any) => tx.timestamp * 1000 >= startTime);
        allTxs.push(...relevantTxs);

        if (lastTxTime < startTime) {
            keepFetching = false;
        } else {
            before = batch[batch.length - 1].signature;
            process.stdout.write(`  Fetched ${allTxs.length} txs...\r`);
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log(`\n✅ Total: ${allTxs.length} transactions\n`);

    // Analizar TODAS las transacciones SWAP
    const swapTxs = allTxs.filter(tx => tx.type === 'SWAP');
    console.log(`📊 SWAP transactions: ${swapTxs.length}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ANÁLISIS DETALLADO DE SWAPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let totalBuys = 0;
    let totalSells = 0;
    let totalBuySOL = 0;
    let totalSellSOL = 0;

    const buySummaries: any[] = [];
    const sellSummaries: any[] = [];

    for (const tx of swapTxs) {
        // Calculate SOL net usando SOLO nativeTransfers
        let solNet = 0;
        if (tx.nativeTransfers) {
            for (const nt of tx.nativeTransfers) {
                if (nt.fromUserAccount === wallet) solNet -= nt.amount / 1e9;
                if (nt.toUserAccount === wallet) solNet += nt.amount / 1e9;
            }
        }

        // Get token transfers
        if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) continue;

        const relevantTokenTransfers = tx.tokenTransfers.filter(
            (t: any) => t.mint !== SOL_MINT && !EXCLUDED_TOKENS.has(t.mint) &&
                (t.fromUserAccount === wallet || t.toUserAccount === wallet)
        );

        if (relevantTokenTransfers.length === 0) continue;

        // Calculate token net
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

        // Get primary token
        let primaryMint = '';
        let primaryTokenNet = 0;
        for (const [mint, netBalance] of tokenNetBalances.entries()) {
            if (Math.abs(netBalance) > Math.abs(primaryTokenNet)) {
                primaryMint = mint;
                primaryTokenNet = netBalance;
            }
        }

        if (!primaryMint || primaryTokenNet === 0) continue;

        // Classify
        const TOLERANCE = 0.0001;
        const isBuy = solNet < -TOLERANCE && primaryTokenNet > 0;
        const isSell = solNet > TOLERANCE && primaryTokenNet < 0;

        if (!isBuy && !isSell) {
            // Try inference for SWAP
            if (Math.abs(primaryTokenNet) > 1) {
                if (primaryTokenNet > 0) {
                    // Inferred buy
                    totalBuys++;
                    totalBuySOL += Math.abs(solNet);

                    buySummaries.push({
                        date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
                        solAmount: Math.abs(solNet),
                        tokenAmount: primaryTokenNet,
                        mint: primaryMint.substring(0, 12),
                        source: tx.source,
                        signature: tx.signature.substring(0, 12),
                    });
                } else {
                    // Inferred sell
                    totalSells++;
                    totalSellSOL += Math.abs(solNet);

                    sellSummaries.push({
                        date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
                        solAmount: Math.abs(solNet),
                        tokenAmount: Math.abs(primaryTokenNet),
                        mint: primaryMint.substring(0, 12),
                        source: tx.source,
                        signature: tx.signature.substring(0, 12),
                    });
                }
            }
            continue;
        }

        const solAmount = Math.abs(solNet);

        // Skip dust
        if (solAmount < 0.001) continue;

        if (isBuy) {
            totalBuys++;
            totalBuySOL += solAmount;

            buySummaries.push({
                date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
                solAmount,
                tokenAmount: primaryTokenNet,
                mint: primaryMint.substring(0, 12),
                source: tx.source,
                signature: tx.signature.substring(0, 12),
            });
        } else { // isSell
            totalSells++;
            totalSellSOL += solAmount;

            sellSummaries.push({
                date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
                solAmount,
                tokenAmount: Math.abs(primaryTokenNet),
                mint: primaryMint.substring(0, 12),
                source: tx.source,
                signature: tx.signature.substring(0, 12),
            });
        }
    }

    console.log(`✅ Clasificados:\n`);
    console.log(`  Compras:  ${totalBuys}`);
    console.log(`  Ventas:   ${totalSells}`);
    console.log(`  Total:    ${totalBuys + totalSells}\n`);

    console.log(`💰 Volumen:\n`);
    console.log(`  Compras:  ${totalBuySOL.toFixed(4)} SOL`);
    console.log(`  Ventas:   ${totalSellSOL.toFixed(4)} SOL`);
    console.log(`  P&L:      ${(totalSellSOL - totalBuySOL).toFixed(4)} SOL\n`);

    // Top 10 largest buys
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔝 TOP 10 COMPRAS MÁS GRANDES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sortedBuys = [...buySummaries].sort((a, b) => b.solAmount - a.solAmount);
    sortedBuys.slice(0, 10).forEach((buy, i) => {
        console.log(`${i + 1}. ${buy.solAmount.toFixed(4)} SOL - ${buy.mint}... (${buy.source})`);
        console.log(`   ${buy.date} - Sig: ${buy.signature}...\n`);
    });

    // Top 10 smallest buys (to see if we're missing value)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️ TOP 10 COMPRAS MÁS PEQUEÑAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    sortedBuys.slice(-10).reverse().forEach((buy, i) => {
        console.log(`${i + 1}. ${buy.solAmount.toFixed(4)} SOL - ${buy.mint}... (${buy.source})`);
        console.log(`   ${buy.date} - Sig: ${buy.signature}...\n`);
    });

    // Statistics
    const avgBuy = totalBuySOL / totalBuys;
    const avgSell = totalSellSOL / totalSells;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ESTADÍSTICAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`  Compra promedio:  ${avgBuy.toFixed(4)} SOL`);
    console.log(`  Venta promedio:   ${avgSell.toFixed(4)} SOL`);

    const solPrice = 132.61;
    console.log(`\n  Costo total:      $${(totalBuySOL * solPrice).toFixed(2)}`);
    console.log(`  GMGN reporta:     $12,300.00`);
    console.log(`  Diferencia:       $${Math.abs((totalBuySOL * solPrice) - 12300).toFixed(2)}\n`);

    if ((totalBuySOL * solPrice) < 12300) {
        const missing = 12300 - (totalBuySOL * solPrice);
        const missingSol = missing / solPrice;
        console.log(`  ⚠️ Nos faltan: $${missing.toFixed(2)} (~${missingSol.toFixed(2)} SOL)`);
        console.log(`  Esto equivale a ~${(missing / avgBuy / solPrice).toFixed(1)} compras promedio\n`);
    }
}

deepAnalysis30d();
