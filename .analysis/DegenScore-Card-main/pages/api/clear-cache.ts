import type { NextApiRequest, NextApiResponse } from 'next';
import { cacheDel, CacheKeys } from '../../lib/cache/redis';
import { logger } from '../../lib/logger';
import { isValidSolanaAddress } from '../../lib/validation';

/**
 * API endpoint to manually clear cached card image
 * Usage: POST /api/clear-cache with { walletAddress: "xxx" }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    logger.info('🗑️ Clearing cache for wallet:', { walletAddress });

    // Clear card image cache
    const cardImageKey = CacheKeys.cardImage(walletAddress);
    await cacheDel(cardImageKey);

    // Clear user card cache
    const userCardKey = CacheKeys.userCard(walletAddress);
    await cacheDel(userCardKey);

    // Clear wallet analysis cache
    const analysisKey = CacheKeys.walletAnalysis(walletAddress);
    await cacheDel(analysisKey);

    logger.info('✅ Cache cleared for wallet');

    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully',
      clearedKeys: [cardImageKey, userCardKey, analysisKey],
    });
  } catch (error) {
    logger.error('Error clearing cache:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    res.status(500).json({
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
