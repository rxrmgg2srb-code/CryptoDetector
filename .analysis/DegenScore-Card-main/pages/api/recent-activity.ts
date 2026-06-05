import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { rateLimit } from '../../lib/rateLimitRedis';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await rateLimit(req, res))) {
    return;
  }

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    // Get recent activity from the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const activities = await prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: tenMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Format activities for display
    const formatted = activities.map((activity) => {
      const wallet = activity.walletAddress;
      const shortWallet = `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;

      let displayText = '';
      let emoji = '';

      switch (activity.action) {
        case 'upgrade':
          emoji = '🚀';
          displayText = 'just upgraded to PREMIUM!';
          break;
        case 'moonshot':
          emoji = '🌙';
          const gain = (activity.metadata as any)?.gain || '10x';
          displayText = `just caught a ${gain} moonshot!`;
          break;
        case 'leaderboard':
          emoji = '📈';
          const rank = (activity.metadata as any)?.rank || 'top 10';
          displayText = `climbed to #${rank}!`;
          break;
        case 'referral':
          emoji = '🎁';
          const count = (activity.metadata as any)?.count || 1;
          displayText = `referred ${count} new degen${count > 1 ? 's' : ''}!`;
          break;
        case 'share':
          emoji = '📱';
          displayText = 'shared their card on Twitter!';
          break;
        case 'checkin':
          emoji = '🔥';
          const streak = (activity.metadata as any)?.streak || 1;
          displayText = `${streak}-day streak!`;
          break;
        default:
          emoji = '✨';
          displayText = 'did something cool!';
      }

      return {
        id: activity.id,
        wallet: shortWallet,
        fullWallet: wallet,
        action: activity.action,
        displayText,
        emoji,
        timestamp: activity.createdAt,
        metadata: activity.metadata,
      };
    });

    res.status(200).json({
      success: true,
      activities: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    logger.error('Error fetching recent activity:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch activity',
    });
  }
}
