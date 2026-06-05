import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { logger } from '@/lib/logger';

const MAX_PREMIUM_SLOTS = parseInt(process.env.NEXT_PUBLIC_MAX_PREMIUM_SLOTS || '1000');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Count how many premium slots have been taken
    const premiumCount = await prisma.degenCard.count({
      where: {
        isPaid: true,
      },
    });

    const remaining = Math.max(0, MAX_PREMIUM_SLOTS - premiumCount);

    res.status(200).json({
      success: true,
      total: MAX_PREMIUM_SLOTS,
      taken: premiumCount,
      remaining,
      percentageFilled: (premiumCount / MAX_PREMIUM_SLOTS) * 100,
    });
  } catch (error) {
    logger.error('Error getting slot count:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to get slot count',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
