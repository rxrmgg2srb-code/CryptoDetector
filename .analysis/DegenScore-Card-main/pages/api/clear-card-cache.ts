import type { NextApiRequest, NextApiResponse } from 'next';
import { cacheDel, CacheKeys } from '../../lib/cache/redis';
import { isValidSolanaAddress } from '../../lib/validation';
import { logger } from '@/lib/logger';
import { prisma } from '../../lib/prisma';

/**
 * Clear card image cache
 * GET: Clears cache for ALL wallets in database
 * POST: Clears cache for specific wallet (requires walletAddress in body)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: Clear ALL card caches
    if (req.method === 'GET') {
      logger.info('🗑️ Clearing cache for ALL wallets...');

      // Get all wallets from database
      const allCards = await prisma.degenCard.findMany({
        select: { walletAddress: true },
      });

      // Clear cache for each wallet
      let clearedCount = 0;
      for (const card of allCards) {
        const cacheKey = CacheKeys.cardImage(card.walletAddress);
        await cacheDel(cacheKey);
        clearedCount++;
      }

      logger.info(`✅ Cleared cache for ${clearedCount} wallets`);

      return res.status(200).json({
        success: true,
        message: `Cache cleared for ${clearedCount} wallets. All cards will be regenerated on next request.`,
        clearedCount,
        method: 'GET',
      });
    }

    // POST: Clear cache for specific wallet
    if (req.method === 'POST') {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }

      if (!isValidSolanaAddress(walletAddress)) {
        return res.status(400).json({ error: 'Invalid Solana wallet address' });
      }

      // Clear card image cache
      const cacheKey = CacheKeys.cardImage(walletAddress);
      await cacheDel(cacheKey);

      logger.info(`🗑️ Cache cleared for wallet: ${walletAddress}`);

      return res.status(200).json({
        success: true,
        message: 'Card cache cleared successfully. The card will be regenerated on next request.',
        walletAddress,
        method: 'POST',
      });
    }

    // Other methods not allowed
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST' });
  } catch (error) {
    logger.error('Error clearing cache:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    return res.status(500).json({
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
