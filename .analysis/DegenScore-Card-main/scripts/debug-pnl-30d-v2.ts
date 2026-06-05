/**
 * 🔍 Análisis mejorado de P&L para los últimos 30 días usando PnLCalculator
 */

import { getWalletTransactions } from '../lib/services/helius';


// Importar extractTrades del metricsEngine
// Como no está exportado, usamos lógica inline similar

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const EXCLUDED_TOKENS = new Set([
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
]);

interface Trade {
    timestamp: number;
    tokenMint: string;
    type: 'buy' | 'sell';
    solAmount: number;
    tokenAmount: number;
    pricePerToken: number;
}

async function analyze30DaysV2() {
    const wallet = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';
    const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
    const startTime = Date.now() - DAYS_30;

    console.log('🔍 ANÁLISIS MEJORADO P&L - 30 DÍAS\n');
    console.log(`📍 Wallet: ${wallet}`);
    console.log(`📅 Desde: ${new Date(startTime).toISOString()}\n`);

    // Fetch transactions
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
            console.log('  ✅ Reached 30 day limit');
        } else {
            before = batch[batch.length - 1].signature;
            process.stdout.write(`  Fetched ${allTxs.length} txs...\r`);
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log(`\n\n📊 Total transactions (30d): ${allTxs.length}`);

    // Extract trades usando lógica mejorada
    const trades: Trade[] = [];

    for (const tx of allTxs) {
        if (!tx.tokenTransfers || !tx.nativeTransfers) continue;
        if (tx.tokenTransfers.length === 0 || tx.nativeTransfers.length === 0) continue;

        // Calculate SOL net
        let solNet = 0;
        for (const nt of tx.nativeTransfers) {
            if (nt.fromUserAccount === wallet) solNet -= nt.amount / 1e9;
            if (nt.toUserAccount === wallet) solNet += nt.amount / 1e9;
        }

        // Get relevant token transfers
        const relevantTokenTransfers = tx.tokenTransfers.filter(
            (t: any) => t.mint !== SOL_MINT && !EXCLUDED_TOKENS.has(t.mint) &&
                (t.fromUserAccount === wallet || t.toUserAccount === wallet)
        );

        if (relevantTokenTransfers.length === 0) continue;

        // Calculate token net per mint
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

        // Get primary mint
        let primaryMint = '';
        let primaryTokenNet = 0;

        for (const [mint, netBalance] of tokenNetBalances.entries()) {
            if (Math.abs(netBalance) > Math.abs(primaryTokenNet)) {
                primaryMint = mint;
                primaryTokenNet = netBalance;
            }
        }

        if (!primaryMint || primaryTokenNet === 0) continue;

        // Determine buy/sell with tolerance
        const TOLERANCE = 0.0001;
        let isBuy = solNet < -TOLERANCE && primaryTokenNet > 0;
        let isSell = solNet > TOLERANCE && primaryTokenNet < 0;

        // SWAP inference
        const isSwapType = tx.type === 'SWAP';
        const hasSignificantTokenFlow = Math.abs(primaryTokenNet) > 1;

        if (!isBuy && !isSell && isSwapType && hasSignificantTokenFlow) {
            isBuy = primaryTokenNet > 0;
            isSell = primaryTokenNet < 0;
        }

        if (!isBuy && !isSell) continue;

        const solAmount = Math.abs(solNet);
        const tokenAmount = Math.abs(primaryTokenNet);

        // Dust filter
        if (solAmount < 0.001) continue;

        // Sanity checks
        const pricePerToken = solAmount / tokenAmount;
        if (pricePerToken < 0.000000000000001 || pricePerToken > 10000000) continue;
        if (solAmount > 10000) continue;

        trades.push({
            timestamp: tx.timestamp,
            tokenMint: primaryMint,
            type: isBuy ? 'buy' : 'sell',
            solAmount,
            tokenAmount,
            pricePerToken
        });
    }

    console.log(`✅ Extracted ${trades.length} trades\n`);

    // Summarize
    const buys = trades.filter(t => t.type === 'buy');
    const sells = trades.filter(t => t.type === 'sell');

    const totalBuySOL = buys.reduce((sum, t) => sum + t.solAmount, 0);
    const totalSellSOL = sells.reduce((sum, t) => sum + t.solAmount, 0);
    const pnl = totalSellSOL - totalBuySOL;

    const solPrice = 132.61;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 COMPARACIÓN MEJORADA 30 DÍAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`  Transacciones totales: ${allTxs.length}`);
    console.log(`  Trades extraídos:      ${trades.length}`);
    console.log(`  Compras:               ${buys.length}`);
    console.log(`  Ventas:                ${sells.length}\n`);

    console.log(`  Total SOL Compras:     ${totalBuySOL.toFixed(4)} SOL ($${(totalBuySOL * solPrice).toFixed(2)})`);
    console.log(`  Total SOL Ventas:      ${totalSellSOL.toFixed(4)} SOL ($${(totalSellSOL * solPrice).toFixed(2)})`);
    console.log(`  P&L:                   ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL ($${(pnl * solPrice).toFixed(2)})\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('COMPARACIÓN CON GMGN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`METRICA         | NUESTRO        | GMGN          | DIFF`);
    console.log(`----------------|----------------|---------------|------`);
    console.log(`Trades          | ${trades.length.toString().padEnd(14)} | 184 (93+91)   | ${trades.length - 184}`);
    console.log(`Compras         | ${buys.length.toString().padEnd(14)} | 93            | ${buys.length - 93}`);
    console.log(`Ventas          | ${sells.length.toString().padEnd(14)} | 91            | ${sells.length - 91}`);
    console.log(`Costo ($)       | $${(totalBuySOL * solPrice).toFixed(2).padEnd(13)} | $12,300       | $${((totalBuySOL * solPrice) - 12300).toFixed(2)}`);
    console.log(`P&L ($)         | $${(pnl * solPrice).toFixed(2).padEnd(13)} | +$36.02       | $${((pnl * solPrice) - 36.02).toFixed(2)}`);

    if (Math.abs((totalBuySOL * solPrice) - 12300) < 1000) {
        console.log('\n✅ COSTO: Muy cerca (< $1000 diferencia)');
    }

    if (buys.length === 93 && sells.length === 91) {
        console.log('✅ CONTEO: ¡Perfecto! Mismo número de trades que GMGN');
    } else if (buys.length > 93 || sells.length > 91) {
        console.log(`⚠️ CONTEO: Capturamos ${buys.length - 93} compras y ${sells.length - 91} ventas extras`);
    }
}

analyze30DaysV2();
