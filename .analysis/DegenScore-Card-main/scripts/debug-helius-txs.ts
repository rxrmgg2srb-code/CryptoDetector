/**
 * Debug script to fetch raw Helius transactions and save them to a file
 * This helps us understand why we are missing trades.
 */

const API_KEY = 'd65a816a-162e-4dd6-9841-c607146e03e3';
const WALLET = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm';
const fs = require('fs');
const path = require('path');

async function debugHelius() {
    console.log('🔍 Fetching raw Helius transactions...');

    // Usar el endpoint estándar de transacciones parseadas
    const url = `https://api.helius.xyz/v0/addresses/${WALLET}/transactions?api-key=${API_KEY}&limit=20`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log(`✅ Fetched ${data.length} transactions`);

        // Guardar en archivo para inspección
        const outputPath = path.join(process.cwd(), 'helius_debug_txs.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`💾 Saved to ${outputPath}`);

        // Imprimir resumen
        console.log('\n📊 Transaction Types:');
        const types = new Map();
        data.forEach((tx: any) => {
            const type = tx.type;
            types.set(type, (types.get(type) || 0) + 1);
        });

        types.forEach((count, type) => {
            console.log(`  ${type}: ${count}`);
        });

        // Analizar la primera transacción UNKNOWN si existe
        const unknown = data.find((tx: any) => tx.type === 'UNKNOWN');
        if (unknown) {
            console.log('\n🕵️ Analyzing first UNKNOWN transaction:');
            console.log(`  Signature: ${unknown.signature}`);
            console.log(`  Source: ${unknown.source}`);
            console.log(`  Token Transfers: ${unknown.tokenTransfers?.length || 0}`);
            console.log(`  Native Transfers: ${unknown.nativeTransfers?.length || 0}`);

            if (unknown.tokenTransfers?.length > 0) {
                console.log('  Token Transfers:', JSON.stringify(unknown.tokenTransfers, null, 2));
            }
        }

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

debugHelius();
