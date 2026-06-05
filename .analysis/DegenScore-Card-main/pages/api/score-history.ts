import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { isValidSolanaAddress } from '../../lib/validation';
import { logger } from '../../lib/logger';

/**
 * API endpoint para obtener el historial de scores de una wallet
 * Permite generar gráficos de evolución temporal
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, days = '30' } = req.query;

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Validate days parameter
    const daysNum = parseInt(days as string, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 90) {
      return res.status(400).json({ error: 'Invalid days parameter (1-90)' });
    }

    logger.debug('Score history request:', { walletAddress, days: daysNum });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Fetch score history
    const history = await prisma.scoreHistory.findMany({
      where: {
        walletAddress,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        timestamp: true,
        score: true,
        rank: true,
        totalTrades: true,
        totalVolume: true,
        profitLoss: true,
        winRate: true,
        badges: true,
      },
    });

    if (history.length === 0) {
      return res.status(404).json({
        error: 'No history found',
        message:
          'Esta wallet no tiene historial de scores aún. El historial se genera cada 6 horas para usuarios premium.',
      });
    }

    // Calculate statistics
    const scores = history.map((h) => h.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const latestScore = scores[scores.length - 1] as number;
    const firstScore = scores[0] as number;
    const scoreChange = latestScore - firstScore;
    const scoreChangePercent = firstScore > 0 ? (scoreChange / firstScore) * 100 : 0;

    // Best rank
    const ranks = history.filter((h) => h.rank !== null).map((h) => h.rank!);
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;

    res.status(200).json({
      walletAddress,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: daysNum,
      },
      dataPoints: history.length,
      history: history.map((h) => ({
        timestamp: h.timestamp.toISOString(),
        score: h.score,
        rank: h.rank,
        totalTrades: h.totalTrades,
        totalVolume: h.totalVolume,
        profitLoss: h.profitLoss,
        winRate: h.winRate,
        badges: h.badges,
      })),
      statistics: {
        current: latestScore,
        max: maxScore,
        min: minScore,
        average: Math.round(avgScore),
        change: scoreChange,
        changePercent: parseFloat(scoreChangePercent.toFixed(2)),
        bestRank,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching score history:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch score history';

    res.status(500).json({ error: errorMessage });
  }
}
