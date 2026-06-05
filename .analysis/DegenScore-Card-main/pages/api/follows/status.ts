import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { isValidSolanaAddress } from '../../../lib/validation';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '../../../lib/logger';

/**
 * API endpoint to check follow status
 * Requires authentication to check if the authenticated user follows a wallet
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const followerWallet = authResult.wallet!;
    const { walletAddress } = req.query;

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Check if follow exists
    const follow = await prisma.userFollows.findUnique({
      where: {
        follower_following: {
          follower: followerWallet,
          following: walletAddress,
        },
      },
    });

    // Get follower/following counts
    const [followingCount, followersCount] = await Promise.all([
      prisma.userFollows.count({
        where: { follower: walletAddress },
      }),
      prisma.userFollows.count({
        where: { following: walletAddress },
      }),
    ]);

    res.status(200).json({
      isFollowing: follow !== null,
      followedAt: follow ? follow.createdAt.toISOString() : null,
      counts: {
        following: followingCount,
        followers: followersCount,
      },
    });
  } catch (error: any) {
    logger.error('Error checking follow status:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to check follow status';

    res.status(500).json({ error: errorMessage });
  }
}
