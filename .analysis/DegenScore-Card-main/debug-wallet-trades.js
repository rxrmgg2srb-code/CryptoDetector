/**
 * Debug script para analizar por qué se están perdiendo trades
 * Ejecuta: node debug-wallet-trades.js
 */

const https = require('https');

const WALLET_ADDRESS = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'tu-api-key-aqui';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function fetchTransactions(walletAddress, limit = 1000) {
    return new Promise((resolve, reject) => {
        const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

function analyzeTransactions(transactions, walletAddress) {
    console.log(`\n🔍 Analizando ${transactions.length} transacciones...\n`);

    let swapCount = 0;
    let validTrades = 0;
    let rejectedReasons = {
        notSwap: 0,
        noTokenTransfers: 0,
        noNativeTransfers: 0,
        dustTrade: 0,
        priceOutOfRange: 0,
        massiveTransfer: 0,
        noTokenAmount: 0,
        other: 0
    };

    const validTradesDetails = [];
    const rejectedTradesDetails = [];

    for (const tx of transactions) {
        // Verificar si es SWAP
        if (tx.type !== 'SWAP' && !tx.description?.toLowerCase().includes('swap')) {
            rejectedReasons.notSwap++;
            continue;
        }
        swapCount++;

        // Verificar token transfers
        if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) {
            rejectedReasons.noTokenTransfers++;
            continue;
        }

        // Verificar native transfers
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
        const tokenTransfers = tx.tokenTransfers.filter(t =>
            t.mint !== SOL_MINT &&
            (t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress)
        );

        if (tokenTransfers.length === 0) {
            rejectedReasons.other++;
            continue;
        }

        const tokenTransfer = tokenTransfers[0];
        const isBuy = solNet < 0;

        const tokenAmount = isBuy
            ? tokenTransfers.find(t => t.toUserAccount === walletAddress)?.tokenAmount || 0
            : tokenTransfers.find(t => t.fromUserAccount === walletAddress)?.tokenAmount || 0;

        if (tokenAmount === 0) {
            rejectedReasons.noTokenAmount++;
            continue;
        }

        const pricePerToken = Math.abs(solNet) / tokenAmount;

        // FILTRO 2: Precio fuera de rango
        if (pricePerToken > 1 || pricePerToken < 0.0000001) {
            rejectedReasons.priceOutOfRange++;
            rejectedTradesDetails.push({
                signature: tx.signature?.substring(0, 20) + '...',
                reason: 'PRICE_OUT_OF_RANGE',
                price: pricePerToken.toExponential(2),
                solAmount: Math.abs(solNet).toFixed(4),
                tokenAmount: tokenAmount.toFixed(2)
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

    // Resultados
    console.log('📊 RESULTADOS DEL ANÁLISIS:');
    console.log('═'.repeat(60));
    console.log(`Total de transacciones:        ${transactions.length}`);
    console.log(`Transacciones tipo SWAP:       ${swapCount}`);
    console.log(`✅ Trades VÁLIDOS extraídos:   ${validTrades}`);
    console.log(`❌ Trades RECHAZADOS:          ${swapCount - validTrades}`);
    console.log('');
    console.log('🚫 RAZONES DE RECHAZO:');
    console.log('─'.repeat(60));
    console.log(`  • No es SWAP:                ${rejectedReasons.notSwap}`);
    console.log(`  • Sin token transfers:       ${rejectedReasons.noTokenTransfers}`);
    console.log(`  • Sin native transfers:      ${rejectedReasons.noNativeTransfers}`);
    console.log(`  • Dust (< 0.001 SOL):        ${rejectedReasons.dustTrade}`);
    console.log(`  • Precio fuera de rango:     ${rejectedReasons.priceOutOfRange} ⚠️ PROBLEMA PRINCIPAL`);
    console.log(`  • Transferencia masiva:      ${rejectedReasons.massiveTransfer}`);
    console.log(`  • Sin token amount:          ${rejectedReasons.noTokenAmount}`);
    console.log(`  • Otros:                     ${rejectedReasons.other}`);
    console.log('');

    // Mostrar algunos trades rechazados por precio
    if (rejectedTradesDetails.filter(t => t.reason === 'PRICE_OUT_OF_RANGE').length > 0) {
        console.log('🔍 EJEMPLOS DE TRADES RECHAZADOS POR PRECIO:');
        console.log('─'.repeat(60));
        rejectedTradesDetails
            .filter(t => t.reason === 'PRICE_OUT_OF_RANGE')
            .slice(0, 10)
            .forEach(t => {
                console.log(`  ${t.signature}`);
                console.log(`    Precio: ${t.price} SOL/token`);
                console.log(`    SOL: ${t.solAmount}, Tokens: ${t.tokenAmount}`);
            });
    }

    console.log('\n═'.repeat(60));
    console.log(`\n💡 El problema es que el filtro de precio (0.0000001 - 1.0 SOL)`);
    console.log(`   está descartando ${rejectedReasons.priceOutOfRange} trades válidos.\n`);

    return {
        totalTransactions: transactions.length,
        swapCount,
        validTrades,
        rejectedReasons
    };
}

async function main() {
    console.log('🚀 Debug de extracción de trades');
    console.log('Wallet:', WALLET_ADDRESS);
    console.log('');

    try {
        const transactions = await fetchTransactions(WALLET_ADDRESS, 1000);
        const results = analyzeTransactions(transactions, WALLET_ADDRESS);

        console.log('\n✅ Análisis completado');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
