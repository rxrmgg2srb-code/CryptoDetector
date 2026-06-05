import {
  getDailyChallenges,
  updateChallengeProgress,
  getUserChallengeStats,
} from '@/lib/challenges';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    dailyChallenge: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    dailyChallengeCompletion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userAnalytics: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger');

describe('challenges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyChallenges', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mockChallenges = [
      {
        id: '1',
        date: today,
        challengeType: 'trades',
        targetValue: 5,
        rewardXP: 50,
        rewardBadge: null,
        title: 'Haz 5 trades hoy',
        description: 'Completa 5 operaciones de trading',
        completions: [],
      },
      {
        id: '2',
        date: today,
        challengeType: 'winRate',
        targetValue: 70,
        rewardXP: 100,
        rewardBadge: null,
        title: 'Consigue 70% win rate',
        description: 'Alcanza un win rate del 70% o más',
        completions: [],
      },
    ];

    it('should return existing challenges for today', async () => {
      (prisma.dailyChallenge.findMany as jest.Mock).mockResolvedValue(mockChallenges);

      const result = await getDailyChallenges();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].challengeType).toBe('trades');
      expect(result[0].completed).toBe(false);
    });

    it('should include user progress when wallet provided', async () => {
      const challengesWithCompletion = mockChallenges.map((c, i) => ({
        ...c,
        completions: i === 0 ? [{ progress: 3, completed: false }] : [],
      }));

      (prisma.dailyChallenge.findMany as jest.Mock).mockResolvedValue(challengesWithCompletion);

      const result = await getDailyChallenges('test-wallet');

      expect(result[0].progress).toBe(3);
      expect(result[0].completed).toBe(false);
      expect(result[1].progress).toBe(0);
    });

    it('should create new challenges if none exist', async () => {
      (prisma.dailyChallenge.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dailyChallenge.create as jest.Mock).mockImplementation((args) => ({
        id: 'new-id',
        ...args.data,
      }));

      const result = await getDailyChallenges();

      expect(result).toHaveLength(3); // Creates 3 random challenges
      expect(prisma.dailyChallenge.create).toHaveBeenCalledTimes(3);
    });

    it('should handle errors gracefully', async () => {
      (prisma.dailyChallenge.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(getDailyChallenges()).rejects.toThrow('DB error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateChallengeProgress', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mockChallenge = {
      id: 'challenge-1',
      date: today,
      challengeType: 'trades',
      targetValue: 5,
      rewardXP: 50,
    };

    it('should update progress correctly', async () => {
      (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prisma.dailyChallengeCompletion.findUnique as jest.Mock).mockResolvedValue({
        id: 'completion-1',
        challengeId: 'challenge-1',
        walletAddress: 'test-wallet',
        progress: 2,
        completed: false,
      });
      (prisma.dailyChallengeCompletion.update as jest.Mock).mockResolvedValue({});

      await updateChallengeProgress('test-wallet', 'trades', 1);

      expect(prisma.dailyChallengeCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-1' },
        data: expect.objectContaining({
          progress: 3,
          completed: false,
        }),
      });
    });

    it('should create completion if not exists', async () => {
      (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prisma.dailyChallengeCompletion.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.dailyChallengeCompletion.create as jest.Mock).mockResolvedValue({
        id: 'new-completion',
        progress: 0,
        completed: false,
      });
      (prisma.dailyChallengeCompletion.update as jest.Mock).mockResolvedValue({});

      await updateChallengeProgress('test-wallet', 'trades', 1);

      expect(prisma.dailyChallengeCompletion.create).toHaveBeenCalled();
      expect(prisma.dailyChallengeCompletion.update).toHaveBeenCalled();
    });

    it('should mark as completed when target reached', async () => {
      (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue(mockChallenge);
      (prisma.dailyChallengeCompletion.findUnique as jest.Mock).mockResolvedValue({
        id: 'completion-1',
        progress: 4,
        completed: false,
      });
      (prisma.dailyChallengeCompletion.update as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({
        walletAddress: 'test-wallet',
        totalXP: 50,
        level: 1,
      });

      await updateChallengeProgress('test-wallet', 'trades', 1);

      expect(prisma.dailyChallengeCompletion.update).toHaveBeenCalledWith({
        where: { id: 'completion-1' },
        data: expect.objectContaining({
          progress: 5,
          completed: true,
          completedAt: expect.any(Date),
        }),
      });
      expect(prisma.userAnalytics.upsert).toHaveBeenCalled();
    });

    it('should return early if no challenge of type exists', async () => {
      (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue(null);

      await updateChallengeProgress('test-wallet', 'nonexistent', 1);

      expect(prisma.dailyChallengeCompletion.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('getUserChallengeStats', () => {
    it('should return correct stats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completions = [
        { id: '1', completedAt: today, completed: true },
        { id: '2', completedAt: new Date(today.getTime() - 86400000), completed: true },
        { id: '3', completedAt: new Date(today.getTime() - 172800000), completed: true },
      ];

      (prisma.dailyChallengeCompletion.findMany as jest.Mock).mockResolvedValue(completions);

      const stats = await getUserChallengeStats('test-wallet');

      expect(stats.totalCompleted).toBe(3);
      expect(stats.todayCompleted).toBe(1);
    });

    it('should handle no completions', async () => {
      (prisma.dailyChallengeCompletion.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await getUserChallengeStats('test-wallet');

      expect(stats.totalCompleted).toBe(0);
      expect(stats.todayCompleted).toBe(0);
      expect(stats.streakDays).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      (prisma.dailyChallengeCompletion.findMany as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const stats = await getUserChallengeStats('test-wallet');

      expect(stats).toEqual({
        totalCompleted: 0,
        todayCompleted: 0,
        streakDays: 0,
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Level System', () => {
    it('should level up when enough XP', async () => {
      const completion = {
        id: '1',
        progress: 4,
        completed: false,
      };

      (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        targetValue: 5,
        rewardXP: 100,
      });
      (prisma.dailyChallengeCompletion.findUnique as jest.Mock).mockResolvedValue(completion);
      (prisma.dailyChallengeCompletion.update as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({
        totalXP: 150,
        level: 1,
        challengesCompleted: 1,
      });
      (prisma.userAnalytics.update as jest.Mock).mockResolvedValue({});

      await updateChallengeProgress('test-wallet', 'trades', 1);

      // Level formula: sqrt(XP / 100) + 1
      // 250 XP = sqrt(250/100) + 1 = ~2.58 = level 2
      expect(prisma.userAnalytics.update).toHaveBeenCalled();
    });
  });

  describe('Challenge Types', () => {
    it('should handle different challenge types', async () => {
      const types = ['trades', 'winRate', 'volume', 'follows', 'share', 'compare', 'profileUpdate'];

      for (const type of types) {
        (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue({
          id: `challenge-${type}`,
          challengeType: type,
          targetValue: 1,
          rewardXP: 10,
        });
        (prisma.dailyChallengeCompletion.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.dailyChallengeCompletion.create as jest.Mock).mockResolvedValue({
          id: `completion-${type}`,
          progress: 0,
        });
        (prisma.dailyChallengeCompletion.update as jest.Mock).mockResolvedValue({});
        (prisma.userAnalytics.upsert as jest.Mock).mockResolvedValue({});
        (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({
          totalXP: 10,
          level: 1,
        });

        await updateChallengeProgress('test-wallet', type, 1);

        expect(prisma.dailyChallengeCompletion.update).toHaveBeenCalled();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle progress exceeding target', async () => {
      (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        targetValue: 5,
        rewardXP: 50,
      });
      (prisma.dailyChallengeCompletion.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        progress: 3,
        completed: false,
      });
      (prisma.dailyChallengeCompletion.update as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({
        totalXP: 50,
        level: 1,
      });

      await updateChallengeProgress('test-wallet', 'trades', 10); // Way over target

      expect(prisma.dailyChallengeCompletion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          progress: 13,
          completed: true,
        }),
      });
    });

    it('should not award XP twice for same challenge', async () => {
      (prisma.dailyChallenge.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        targetValue: 5,
        rewardXP: 50,
      });
      (prisma.dailyChallengeCompletion.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        progress: 5,
        completed: true, // Already completed
        completedAt: new Date(),
      });
      (prisma.dailyChallengeCompletion.update as jest.Mock).mockResolvedValue({});

      await updateChallengeProgress('test-wallet', 'trades', 1);

      expect(prisma.userAnalytics.upsert).not.toHaveBeenCalled();
    });
  });
});
