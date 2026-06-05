import { prisma } from './prisma';
import { logger } from './logger';

/**
 * Daily Challenges System
 * Provides daily missions for users to complete
 */

export interface Challenge {
  id: string;
  date: Date;
  challengeType: string;
  targetValue: number;
  rewardXP: number;
  rewardBadge: string | null;
  title: string;
  description: string;
  progress?: number;
  completed?: boolean;
}

// Challenge templates
const CHALLENGE_TEMPLATES = {
  trades: {
    type: 'trades',
    title: 'Haz {target} trades hoy',
    description: 'Completa {target} operaciones de trading',
    targetValue: 5,
    rewardXP: 50,
  },
  winRate: {
    type: 'winRate',
    title: 'Consigue {target}% win rate',
    description: 'Alcanza un win rate del {target}% o más',
    targetValue: 70,
    rewardXP: 100,
  },
  volume: {
    type: 'volume',
    title: 'Opera ${target} en volumen',
    description: 'Alcanza un volumen total de ${target}',
    targetValue: 100,
    rewardXP: 75,
  },
  follows: {
    type: 'follows',
    title: 'Sigue {target} wallets nuevas',
    description: 'Sigue {target} nuevas wallets de traders',
    targetValue: 3,
    rewardXP: 30,
  },
  share: {
    type: 'share',
    title: 'Comparte tu card',
    description: 'Comparte tu DegenScore card en redes sociales',
    targetValue: 1,
    rewardXP: 25,
  },
  compare: {
    type: 'compare',
    title: 'Compara {target} cards',
    description: 'Usa la función de comparación {target} veces',
    targetValue: 3,
    rewardXP: 20,
  },
  profileUpdate: {
    type: 'profileUpdate',
    title: 'Actualiza tu perfil',
    description: 'Personaliza tu perfil con nombre y bio',
    targetValue: 1,
    rewardXP: 15,
  },
};

/**
 * Get or create today's challenges
 */
export async function getDailyChallenges(walletAddress?: string): Promise<Challenge[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get challenges for today
    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        date: today,
      },
      ...(walletAddress && {
        include: {
          completions: {
            where: {
              walletAddress,
            },
          },
        },
      }),
    });

    // If no challenges exist for today, create them
    if (challenges.length === 0) {
      const created = await createDailyChallenges(today);
      // Return without completions since they're new
      return created.map((c) => ({
        id: c.id,
        date: c.date,
        challengeType: c.challengeType,
        targetValue: c.targetValue,
        rewardXP: c.rewardXP,
        rewardBadge: c.rewardBadge,
        title: c.title,
        description: c.description,
        progress: 0,
        completed: false,
      }));
    }

    // Format response
    return challenges.map((c: any) => ({
      id: c.id,
      date: c.date,
      challengeType: c.challengeType,
      targetValue: c.targetValue,
      rewardXP: c.rewardXP,
      rewardBadge: c.rewardBadge,
      title: c.title,
      description: c.description,
      progress: c.completions?.[0]?.progress ?? 0,
      completed: c.completions?.[0]?.completed ?? false,
    }));
  } catch (error: any) {
    logger.error('Error getting daily challenges:', error);
    throw error;
  }
}

/**
 * Create daily challenges for a specific date
 */
