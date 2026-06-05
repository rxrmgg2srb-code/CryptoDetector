import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();

    // Get current active challenge
    const currentChallenge = await prisma.weeklyChallenge.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    if (!currentChallenge) {
      return res.status(200).json({
        hasChallenge: false,
        message: 'No active challenge this week',
      });
    }

    // Get current leader based on metric
    const leaderQuery: any = {
      where: { isPaid: true },
      orderBy: {},
      take: 1,
      select: {
        walletAddress: true,
        displayName: true,
        degenScore: true,
        totalVolume: true,
        winRate: true,
        profitLoss: true,
        bestTrade: true,
        likes: true,
      },
    };

    // Set the orderBy based on challenge metric
    switch (currentChallenge.metric) {
      case 'likes':
        leaderQuery.orderBy = { likes: 'desc' };
        break;
      case 'profit':
        leaderQuery.orderBy = { profitLoss: 'desc' };
        break;
      case 'winRate':
        leaderQuery.orderBy = { winRate: 'desc' };
        break;
      case 'volume':
        leaderQuery.orderBy = { totalVolume: 'desc' };
        break;
      case 'bestTrade':
        leaderQuery.orderBy = { bestTrade: 'desc' };
        break;
      default:
        leaderQuery.orderBy = { degenScore: 'desc' };
    }

    const currentLeader = await prisma.degenCard.findFirst(leaderQuery);

    // Calculate time remaining
    const timeRemaining = currentChallenge.endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

    res.status(200).json({
      hasChallenge: true,
      challenge: {
        id: currentChallenge.id,
        title: currentChallenge.title,
        description: currentChallenge.description,
        metric: currentChallenge.metric,
        prizeSOL: currentChallenge.prizeSOL,
        startDate: currentChallenge.startDate,
        endDate: currentChallenge.endDate,
        daysRemaining,
        winner: currentChallenge.winnerAddress
          ? {
              address: currentChallenge.winnerAddress,
              score: currentChallenge.winnerScore,
            }
          : null,
      },
      currentLeader: currentLeader
        ? {
            address: currentLeader.walletAddress,
            displayName: currentLeader.displayName || 'Anonymous',
            score: getMetricValue(currentLeader, currentChallenge.metric),
          }
        : null,
    });
  } catch (error) {
    logger.error('Error fetching current challenge', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to fetch current challenge',
    });
  }
}

function getMetricValue(card: any, metric: string): number {
  switch (metric) {
    case 'likes':
      return card.likes;
    case 'profit':
      return card.profitLoss;
    case 'winRate':
      return card.winRate;
    case 'volume':
      return card.totalVolume;
    case 'bestTrade':
      return card.bestTrade;
    default:
      return card.degenScore;
  }
}
