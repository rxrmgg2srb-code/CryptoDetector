import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { isValidSolanaAddress } from '../../../lib/validation';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '../../../lib/logger';

/**
 * API endpoint to unfollow a wallet
 * Requires authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
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
      logger.warn('Invalid authentication token for unfollow:', { error: authResult.error });
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const followerWallet = authResult.wallet!;
    const { followingWallet } = req.method === 'DELETE' ? req.query : req.body;

    // Validate following wallet address
    if (!followingWallet || typeof followingWallet !== 'string') {
      return res.status(400).json({ error: 'Following wallet address is required' });
    }

    if (!isValidSolanaAddress(followingWallet)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    logger.debug('Unfollow request:', { follower: followerWallet, following: followingWallet });

    // Delete follow relationship
    const result = await prisma.userFollows.deleteMany({
      where: {
        follower: followerWallet,
        following: followingWallet,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    logger.info('Follow removed:', { follower: followerWallet, following: followingWallet });

    res.status(200).json({
      success: true,
      message: 'Successfully unfollowed wallet',
    });
  } catch (error: any) {
    logger.error('Error removing follow:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to unfollow wallet';

    res.status(500).json({ error: errorMessage });
  }
}
