import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  notifyWallet,
  notifyFollowersOfTrade,
  notifyMilestone,
  notifyNewFollower,
} from '@/lib/notifications';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    notificationPreferences: {
      findUnique: jest.fn(),
    },
    userFollows: {
      findMany: jest.fn(),
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
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

global.fetch = jest.fn();

describe('notifications (comprehensive)', () => {
  const mockWalletAddress = 'So11111111111111111111111111111111111111112';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
  });

  describe('notifyWallet', () => {
    it('should skip if no preferences found', async () => {
      const { prisma } = require('@/lib/prisma');
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      await notifyWallet(mockWalletAddress, {
        title: 'Test',
        message: 'Test message',
        type: 'trade',
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should send Discord notification if enabled', async () => {
      const { prisma } = require('@/lib/prisma');
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        walletAddress: mockWalletAddress,
        discordEnabled: true,
        discordWebhook: 'https://discord.com/webhook/test',
        telegramEnabled: false,
        emailEnabled: false,
        followedTrades: true,
        milestones: true,
        challenges: true,
      });

      await notifyWallet(mockWalletAddress, {
        title: 'Trade Alert',
        message: 'New trade detected',
        type: 'trade',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://discord.com/webhook/test',
        expect.objectContaining({
          method: 'POST',
          discordWebhook: 'https://discord.com/webhook/test',
          followedTrades: false, // Disabled
          milestones: true,
        })
      );

      await notifyWallet(mockWalletAddress, {
        title: 'Trade',
        message: 'Trade happened',
        type: 'trade',
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('notifyFollowersOfTrade', () => {
    it('should notify all followers of a trade', async () => {
      const { prisma } = require('@/lib/prisma');

      (prisma.userFollows.findMany as jest.Mock).mockResolvedValue([
        { follower: 'follower1' },
        { follower: 'follower2' },
      ]);

      (prisma.degenCard.findUnique as jest.Mock).mockResolvedValue({
        displayName: 'Whale Trader',
        degenScore: 95,
      });

      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        discordEnabled: true,
        discordWebhook: 'https://discord.com/webhook/test',
        followedTrades: true,
      });

      await notifyFollowersOfTrade(mockWalletAddress, {
        tokenSymbol: 'BONK',
        type: 'buy',
        solAmount: 100,
        profitLoss: 50,
      });

      expect(prisma.userFollows.findMany).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle no followers gracefully', async () => {
      const { prisma } = require('@/lib/prisma');
      (prisma.userFollows.findMany as jest.Mock).mockResolvedValue([]);

      await notifyFollowersOfTrade(mockWalletAddress, {
        tokenSymbol: 'SOL',
        type: 'sell',
        solAmount: 10,
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('notifyMilestone', () => {
    it('should send milestone notification', async () => {
      const { prisma } = require('@/lib/prisma');
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        discordEnabled: true,
        discordWebhook: 'https://discord.com/webhook/test',
        milestones: true,
      });

      await notifyMilestone(mockWalletAddress, {
        title: '100 Trades',
        description: 'You completed 100 trades!',
        badgeName: 'Veteran Trader',
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('notifyNewFollower', () => {
    it('should notify of new follower', async () => {
      const { prisma } = require('@/lib/prisma');
      const followerAddress = 'follower123';

      (prisma.degenCard.findUnique as jest.Mock).mockResolvedValue({
        displayName: 'New Follower',
        degenScore: 75,
      });

      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        discordEnabled: true,
        discordWebhook: 'https://discord.com/webhook/test',
      });

      await notifyNewFollower(mockWalletAddress, followerAddress);

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
