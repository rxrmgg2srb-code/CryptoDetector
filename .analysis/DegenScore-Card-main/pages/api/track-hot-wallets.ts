import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { getWalletTransactions } from '../../lib/services/helius'; // <--- RUTA CORREGIDA
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir POST con API key (para seguridad del cron)
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    logger.info('🔥 Starting Hot Wallet Tracker...'); // 1. Obtener Top 10 wallets pagadas del leaderboard

    const topWallets = await prisma.degenCard.findMany({
      where: { isPaid: true },
      orderBy: { degenScore: 'desc' },
      take: 10,
      select: {
        walletAddress: true,
        displayName: true,
        degenScore: true,
      },
    });

    logger.info(`📊 Tracking ${topWallets.length} top wallets`);

    let newTradesCount = 0; // 2. Para cada wallet, obtener sus últimas transacciones

    for (const wallet of topWallets) {
      try {
        logger.info(`🔍 Analyzing ${wallet.displayName || wallet.walletAddress}...`); // Obtener últimas 20 transacciones

        const transactions = await getWalletTransactions(wallet.walletAddress, 20); // Filter only recent swaps (últimas 6 horas)

        const sixHoursAgo = Date.now() / 1000 - 6 * 60 * 60;
        const recentSwaps = transactions.filter(
          (tx) =>
            (tx.type === 'SWAP' || tx.description?.toLowerCase().includes('swap')) &&
            tx.timestamp > sixHoursAgo
        );

        logger.info(`  Found ${recentSwaps.length} recent swaps`); // 3. Procesar cada swap

        for (const swap of recentSwaps) {
          // Verificar si ya existe esta transacción
          const existing = await prisma.hotTrade.findFirst({
            where: {
              walletAddress: wallet.walletAddress,
              timestamp: new Date(swap.timestamp * 1000),
            },
          });

          if (existing) {
            logger.info(`  ⏭️  Skip: Trade already tracked`);
            continue;
          } // Determinar si es compra o venta (simplificado)

          let type = 'buy';
          let solAmount = 0;
          let tokenMint = '';

          if (swap.nativeTransfers && swap.nativeTransfers.length > 0) {
            for (const transfer of swap.nativeTransfers) {
              if (transfer.fromUserAccount === wallet.walletAddress) {
                solAmount += transfer.amount / 1e9;
                type = 'buy';
              }
              if (transfer.toUserAccount === wallet.walletAddress) {
                solAmount += transfer.amount / 1e9;
                type = 'sell';
              }
            }
          } // Obtener token mint

          if (swap.tokenTransfers && swap.tokenTransfers.length > 0) {
            tokenMint = swap.tokenTransfers[0]!.mint;
          }

          if (solAmount === 0 || !tokenMint) {
            logger.info(`  ⏭️  Skip: Invalid swap data`);
            continue;
          } // 4. Guardar el trade

          await prisma.hotTrade.create({
            data: {
              walletAddress: wallet.walletAddress,
              displayName: wallet.displayName,
              tokenMint,
              tokenSymbol: null, // Lo obtendremos después
              type,
              solAmount: Math.abs(solAmount),
              timestamp: new Date(swap.timestamp * 1000),
              degenScore: wallet.degenScore,
              createdAt: new Date(), // Agregar createdAt para la limpieza
            },
          });

          newTradesCount++;
          logger.info(`  ✅ Saved ${type} of ${solAmount.toFixed(2)} SOL`);
        } // Delay para no saturar Helius

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(
          `❌ Error analyzing ${wallet.walletAddress}:`,
          error instanceof Error ? error : undefined,
          {
            error: String(error),
          }
        );
        continue;
      }
    }

    logger.info(`🎉 Tracking complete! ${newTradesCount} new trades saved`); // 5. Limpiar trades antiguos (más de 7 días)

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.hotTrade.deleteMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
      },
    });

    logger.info(`🗑️  Cleaned ${deleted.count} old trades`);

    res.status(200).json({
      success: true,
      trackedWallets: topWallets.length,
      newTrades: newTradesCount,
      cleanedTrades: deleted.count,
    });
  } catch (error) {
    logger.error('❌ Error in hot wallet tracker:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to track hot wallets',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