async function createDailyChallenges(date: Date) {
  try {
    // Select 3 random challenge types for today
    const types = Object.keys(CHALLENGE_TEMPLATES);
    const selectedTypes = shuffleArray(types).slice(0, 3);

    const challenges = selectedTypes.map((type) => {
      const template = CHALLENGE_TEMPLATES[type as keyof typeof CHALLENGE_TEMPLATES];
      return {
        date,
        challengeType: template.type,
        targetValue: template.targetValue,
        rewardXP: template.rewardXP,
        rewardBadge: null,
        title: template.title.replace('{target}', template.targetValue.toString()),
        description: template.description.replace('{target}', template.targetValue.toString()),
      };
    });

    // Create challenges in database
    const created = await Promise.all(
      challenges.map((c) =>
        prisma.dailyChallenge.create({
          data: c,
        })
      )
    );

    logger.info('Created daily challenges:', { date, count: created.length });

    return created;
  } catch (error: any) {
    logger.error('Error creating daily challenges:', error);
    throw error;
  }
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  walletAddress: string,
  challengeType: string,
  increment: number = 1
): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's challenge of this type
    const challenge = await prisma.dailyChallenge.findUnique({
      where: {
        date_challengeType: {
          date: today,
          challengeType,
        },
      },
    });

    if (!challenge) {
      return; // No challenge of this type today
    }

    // Get or create completion record
    let completion = await prisma.dailyChallengeCompletion.findUnique({
      where: {
        challengeId_walletAddress: {
          challengeId: challenge.id,
          walletAddress,
        },
      },
    });

    if (!completion) {
      completion = await prisma.dailyChallengeCompletion.create({
        data: {
          challengeId: challenge.id,
          walletAddress,
          progress: 0,
          completed: false,
        },
      });
    }

    // Update progress
    const newProgress = completion.progress + increment;
    const isCompleted = newProgress >= challenge.targetValue;

    await prisma.dailyChallengeCompletion.update({
      where: {
        id: completion.id,
      },
      data: {
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted && !completion.completed ? new Date() : completion.completedAt,
      },
    });

    // Award XP if just completed
    if (isCompleted && !completion.completed) {
      await awardChallengeReward(walletAddress, challenge.rewardXP);
      logger.info('Challenge completed:', {
        walletAddress,
        challengeType,
        xpAwarded: challenge.rewardXP,
      });
    }
  } catch (error: any) {
    logger.error('Error updating challenge progress:', error);
  }
}

/**
 * Award XP for completing a challenge
 */
async function awardChallengeReward(walletAddress: string, xp: number) {
  try {
    // Update user analytics
    await prisma.userAnalytics.upsert({
      where: { walletAddress },
      update: {
        totalXP: {
          increment: xp,
        },
        challengesCompleted: {
          increment: 1,
        },
      },
      create: {
        walletAddress,
        totalXP: xp,
        challengesCompleted: 1,
      },
    });

    // Calculate new level
    await updateUserLevel(walletAddress);
  } catch (error: any) {
    logger.error('Error awarding challenge reward:', error);
  }
}

/**
 * Update user level based on XP
 */
async function updateUserLevel(walletAddress: string) {
  try {
    const analytics = await prisma.userAnalytics.findUnique({
      where: { walletAddress },
    });

    if (!analytics) {
      return;
    }

    // Calculate level (simple formula: level = sqrt(XP / 100))
    const newLevel = Math.floor(Math.sqrt(analytics.totalXP / 100)) + 1;

    if (newLevel > analytics.level) {
      await prisma.userAnalytics.update({
        where: { walletAddress },
        data: { level: newLevel },
      });

      logger.info('User leveled up:', { walletAddress, newLevel });
    }
  } catch (error: any) {
    logger.error('Error updating user level:', error);
  }
}

/**
 * Shuffle array helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

/**
 * Get user's challenge completion stats
 */
export async function getUserChallengeStats(walletAddress: string) {
  try {
    const completions = await prisma.dailyChallengeCompletion.findMany({
      where: {
        walletAddress,
        completed: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCompletions = completions.filter((c) => {
      const completedDate = new Date(c.completedAt!);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });

    return {
      totalCompleted: completions.length,
      todayCompleted: todayCompletions.length,
      streakDays: await calculateChallengeStreak(walletAddress),
    };
  } catch (error: any) {
    logger.error('Error getting user challenge stats:', error);
    return {
      totalCompleted: 0,
      todayCompleted: 0,
      streakDays: 0,
    };
  }
}

/**
 * Calculate consecutive days with at least one challenge completed
 */
async function calculateChallengeStreak(walletAddress: string): Promise<number> {
  try {
    const completions = await prisma.dailyChallengeCompletion.findMany({
      where: {
        walletAddress,
        completed: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    if (completions.length === 0) {
      return 0;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = new Date(today);

    for (let i = 0; i < 365; i++) {
      // Max 365 day streak
      const dayCompletions = completions.filter((c) => {
        const completedDate = new Date(c.completedAt!);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === currentDay.getTime();
      });

      if (dayCompletions.length > 0) {
        streak++;
        currentDay.setDate(currentDay.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error: any) {
    logger.error('Error calculating challenge streak:', error);
    return 0;
  }
}
