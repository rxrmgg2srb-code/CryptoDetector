import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { isValidSolanaAddress } from '../../../lib/validation';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '../../../lib/logger';
import { notifyNewFollower } from '../../../lib/notifications';

/**
 * API endpoint to follow a wallet
 * Requires authentication
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
      logger.warn('Invalid authentication token for follow:', { error: authResult.error });
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const followerWallet = authResult.wallet!;
    const { followingWallet } = req.body;

    // Validate following wallet address
    if (!followingWallet || typeof followingWallet !== 'string') {
      return res.status(400).json({ error: 'Following wallet address is required' });
    }

    if (!isValidSolanaAddress(followingWallet)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Prevent self-following
    if (followerWallet === followingWallet) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    logger.debug('Follow request:', { follower: followerWallet, following: followingWallet });

    // Check if following wallet exists in database
    const targetCard = await prisma.degenCard.findUnique({
      where: { walletAddress: followingWallet },
    });

    if (!targetCard) {
      return res.status(404).json({ error: 'Wallet not found in DegenScore database' });
    }

    // Create follow relationship (will fail silently if already exists due to unique constraint)
    const follow = await prisma.userFollows.upsert({
      where: {
        follower_following: {
          follower: followerWallet,
          following: followingWallet,
        },
      },
      update: {}, // No updates needed if already exists
      create: {
        follower: followerWallet,
        following: followingWallet,
      },
    });

    logger.info('Follow created:', { follower: followerWallet, following: followingWallet });

    // Send notification to the followed wallet (non-blocking)
    notifyNewFollower(followingWallet, followerWallet).catch((err) => {
      logger.error('Failed to send follow notification:', err);
    });

    res.status(200).json({
      success: true,
      message: 'Successfully followed wallet',
      follow: {
        follower: follow.follower,
        following: follow.following,
        createdAt: follow.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Error adding follow:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(200).json({
        success: true,
        message: 'Already following this wallet',
      });
    }

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to follow wallet';

    res.status(500).json({ error: errorMessage });
  }
}
