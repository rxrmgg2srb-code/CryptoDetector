/**
 * 🧪 Probar con wallet de trader conocido
 */

import {
    getAllDeFiSwaps,
    convertHeliusSwapsToTrades,
} from '../lib/services/heliusDeFiService';

async function main() {
    // Wallet de trader activo conocido
    const walletAddress = 'DCAKuApAuZtVNYLk3KTAVW9GLWVvPbnb5CxxRRmVgcTr';

    console.log('🔥 Probando con wallet de trader activo\n');
    console.log(`📍 Wallet: ${walletAddress}\n`);

    try {
        const swaps = await getAllDeFiSwaps(walletAddress, 500);

        console.log(`✅ Swaps encontrados: ${swaps.length}\n`);

        if (swaps.length > 0) {
            const trades = convertHeliusSwapsToTrades(swaps, walletAddress);

            console.log(`✅ Trades válidos: ${trades.length}`);

            const totalVolume = trades.reduce((sum, t) => sum + t.solAmount, 0);
            console.log(`💰 Volumen total: ${totalVolume.toFixed(2)} SOL`);

            const buys = trades.filter(t => t.type === 'buy').length;
            const sells = trades.filter(t => t.type === 'sell').length;
            console.log(`📊 Compras: ${buys} | Ventas: ${sells}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
