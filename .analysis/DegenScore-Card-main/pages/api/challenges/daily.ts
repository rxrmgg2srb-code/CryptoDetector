import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySessionToken } from '../../../lib/walletAuth';
import {
  getDailyChallenges,
  updateChallengeProgress,
  getUserChallengeStats,
} from '../../../lib/challenges';
import { logger } from '../../../lib/logger';

/**
 * API endpoint for daily challenges
 * GET: Get today's challenges (with user progress if authenticated)
 * POST: Update challenge progress
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET - Fetch today's challenges
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    let walletAddress: string | undefined;

    // Optional authentication - if provided, include user progress
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const authResult = verifySessionToken(token);

      if (authResult.valid) {
        walletAddress = authResult.wallet!;
      }
    }

    logger.debug('Fetching daily challenges:', { walletAddress });

    const challenges = await getDailyChallenges(walletAddress);

    // Get user stats if authenticated
    let stats;
    if (walletAddress) {
      stats = await getUserChallengeStats(walletAddress);
    }

    res.status(200).json({
      success: true,
      challenges,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching daily challenges:', error);

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch challenges';

    res.status(500).json({ error: errorMessage });
  }
}

/**
 * POST - Update challenge progress
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const authResult = verifySessionToken(token);

    if (!authResult.valid) {
      logger.warn('Invalid authentication token for challenge update', { error: authResult.error });
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const walletAddress = authResult.wallet!;
    const { challengeType, increment = 1 } = req.body;

    if (!challengeType) {
      return res.status(400).json({ error: 'challengeType is required' });
    }

    logger.debug('Updating challenge progress:', { walletAddress, challengeType, increment });

    await updateChallengeProgress(walletAddress, challengeType, increment);

    // Get updated challenges
    const challenges = await getDailyChallenges(walletAddress);
    const stats = await getUserChallengeStats(walletAddress);

    res.status(200).json({
      success: true,
      message: 'Challenge progress updated',
      challenges,
      stats,
    });
  } catch (error: any) {
    logger.error('Error updating challenge progress:', error);

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to update challenge';

    res.status(500).json({ error: errorMessage });
  }
}
