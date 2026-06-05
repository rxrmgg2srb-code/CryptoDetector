import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';

/**
 * Cron job para guardar snapshots de scores cada 6 horas
 * Permite generar gráficos de evolución temporal
 *
 * Configurar en Render/Vercel Cron:
 * - Schedule: 0 star-slash-6 star star star (cada 6 horas) - replace star-slash with asterisk-slash
 * - URL: https://your-app.com/api/cron/record-scores
 * - Headers: x-cron-key: <CRON_API_KEY>
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Verify cron authentication
  const cronKey = req.headers['x-cron-key'] as string;
  if (!cronKey || cronKey !== process.env.CRON_API_KEY) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logger.warn('Unauthorized cron attempt:', { ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    logger.info('Starting score history recording...');

    // Obtener top 1000 cards (suficiente para tracking)
    const topCards = await prisma.degenCard.findMany({
      where: {
        isPaid: true, // Solo trackear usuarios premium
      },
      orderBy: {
        degenScore: 'desc',
      },
      take: 1000,
      include: {
        badges: true,
      },
    });

    logger.info(`Found ${topCards.length} cards to record`);

    // Guardar snapshot de cada card
    const snapshots = topCards.map((card, index) => ({
      walletAddress: card.walletAddress,
      score: card.degenScore,
      rank: index + 1,
      totalTrades: card.totalTrades,
      totalVolume: card.totalVolume,
      profitLoss: card.profitLoss,
      winRate: card.winRate,
      badges: card.badges.length,
    }));

    // Insertar en batch (más eficiente)
    const result = await prisma.scoreHistory.createMany({
      data: snapshots,
      skipDuplicates: true,
    });

    logger.info(`Successfully recorded ${result.count} score snapshots`);

    // Cleanup: Eliminar snapshots antiguos (más de 90 días)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleted = await prisma.scoreHistory.deleteMany({
      where: {
        timestamp: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(`Cleaned up ${deleted.count} old snapshots`);

    res.status(200).json({
      success: true,
      recorded: result.count,
      deleted: deleted.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error recording score history:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to record score history';

    res.status(500).json({ error: errorMessage });
  }
}
