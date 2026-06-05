import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { rateLimit } from '../../lib/rateLimitRedis';
import { logger } from '@/lib/logger';

/**
 * Scarcity settings
 */
const TOTAL_PREMIUM_SLOTS = 500; // Artificial scarcity cap
const PRICE_TIERS = [
  { maxUsers: 100, price: 0.15 }, // Early bird
  { maxUsers: 200, price: 0.2 }, // Standard (current)
  { maxUsers: 350, price: 0.25 }, // Phase 2
  { maxUsers: 500, price: 0.3 }, // Final tier
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await rateLimit(req, res))) {
    return;
  }

  try {
    // Count premium users
    const premiumCount = await prisma.subscription.count({
      where: {
        tier: {
          in: ['PREMIUM', 'PRO'],
        },
      },
    });

    const spotsRemaining = Math.max(0, TOTAL_PREMIUM_SLOTS - premiumCount);

    // Determine current price tier
    const currentTier =
      PRICE_TIERS.find((tier) => premiumCount < tier.maxUsers) ||
      PRICE_TIERS[PRICE_TIERS.length - 1]!;
    const nextTier = PRICE_TIERS.find(
      (tier) => premiumCount < tier.maxUsers && tier.maxUsers > currentTier.maxUsers
    );

    // Calculate percentage filled
    const percentFilled = Math.round((premiumCount / TOTAL_PREMIUM_SLOTS) * 100);

    res.status(200).json({
      success: true,
      totalSlots: TOTAL_PREMIUM_SLOTS,
      premiumUsers: premiumCount,
      spotsRemaining,
      percentFilled,
      currentPrice: currentTier.price,
      nextPrice: nextTier?.price || currentTier.price,
      usersUntilPriceIncrease: nextTier ? nextTier.maxUsers - premiumCount : 0,
      isSoldOut: spotsRemaining === 0,
      showScarcityBanner: spotsRemaining < 100, // Show when under 100 spots
    });
  } catch (error: any) {
    logger.error('Error fetching spots remaining:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch data',
    });
  }
}
