import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { isValidSolanaAddress } from '../../lib/validation';
import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '../../lib/rateLimitPersistent';
import { logger } from '../../lib/logger';

/**
 * XP rewards for daily check-ins
 */
const DAILY_XP_BASE = 50;
const STREAK_BONUS_PER_DAY = 10; // Extra XP per consecutive day

/**
 * Streak milestones with rewards
 */
const STREAK_MILESTONES = [
  { days: 3, badge: 'Consistent Degen', badgeIcon: '🔥', badgeRarity: 'COMMON', xp: 100 },
  { days: 7, badge: 'Weekly Warrior', badgeIcon: '⚔️', badgeRarity: 'RARE', xp: 300 },
  { days: 14, badge: 'Fortnight Fighter', badgeIcon: '🛡️', badgeRarity: 'RARE', xp: 500 },
  { days: 30, badge: 'Diamond Hands', badgeIcon: '💎', badgeRarity: 'EPIC', xp: 1000 },
  { days: 60, badge: 'Veteran Trader', badgeIcon: '🎖️', badgeRarity: 'EPIC', xp: 2000 },
  { days: 90, badge: 'Legendary Streak', badgeIcon: '👑', badgeRarity: 'LEGENDARY', xp: 5000 },
  { days: 180, badge: 'Immortal', badgeIcon: '⭐', badgeRarity: 'MYTHIC', xp: 10000 },
];

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

function isConsecutiveDay(lastCheckIn: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return isSameDay(lastCheckIn, yesterday);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Lenient rate limiting for check-ins
  if (!(await rateLimitMiddleware(req, res, RATE_LIMIT_PRESETS.LENIENT))) {
    return;
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.degenCard.findUnique({
        where: { walletAddress },
        include: { badges: true },
      });

      if (!card) {
        throw new Error('Card not found. Generate your metrics first.');
      }

      // Check if already checked in today
      if (card.lastCheckIn && isSameDay(card.lastCheckIn, now)) {
        return {
          alreadyCheckedIn: true,
          currentStreak: card.streakDays,
          totalXP: card.totalXP,
          message: 'Already checked in today! Come back tomorrow.',
        };
      }

      // Calculate new streak
      let newStreak: number;
      if (!card.lastCheckIn) {
        // First check-in ever
        newStreak = 1;
      } else if (isConsecutiveDay(card.lastCheckIn, now)) {
        // Consecutive day
        newStreak = card.streakDays + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      // Calculate XP reward
      const streakBonus = Math.min(newStreak * STREAK_BONUS_PER_DAY, 500); // Cap at 500
      const xpEarned = DAILY_XP_BASE + streakBonus;

      // Check for milestone badges
      const milestonesReached = STREAK_MILESTONES.filter((m) => newStreak === m.days);

      let bonusXP = 0;
      const badgesEarned = [];

      for (const milestone of milestonesReached) {
        // Check if badge already exists
        const hasBadge = card.badges.some((b) => b.name === milestone.badge);

        if (!hasBadge) {
          await tx.badge.create({
            data: {
              cardId: card.id,
              name: milestone.badge,
              description: `Achieved ${milestone.days}-day check-in streak`,
              icon: milestone.badgeIcon,
              rarity: milestone.badgeRarity,
            },
          });

          badgesEarned.push({
            name: milestone.badge,
            icon: milestone.badgeIcon,
            xp: milestone.xp,
          });

          bonusXP += milestone.xp;
        }
      }

      const totalXpEarned = xpEarned + bonusXP;

      // Update card
      const updatedCard = await tx.degenCard.update({
        where: { walletAddress },
        data: {
          lastCheckIn: now,
          streakDays: newStreak,
          totalXP: { increment: totalXpEarned },
          longestStreak: Math.max(card.longestStreak, newStreak),
          lastSeen: now,
        },
      });

      logger.info('Daily check-in completed:', {
        walletAddress,
        streak: newStreak,
        xpEarned: totalXpEarned,
      });

      return {
        alreadyCheckedIn: false,
        currentStreak: newStreak,
        totalXP: updatedCard.totalXP,
        xpEarned: totalXpEarned,
        baseXP: DAILY_XP_BASE,
        streakBonus,
        bonusXP,
        badgesEarned,
        streakBroken: card.lastCheckIn && !isConsecutiveDay(card.lastCheckIn, now),
        nextMilestone: STREAK_MILESTONES.find((m) => m.days > newStreak),
      };
    });

    // Log activity (OUTSIDE transaction - non-critical)
    if (!result.alreadyCheckedIn) {
      try {
        await prisma.activityLog.create({
          data: {
            walletAddress,
            action: 'checkin',
            metadata: {
              streak: result.currentStreak,
              xpEarned: result.xpEarned,
              badgesEarned: result.badgesEarned?.map((b) => b.name) || [],
            },
          },
        });
      } catch (activityError) {
        // If ActivityLog table doesn't exist or fails, just log the error but don't fail the request
        logger.warn('⚠️ Failed to log check-in activity (non-critical)', {
          error: activityError instanceof Error ? activityError.message : String(activityError),
        });
      }
    }

    if (result.alreadyCheckedIn) {
      return res.status(200).json({
        success: true,
        ...result,
      });
    }

    res.status(200).json({
      success: true,
      message: result.streakBroken
        ? `Streak broken! Starting fresh with ${result.xpEarned} XP`
        : `${result.currentStreak}-day streak! Earned ${result.xpEarned} XP`,
      ...result,
    });
  } catch (error: any) {
    logger.error('Error processing check-in:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to process check-in',
    });
  }
}
