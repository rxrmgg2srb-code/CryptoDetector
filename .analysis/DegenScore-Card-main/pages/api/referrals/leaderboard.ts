import type { NextApiRequest, NextApiResponse } from 'next';
import { getReferralLeaderboard } from '../../../lib/referralEngine';
import { logger } from '@/lib/logger';

interface LeaderboardStats {
  totalReferrers: number;
  totalPaidReferrals: number;
  totalEarnings: number;
  avgReferrals: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      limit = '100',
      timeFilter = 'all',
      walletAddress,
    } = req.query;

    const leaderboard = await getReferralLeaderboard(parseInt(limit as string));

    // Calculate stats
    const stats: LeaderboardStats = {
      totalReferrers: leaderboard.length,
      totalPaidReferrals: leaderboard.reduce((sum: number, r: any) => sum + (r.paidReferrals || r.totalReferrals || 0), 0),
      totalEarnings: leaderboard.reduce((sum: number, r: any) => sum + (r.totalEarnings || 0), 0),
      avgReferrals: 0,
    };
    stats.avgReferrals = stats.totalReferrers > 0
      ? stats.totalPaidReferrals / stats.totalReferrers
      : 0;

    // Find user's position if wallet provided
    let userPosition = null;
    if (walletAddress) {
      const walletStr = walletAddress as string;
      const userIdx = leaderboard.findIndex((r: any) =>
        r.walletAddress && (
          r.walletAddress === walletStr ||
          r.walletAddress.toLowerCase().includes(walletStr.substring(0, 4).toLowerCase())
        )
      );
      if (userIdx >= 0) {
        userPosition = {
          ...leaderboard[userIdx],
          rank: userIdx + 1,
        };
      }
    }

    res.status(200).json({
      success: true,
      leaderboard: leaderboard.map((r: any, index: number) => ({
        ...r,
        rank: index + 1,
        tier: calculateTier(r.paidReferrals || r.totalReferrals || 0),
        badges: calculateBadges(r),
      })),
      stats,
      userPosition,
      timestamp: Date.now(),
      timeFilter,
    });
  } catch (error) {
    logger.error(
      'Error getting referral leaderboard:',
      error instanceof Error ? error : undefined,
      {
        error: String(error),
      }
    );
    res.status(500).json({
      error: 'Failed to get leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Tier calculation
function calculateTier(paidReferrals: number): string {
  if (paidReferrals >= 50) return 'diamond';
  if (paidReferrals >= 25) return 'platinum';
  if (paidReferrals >= 10) return 'gold';
  if (paidReferrals >= 5) return 'silver';
  return 'bronze';
}

// Badge calculation
function calculateBadges(referrer: any): string[] {
  const badges: string[] = [];
  const paidReferrals = referrer.paidReferrals || referrer.totalReferrals || 0;
  const earnings = referrer.totalEarnings || 0;

  if (paidReferrals >= 50) badges.push('👑');
  if (paidReferrals >= 25) badges.push('💎');
  if (earnings >= 5) badges.push('🔥');
  if (paidReferrals >= 100) badges.push('🐋');

  return badges;
}
