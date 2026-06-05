import type { NextApiRequest, NextApiResponse } from 'next';
import { getCacheStats, getTrendingWallets } from '../../../lib/cache/hotWalletCache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = getCacheStats();
    const trending = await getTrendingWallets(20);

    const hitRateFormatted = stats.hitRate.toFixed(2) + '%';
    const estimatedSavings = Math.floor(stats.hits * 3) + 's total';

    res.status(200).json({
      success: true,
      cache: {
        stats: {
          hits: stats.hits,
          misses: stats.misses,
          totalRequests: stats.totalRequests,
          hitRate: hitRateFormatted,
        },
        trending,
        performance: {
          avgCacheHitTime: '< 1ms',
          avgCacheMissTime: '~2-5s',
          estimatedSavings,
        },
      },
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      error: 'Failed to get cache statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
