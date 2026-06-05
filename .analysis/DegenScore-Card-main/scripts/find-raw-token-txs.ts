/**
 * 🔍 Script RAW para buscar todas las transacciones de un token específico
 */

import { getWalletTransactions } from '../lib/services/helius';

async function findRawTokenTxs() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    const targetToken = 'HJBoRECiJddTZQZpuY8pHenf5CZ2yjju4npekmvbpump';

    console.log('🔍 BUSCANDO TRANSACCIONES RAW DEL TOKEN\n');
    console.log(`📍 Wallet: ${wallet}`);
    console.log(`🎯 Token: ${targetToken}\n`);

    try {
        console.log('Fetching all transactions...\n');
        const allTxs: any[] = [];
        let before: string | undefined;

        // Fetch all transactions
        for (let i = 0; i < 100; i++) {
            const batch = await getWalletTransactions(wallet, 100, before);
            if (batch.length === 0) break;
            allTxs.push(...batch);
            before = batch[batch.length - 1]?.signature;
            if (i % 20 === 0) {
                console.log(`Fetched ${allTxs.length} transactions...`);
            }
            await new Promise(r => setTimeout(r, 300));
        }

        console.log(`\nTotal transactions: ${allTxs.length}\n`);

        // Find all txs with this token
        const tokenTxs = allTxs.filter(tx => {
            if (!tx.tokenTransfers) return false;
            return tx.tokenTransfers.some((t: any) => t.mint === targetToken);
        });

        console.log(`Found ${tokenTxs.length} transactions with token ${targetToken}\n`);

        if (tokenTxs.length === 0) {
            console.log('❌ NO TRANSACTIONS FOUND FOR THIS TOKEN');
            console.log('⚠️ This token may not have been traded by this wallet');
            return;
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━═━━━━━━━━━━━━━━━━');
        console.log('📋 TRANSACCIONES ENCONTRADAS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let totalSolIn = 0;
        let totalSolOut = 0;

        tokenTxs.forEach((tx, i) => {
            console.log(`\n${i + 1}. Signature: ${tx.signature.substring(0, 20)}...`);
            console.log(`   Type: ${tx.type}`);
            console.log(`   Source: ${tx.source || 'NONE'}`);
            console.log(`   Timestamp: ${new Date(tx.timestamp * 1000).toISOString()}`);

            // SOL flow
            if (tx.nativeTransfers) {
                let solNet = 0;
                for (const nt of tx.nativeTransfers) {
                    if (nt.fromUserAccount === wallet) {
                        solNet -= nt.amount / 1e9;
                        totalSolOut += nt.amount / 1e9;
                    }
                    if (nt.toUserAccount === wallet) {
                        solNet += nt.amount / 1e9;
                        totalSolIn += nt.amount / 1e9;
                    }
                }
                console.log(`   SOL flow: ${solNet >= 0 ? '+' : ''}${solNet.toFixed(6)} SOL`);
                console.log(`   Direction: ${solNet < 0 ? 'BUY' : 'SELL'}`);
            } else {
                console.log(`   ⚠️ No native transfers`);
            }

            // Token flow
            const tokenTransfers = tx.tokenTransfers.filter((t: any) => t.mint === targetToken);
            tokenTransfers.forEach((tt: any) => {
                const direction = tt.toUserAccount === wallet ? 'IN' : 'OUT';
                console.log(`   Token ${direction}: ${tt.tokenAmount} tokens`);
            });
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log(`  Total transacciones: ${tokenTxs.length}`);
        console.log(`  SOL gastado (compras): ${totalSolOut.toFixed(4)} SOL`);
        console.log(`  SOL recibido (ventas): ${totalSolIn.toFixed(4)} SOL`);
        console.log(`  P&L neto: ${(totalSolIn - totalSolOut).toFixed(4)} SOL`);

        if (totalSolOut > 0) {
            const roi = ((totalSolIn - totalSolOut) / totalSolOut) * 100;
            console.log(`  ROI: ${roi.toFixed(2)}%`);
            console.log(`\n  Usuario reportó: 668.32%`);
            console.log(`  Diferencia: ${Math.abs(roi - 668.32).toFixed(2)}%`);
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
        if (error instanceof Error) {
            console.error('   Stack:', error.stack);
        }
    }
}

findRawTokenTxs();
