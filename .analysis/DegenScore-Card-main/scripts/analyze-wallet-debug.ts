/**
 * Script de debugging para analizar por qué se pierden trades
 * Ejecuta: npx ts-node scripts/analyze-wallet-debug.ts
 */

import { getWalletTransactions } from '../lib/services/helius';

const WALLET_ADDRESS = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function analyzeTransactions(walletAddress: string) {
    console.log('\n🔍 Analizando wallet:', walletAddress);
    console.log('Obteniendo primeras 1000 transacciones...\n');

    // Fetch transactions
    const transactions = await getWalletTransactions(walletAddress, 1000);
    console.log(`📊 Total transacciones obtenidas: ${transactions.length}\n`);

    let swapCount = 0;
    let validTrades = 0;
    const rejectedReasons = {
        notSwap: 0,
        noTokenTransfers: 0,
        noNativeTransfers: 0,
        dustTrade: 0,
        priceOutOfRange: 0,
        massiveTransfer: 0,
        noTokenAmount: 0,
        other: 0
    };

    const validTradesDetails: any[] = [];
    const rejectedTradesDetails: any[] = [];

    for (const tx of transactions) {
        // FILTRO: Solo SWAP
        if (tx.type !== 'SWAP' && !tx.description?.toLowerCase().includes('swap')) {
            rejectedReasons.notSwap++;
            continue;
        }
        swapCount++;

        // FILTRO: Token transfers
        if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) {
            rejectedReasons.noTokenTransfers++;
            continue;
        }

        // FILTRO: Native transfers
        if (!tx.nativeTransfers || tx.nativeTransfers.length === 0) {
            rejectedReasons.noNativeTransfers++;
            continue;
        }

        // Calcular SOL neto
        let solNet = 0;
        for (const nt of tx.nativeTransfers) {
            if (nt.fromUserAccount === walletAddress) {
                solNet -= nt.amount / 1e9;
            }
            if (nt.toUserAccount === walletAddress) {
                solNet += nt.amount / 1e9;
            }
        }

        // FILTRO 1: Dust (< 0.001 SOL)
        if (Math.abs(solNet) < 0.001) {
            rejectedReasons.dustTrade++;
            rejectedTradesDetails.push({
                signature: tx.signature?.substring(0, 20) + '...',
                reason: 'DUST',
                solAmount: Math.abs(solNet).toFixed(6)
            });
            continue;
        }

        // Obtener transferencias de tokens
        const tokenTransfers = tx.tokenTransfers.filter((t: any) =>
            t.mint !== SOL_MINT &&
            (t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress)
        );

        if (tokenTransfers.length === 0) {
            rejectedReasons.other++;
            continue;
        }

        const isBuy = solNet < 0;

        const tokenAmount = isBuy
            ? tokenTransfers.find((t: any) => t.toUserAccount === walletAddress)?.tokenAmount || 0
            : tokenTransfers.find((t: any) => t.fromUserAccount === walletAddress)?.tokenAmount || 0;

        if (tokenAmount === 0) {
            rejectedReasons.noTokenAmount++;
            continue;
        }

        const pricePerToken = Math.abs(solNet) / tokenAmount;

        // FILTRO 2: Precio fuera de rango (ESTE ES EL PROBLEMA)
        if (pricePerToken > 1 || pricePerToken < 0.0000001) {
            rejectedReasons.priceOutOfRange++;
            rejectedTradesDetails.push({
                signature: tx.signature?.substring(0, 20) + '...',
                reason: 'PRICE_OUT_OF_RANGE',
                price: pricePerToken.toExponential(2),
                solAmount: Math.abs(solNet).toFixed(4),
                tokenAmount: tokenAmount.toFixed(2),
                type: isBuy ? 'BUY' : 'SELL'
            });
            continue;
        }

        // FILTRO 3: Transferencias masivas (> 10k SOL)
        if (Math.abs(solNet) > 10000) {
            rejectedReasons.massiveTransfer++;
            rejectedTradesDetails.push({
                signature: tx.signature?.substring(0, 20) + '...',
                reason: 'MASSIVE_TRANSFER',
                solAmount: Math.abs(solNet).toFixed(2)
            });
            continue;
        }

        // ✅ Trade válido
        validTrades++;
        validTradesDetails.push({
            signature: tx.signature?.substring(0, 20) + '...',
            type: isBuy ? 'BUY' : 'SELL',
            solAmount: Math.abs(solNet).toFixed(4),
            tokenAmount: tokenAmount.toFixed(2),
            pricePerToken: pricePerToken.toExponential(4)
        });
    }

    // Imprimir resultados
    console.log('═'.repeat(70));
    console.log('📊 RESULTADOS DEL ANÁLISIS:');
    console.log('═'.repeat(70));
    console.log(`Total de transacciones:        ${transactions.length}`);
    console.log(`Transacciones tipo SWAP:       ${swapCount}`);
    console.log(`✅ Trades VÁLIDOS extraídos:   ${validTrades}`);
    console.log(`❌ Trades RECHAZADOS:          ${swapCount - validTrades}`);
    console.log('');
    console.log('🚫 RAZONES DE RECHAZO:');
    console.log('─'.repeat(70));
    console.log(`  • ${rejectedReasons.notSwap.toString().padStart(4)} - No es SWAP`);
    console.log(`  • ${rejectedReasons.noTokenTransfers.toString().padStart(4)} - Sin token transfers`);
    console.log(`  • ${rejectedReasons.noNativeTransfers.toString().padStart(4)} - Sin native transfers`);
    console.log(`  • ${rejectedReasons.dustTrade.toString().padStart(4)} - Dust (< 0.001 SOL)`);
    console.log(`  • ${rejectedReasons.priceOutOfRange.toString().padStart(4)} - Precio fuera de rango ⚠️  PROBLEMA`);
    console.log(`  • ${rejectedReasons.massiveTransfer.toString().padStart(4)} - Transferencia masiva (> 10k SOL)`);
    console.log(`  • ${rejectedReasons.noTokenAmount.toString().padStart(4)} - Sin token amount`);
    console.log(`  • ${rejectedReasons.other.toString().padStart(4)} - Otros`);
    console.log('');

    // Mostrar algunos trades rechazados por precio
    const priceRejected = rejectedTradesDetails.filter(t => t.reason === 'PRICE_OUT_OF_RANGE');
    if (priceRejected.length > 0) {
        console.log('🔍 EJEMPLOS DE TRADES RECHAZADOS POR PRECIO:');
        console.log('─'.repeat(70));
        priceRejected.slice(0, 15).forEach(t => {
            console.log(`  ${t.signature} (${t.type})`);
            console.log(`    Precio: ${t.price} SOL/token`);
            console.log(`    SOL: ${t.solAmount}, Tokens: ${t.tokenAmount}`);
            console.log('');
        });
    }

    // Mostrar algunos trades válidos
    if (validTradesDetails.length > 0) {
        console.log('✅ EJEMPLOS DE TRADES VÁLIDOS:');
        console.log('─'.repeat(70));
        validTradesDetails.slice(0, 10).forEach(t => {
            console.log(`  ${t.signature} (${t.type})`);
            console.log(`    Precio: ${t.pricePerToken} SOL/token`);
            console.log(`    SOL: ${t.solAmount}, Tokens: ${t.tokenAmount}`);
            console.log('');
        });
    }

    console.log('═'.repeat(70));
    console.log('\n💡 DIAGNÓSTICO:');
    console.log(`   El filtro de precio (0.0000001 - 1.0 SOL/token) está`);
    console.log(`   descartando ${rejectedReasons.priceOutOfRange} trades válidos.`);
    console.log(`   \n   Esto representa el ${((rejectedReasons.priceOutOfRange / swapCount) * 100).toFixed(1)}% de los SWAPs.\n`);

    return {
        totalTransactions: transactions.length,
        swapCount,
        validTrades,
        rejectedReasons
    };
}

async function main() {
    try {
        await analyzeTransactions(WALLET_ADDRESS);
        console.log('\n✅ Análisis completado\n');
    } catch (error: any) {
        console.error('❌ Error:', error?.message || error);
        process.exit(1);
    }
}

main();
