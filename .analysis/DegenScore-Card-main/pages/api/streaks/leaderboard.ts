import type { NextApiRequest, NextApiResponse } from 'next';
import { getStreakLeaderboard } from '../../../lib/streaks';
import { logger } from '../../../lib/logger';

/**
 * API endpoint to get streak leaderboard
 * Public endpoint - no auth required
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '100' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({ error: 'Invalid limit parameter (1-1000)' });
    }

    logger.debug('Fetching streak leaderboard:', { limit: limitNum });

    const leaderboard = await getStreakLeaderboard(limitNum);

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error: any) {
    logger.error('Error fetching streak leaderboard:', error);

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch leaderboard';

    res.status(500).json({ error: errorMessage });
  }
}
