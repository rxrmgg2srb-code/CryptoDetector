import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { isValidSolanaAddress } from '../../lib/validation';
import { logger } from '../../lib/logger';

/**
 * API endpoint to get card data by wallet address
 * Used for profile pages and card viewing
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

    logger.debug('Fetching card data for:', { walletAddress });

    // Fetch card data with all relations
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
      include: {
        badges: {
          select: {
            name: true,
            rarity: true,
            icon: true,
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Return card data
    res.status(200).json({
      walletAddress: card.walletAddress,
      degenScore: card.degenScore,
      totalTrades: card.totalTrades,
      totalVolume: card.totalVolume,
      profitLoss: card.profitLoss,
      winRate: card.winRate,
      avgHoldTime: card.avgHoldTime,
      isPaid: card.isPaid,
      displayName: card.displayName,
      profileImage: card.profileImage,
      badges: card.badges,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    });
  } catch (error: any) {
    logger.error('Error fetching card data:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch card data';

    res.status(500).json({ error: errorMessage });
  }
}
