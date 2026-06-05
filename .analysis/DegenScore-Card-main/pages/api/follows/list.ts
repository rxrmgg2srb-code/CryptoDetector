import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { isValidSolanaAddress } from '../../../lib/validation';
import { logger } from '../../../lib/logger';

/**
 * API endpoint to list followed wallets
 * Public endpoint - can view anyone's following list
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.query;

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    logger.debug('List follows request:', { walletAddress });

    // Fetch all wallets this user follows with card data
    const follows = await prisma.userFollows.findMany({
      where: {
        follower: walletAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch card data for all followed wallets
    const followedWallets = await Promise.all(
      follows.map(async (follow) => {
        const card = await prisma.degenCard.findUnique({
          where: { walletAddress: follow.following },
          select: {
            walletAddress: true,
            degenScore: true,
            totalTrades: true,
            totalVolume: true,
            winRate: true,
            isPaid: true,
            displayName: true,
            profileImage: true,
            updatedAt: true,
          },
        });

        return {
          walletAddress: follow.following,
          followedAt: follow.createdAt.toISOString(),
          card: card || null,
        };
      })
    );

    // Filter out wallets that no longer exist
    const validFollows = followedWallets.filter((f) => f.card !== null);

    res.status(200).json({
      walletAddress,
      following: validFollows.length,
      wallets: validFollows,
    });
  } catch (error: any) {
    logger.error('Error listing follows:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to list follows';

    res.status(500).json({ error: errorMessage });
  }
}
