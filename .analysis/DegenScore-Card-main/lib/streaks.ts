import { prisma } from './prisma';
import { logger } from './logger';

/**
 * Daily Login Streak System
 * Tracks user login streaks and rewards
 */

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: Date;
  totalLogins: number;
  streakPoints: number;
  todayCheckedIn: boolean;
  nextReward?: {
    day: number;
    xp: number;
    badge?: string;
  };
}

// Streak rewards configuration
const STREAK_REWARDS = [
  { day: 1, xp: 10, message: '¡Primera visita del día!' },
  { day: 3, xp: 30, badge: 'consistent', message: '¡3 días consecutivos!' },
  { day: 7, xp: 100, badge: 'dedicated', message: '¡Una semana completa!' },
  { day: 14, xp: 250, badge: 'committed', message: '¡2 semanas seguidas!' },
  { day: 30, xp: 500, badge: 'legendary', message: '¡Degen Legendario!' },
  { day: 60, xp: 1000, badge: 'unstoppable', message: '¡Imparable!' },
  { day: 100, xp: 2000, badge: 'centurion', message: '¡100 días!' },
];

/**
 * Check user's daily login streak
 */
export async function checkDailyStreak(walletAddress: string): Promise<StreakInfo> {
  try {
    // Get or create user streak record
    let streak = await prisma.userStreak.findUnique({
      where: { walletAddress },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!streak) {
      // First time user - create streak
      streak = await prisma.userStreak.create({
        data: {
          walletAddress,
          currentStreak: 1,
          longestStreak: 1,
          lastLoginDate: today,
          totalLogins: 1,
          streakPoints: STREAK_REWARDS[0]?.xp || 10,
        },
      });

      logger.info('New streak started:', { walletAddress, streak: 1 });

      return {
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: today,
        totalLogins: 1,
        streakPoints: STREAK_REWARDS[0]?.xp || 10,
        todayCheckedIn: true,
        nextReward: STREAK_REWARDS[1],
      };
    }

    // Check if already checked in today
    const lastLogin = new Date(streak.lastLoginDate);
    const lastLoginDay = new Date(
      lastLogin.getFullYear(),
      lastLogin.getMonth(),
      lastLogin.getDate()
    );

    if (lastLoginDay.getTime() === today.getTime()) {
      // Already checked in today
      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastLoginDate: streak.lastLoginDate,
        totalLogins: streak.totalLogins,
        streakPoints: streak.streakPoints,
        todayCheckedIn: true,
        nextReward: getNextReward(streak.currentStreak),
      };
    }

    // Check if streak continues (last login was yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const streakContinues = lastLoginDay.getTime() === yesterday.getTime();

    if (streakContinues) {
      // Continue streak
      const newStreak = streak.currentStreak + 1;
      const reward = getStreakReward(newStreak);

      const updated = await prisma.userStreak.update({
        where: { walletAddress },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastLoginDate: today,
          totalLogins: streak.totalLogins + 1,
          streakPoints: streak.streakPoints + reward.xp,
        },
      });

      logger.info('Streak continued:', { walletAddress, newStreak, xpGained: reward.xp });

      // Award badge if applicable
      if (reward.badge) {
        await awardStreakBadge(walletAddress, reward.badge, newStreak);
      }

      return {
        currentStreak: updated.currentStreak,
        longestStreak: updated.longestStreak,
        lastLoginDate: updated.lastLoginDate,
        totalLogins: updated.totalLogins,
        streakPoints: updated.streakPoints,
        todayCheckedIn: true,
        nextReward: getNextReward(newStreak),
      };
    } else {
      // Streak broken - reset to 1
      const updated = await prisma.userStreak.update({
        where: { walletAddress },
        data: {
          currentStreak: 1,
          lastLoginDate: today,
          totalLogins: streak.totalLogins + 1,
          streakPoints: streak.streakPoints + (STREAK_REWARDS[0]?.xp || 10),
        },
      });

      logger.info('Streak broken - reset:', {
        walletAddress,
        previousStreak: streak.currentStreak,
      });

      return {
        currentStreak: 1,
        longestStreak: updated.longestStreak,
        lastLoginDate: updated.lastLoginDate,
        totalLogins: updated.totalLogins,
        streakPoints: updated.streakPoints,
        todayCheckedIn: true,
        nextReward: STREAK_REWARDS[1],
      };
    }
  } catch (error: any) {
    logger.error('Error checking daily streak:', error);
    throw error;
  }
}

/**
 * Get reward for a specific streak day
 */
function getStreakReward(day: number) {
  // Find the highest reward tier that applies
  const rewards = STREAK_REWARDS.filter((r) => r.day <= day).sort((a, b) => b.day - a.day);

  if (rewards.length > 0 && rewards[0] && rewards[0].day === day) {
    // Exact match - special reward
    return rewards[0];
  }

  // Regular day - give base XP
  return { day, xp: 10, message: 'Daily login!' };
}

/**
 * Get next reward milestone
 */
function getNextReward(currentStreak: number) {
  const next = STREAK_REWARDS.find((r) => r.day > currentStreak);
  return next;
}

/**
 * Award streak badge
 */
async function awardStreakBadge(walletAddress: string, badgeKey: string, streakDays: number) {
  try {
    // Check if badge already exists
    const existingBadge = await prisma.badge.findFirst({
      where: {
        card: {
          walletAddress,
        },
        name: { contains: badgeKey },
      },
    });

    if (existingBadge) {
      return; // Already has this badge
    }

    // Get user's card
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
    });

    if (!card) {
      return; // No card yet
    }

    // Award badge
    await prisma.badge.create({
      data: {
        cardId: card.id,
        name: `${streakDays} Day Streak`,
        description: `Maintained a ${streakDays} day login streak`,
        icon: '🔥',
        rarity: getBadgeRarity(streakDays),
      },
    });

    logger.info('Streak badge awarded:', { walletAddress, badgeKey, streakDays });
  } catch (error: any) {
    logger.error('Error awarding streak badge:', error);
  }
}

/**
 * Get badge rarity based on streak length
 */
function getBadgeRarity(days: number): string {
  if (days >= 100) {
    return 'Legendary';
  }
  if (days >= 60) {
    return 'Epic';
  }
  if (days >= 30) {
    return 'Rare';
  }
  if (days >= 7) {
    return 'Uncommon';
  }
  return 'Common';
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(limit: number = 100) {
  try {
    const topStreaks = await prisma.userStreak.findMany({
      where: {
        currentStreak: {
          gt: 0,
        },
      },
      orderBy: {
        currentStreak: 'desc',
      },
      take: limit,
    });

    return topStreaks;
  } catch (error: any) {
    logger.error('Error fetching streak leaderboard:', error);
    return [];
  }
}
