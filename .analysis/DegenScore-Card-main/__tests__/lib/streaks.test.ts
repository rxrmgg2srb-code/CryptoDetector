import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { checkDailyStreak, getStreakLeaderboard } from '@/lib/streaks';

// Mock Prisma inline
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userStreak: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    badge: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    degenCard: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('streaks (comprehensive)', () => {
  const mockWalletAddress = 'So11111111111111111111111111111111111111112';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDailyStreak', () => {
    it('should create new streak for first-time user', async () => {
      const { prisma } = require('@/lib/prisma');

      (prisma.userStreak.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userStreak.create as jest.Mock).mockResolvedValue({
        walletAddress: mockWalletAddress,
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: new Date(),
        totalLogins: 1,
        streakPoints: 10,
      });

      const result = await checkDailyStreak(mockWalletAddress);

      expect(result).toBeDefined();
      expect(result.currentStreak).toBe(1);
      expect(result.todayCheckedIn).toBe(true);
      expect(prisma.userStreak.create).toHaveBeenCalled();
    });

    it('should return existing streak if already checked in today', async () => {
      const { prisma } = require('@/lib/prisma');
      const today = new Date();

      (prisma.userStreak.findUnique as jest.Mock).mockResolvedValue({
        walletAddress: mockWalletAddress,
        currentStreak: 5,
        longestStreak: 10,
        lastLoginDate: today,
        totalLogins: 20,
        streakPoints: 150,
      });

      const result = await checkDailyStreak(mockWalletAddress);

      expect(result.currentStreak).toBe(5);
      expect(result.todayCheckedIn).toBe(true);
      expect(prisma.userStreak.update).not.toHaveBeenCalled();
    });

    it('should continue streak from yesterday', async () => {
      const { prisma } = require('@/lib/prisma');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      (prisma.userStreak.findUnique as jest.Mock).mockResolvedValue({
        walletAddress: mockWalletAddress,
        currentStreak: 6,
        longestStreak: 10,
        lastLoginDate: yesterday,
        totalLogins: 20,
        streakPoints: 150,
      });

      (prisma.userStreak.update as jest.Mock).mockResolvedValue({
        walletAddress: mockWalletAddress,
        currentStreak: 7,
        longestStreak: 10,
        lastLoginDate: new Date(),
        totalLogins: 21,
        streakPoints: 260,
      });

      (prisma.degenCard.findUnique as jest.Mock).mockResolvedValue({ id: 'card123' });
      (prisma.badge.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await checkDailyStreak(mockWalletAddress);

      expect(result.currentStreak).toBe(7);
      expect(prisma.userStreak.update).toHaveBeenCalled();
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return streak leaderboard', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockLeaderboard = [
        { walletAddress: 'whale1', currentStreak: 100 },
        { walletAddress: 'whale2', currentStreak: 75 },
      ];

      (prisma.userStreak.findMany as jest.Mock).mockResolvedValue(mockLeaderboard);

      const result = await getStreakLeaderboard(10);

      expect(result).toHaveLength(2);
      expect(prisma.userStreak.findMany).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { prisma } = require('@/lib/prisma');
      (prisma.userStreak.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await getStreakLeaderboard();

      expect(result).toEqual([]);
    });
  });
});
