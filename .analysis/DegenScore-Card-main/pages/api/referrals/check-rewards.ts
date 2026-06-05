import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { isValidSolanaAddress } from '../../../lib/validation';
import { rateLimit } from '../../../lib/rateLimit';
import { logger } from '../../../lib/logger';

/**
 * Referral reward tiers
 */
const REFERRAL_REWARDS = [
  {
    minReferrals: 3,
    badge: 'Influencer',
    badgeDescription: 'Brought 3 degens to the platform',
    proMonths: 1,
    sol: 0,
  },
  {
    minReferrals: 10,
    badge: 'Whale Hunter',
    badgeDescription: 'Recruited 10 degens successfully',
    proMonths: 0,
    sol: 0.1,
  },
  {
    minReferrals: 25,
    badge: 'Viral King',
    badgeDescription: 'Built an army of 25+ degens',
    proMonths: 3,
    sol: 0.3,
  },
  {
    minReferrals: 50,
    badge: 'Legend',
    badgeDescription: 'Achieved legendary status with 50+ referrals',
    proMonths: 0,
    sol: 1.0,
    vipLifetime: true,
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await rateLimit(req, res))) {
    return;
  }

  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Missing wallet address' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    logger.debug('Checking referral rewards for:', { walletAddress });

    // Count paid referrals
    const referralStats = await prisma.referral.aggregate({
      where: {
        referrerAddress: walletAddress,
        hasPaid: true,
      },
      _count: true,
    });

    const paidReferralsCount = referralStats._count;

    // Get all referrals for details
    const referrals = await prisma.referral.findMany({
      where: {
        referrerAddress: walletAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Determine which rewards are unlocked
    const unlockedRewards = REFERRAL_REWARDS.filter(
      (reward) => paidReferralsCount >= reward.minReferrals
    );

    // Check current user state
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
      include: {
        badges: true,
      },
    });

    const subscription = await prisma.subscription.findUnique({
      where: { walletAddress },
    });

    // Determine which rewards need to be claimed
    const claimableRewards = [];
    for (const reward of unlockedRewards) {
      // Check if badge already awarded
      const hasBadge = card?.badges.some((b) => b.name === reward.badge);

      if (!hasBadge) {
        claimableRewards.push(reward);
      }
    }

    // Calculate next milestone
    const nextReward = REFERRAL_REWARDS.find((reward) => paidReferralsCount < reward.minReferrals);

    const response = {
      totalReferrals: referrals.length,
      paidReferrals: paidReferralsCount,
      pendingReferrals: referrals.filter((r) => !r.hasPaid).length,
      unlockedRewards,
      claimableRewards,
      nextMilestone: nextReward
        ? {
            badge: nextReward.badge,
            requiredReferrals: nextReward.minReferrals,
            remaining: nextReward.minReferrals - paidReferralsCount,
            reward: {
              proMonths: nextReward.proMonths,
              sol: nextReward.sol,
              vipLifetime: nextReward.vipLifetime || false,
            },
          }
        : null,
      currentTier: subscription?.tier || 'FREE',
      hasClaimable: claimableRewards.length > 0,
    };

    res.status(200).json(response);
  } catch (error: any) {
    logger.error('Error checking referral rewards:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to check rewards',
    });
  }
}
