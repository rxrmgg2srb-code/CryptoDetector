import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySessionToken } from '../../../lib/walletAuth';
import { checkDailyStreak } from '../../../lib/streaks';
import { logger } from '../../../lib/logger';

/**
 * API endpoint for daily streak check-in
 * Automatically called when user visits the app
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const authResult = verifySessionToken(token);

    if (!authResult.valid) {
      logger.warn('Invalid authentication token for streak check-in', { error: authResult.error });
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const walletAddress = authResult.wallet!;

    logger.debug('Streak check-in:', { walletAddress });

    // Check/update streak
    const streakInfo = await checkDailyStreak(walletAddress);

    res.status(200).json({
      success: true,
      streak: streakInfo,
    });
  } catch (error: any) {
    logger.error('Error in streak check-in:', error);

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to check streak';

    res.status(500).json({ error: errorMessage });
  }
}
