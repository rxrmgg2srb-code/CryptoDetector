import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  calculateWhaleMetrics,
  isWhale,
  detectAndRegisterWhale,
  updateWhaleMetrics,
  createWhaleAlert,
  getTopWhales,
  followWhale,
  unfollowWhale,
  isFollowingWhale,
  processTradeForWhaleDetection,
  getWhaleAlertsForUser,
  getFollowedWhales,
} from '@/lib/whaleTracker';

// Mock Prisma inline
jest.mock('@/lib/prisma', () => ({
  prisma: {
    degenCard: {
      findUnique: jest.fn(),
    },
    hotTrade: {
      findMany: jest.fn(),
    },
    whaleWallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    whaleAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    whaleFollower: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// Access mocked prisma
import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as any;

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Whale Tracker System 🐋', () => {
  const mockWalletAddress = 'So11111111111111111111111111111111111111112';
  const mockWhaleAddress = 'Whale11111111111111111111111111111111111111';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateWhaleMetrics', () => {
    it('should return null if card not found or insufficient trades', async () => {
      mockPrisma.degenCard.findUnique.mockResolvedValue({ totalTrades: 5 }); // < 10 min trades
      const result = await calculateWhaleMetrics(mockWalletAddress);
      expect(result).toBeNull();
    });

    it('should calculate metrics correctly for a whale', async () => {
      mockPrisma.degenCard.findUnique.mockResolvedValue({
        totalTrades: 100,
        totalVolume: 5000,
        winRate: 60,
        avgTradeSize: 100,
        profitLoss: 2000,
      });

      mockPrisma.hotTrade.findMany.mockResolvedValue([
        { tokenSymbol: 'BONK' },
        { tokenSymbol: 'BONK' },
        { tokenSymbol: 'SOL' },
      ]);

      const result = await calculateWhaleMetrics(mockWalletAddress);

      expect(result).not.toBeNull();
      expect(result?.totalVolume).toBe(5000);
      expect(result?.topTokens).toContain('BONK');
      expect(result?.topTokens[0]).toBe('BONK'); // Most frequent
    });
  });

  describe('isWhale', () => {
    it('should identify a whale correctly based on thresholds', () => {
      const whaleMetrics = {
        totalVolume: 2000, // > 1000
        winRate: 60, // > 55
        avgPositionSize: 100, // > 50
        totalProfit: 500,
        topTokens: [],
      };
      expect(isWhale(whaleMetrics)).toBe(true);
    });

    it('should reject non-whales', () => {
      const shrimpMetrics = {
        totalVolume: 100,
        winRate: 40,
        avgPositionSize: 10,
        totalProfit: 5,
        topTokens: [],
      };
      expect(isWhale(shrimpMetrics)).toBe(false);
    });
  });

  describe('detectAndRegisterWhale', () => {
    it('should register a new whale', async () => {
      // 1. Not existing
      mockPrisma.whaleWallet.findUnique.mockResolvedValue(null);

      // 2. Card exists and qualifies
      mockPrisma.degenCard.findUnique.mockResolvedValue({
        totalTrades: 50,
        totalVolume: 1500,
        winRate: 60,
        avgTradeSize: 100,
        profitLoss: 500,
      });

      // 3. Hot trades
      mockPrisma.hotTrade.findMany.mockResolvedValue([]);

      const result = await detectAndRegisterWhale(mockWalletAddress);

      expect(result).toBe(true);
      expect(mockPrisma.whaleWallet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tier: 'megawhale', // > 1000 volume
            walletAddress: mockWalletAddress,
          }),
        })
      );
    });

    it('should skip if already registered', async () => {
      mockPrisma.whaleWallet.findUnique.mockResolvedValue({ id: 'whale1' });
      const result = await detectAndRegisterWhale(mockWalletAddress);
      expect(result).toBe(false);
      expect(mockPrisma.whaleWallet.create).not.toHaveBeenCalled();
    });
  });

  describe('processTradeForWhaleDetection', () => {
    it('should create alert for large whale trade', async () => {
      // Wallet is a whale
      mockPrisma.whaleWallet.findUnique.mockResolvedValue({ id: 'whale123' });

      await processTradeForWhaleDetection(mockWalletAddress, {
        type: 'buy',
        tokenMint: 'mint123',
        tokenSymbol: 'BONK',
        solAmount: 1000, // Large amount
        signature: 'sig123',
      });

      expect(mockPrisma.whaleAlert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            alertType: 'large_buy',
            amount: 1000,
            tokenSymbol: 'BONK',
          }),
        })
      );

      // Should also update metrics
      expect(mockPrisma.degenCard.findUnique).toHaveBeenCalled();
    });

    it('should ignore small trades', async () => {
      mockPrisma.whaleWallet.findUnique.mockResolvedValue({ id: 'whale123' });

      await processTradeForWhaleDetection(mockWalletAddress, {
        type: 'buy',
        tokenMint: 'mint123',
        tokenSymbol: 'BONK',
        solAmount: 1, // Small amount
        signature: 'sig123',
      });

      expect(mockPrisma.whaleAlert.create).not.toHaveBeenCalled();
    });
  });

  describe('Whale Following', () => {
    it('should follow a whale', async () => {
      mockPrisma.whaleWallet.findUnique.mockResolvedValue({ id: 'whale1' });
      mockPrisma.whaleFollower.create.mockResolvedValue({});

      const result = await followWhale(mockWalletAddress, mockWhaleAddress);
      expect(result).toBe(true);
    });

    it('should unfollow a whale', async () => {
      mockPrisma.whaleFollower.deleteMany.mockResolvedValue({ count: 1 });
      const result = await unfollowWhale(mockWalletAddress, mockWhaleAddress);
      expect(result).toBe(true);
    });

    it('should check if following', async () => {
      mockPrisma.whaleFollower.findFirst.mockResolvedValue({ id: 'follow1' });
      const result = await isFollowingWhale(mockWalletAddress, mockWhaleAddress);
      expect(result).toBe(true);
    });
  });

  describe('Data Retrieval', () => {
    it('should get top whales', async () => {
      mockPrisma.whaleWallet.findMany.mockResolvedValue([
        { walletAddress: 'whale1', tags: '["BONK"]' },
        { walletAddress: 'whale2', tags: null },
      ]);

      const whales = await getTopWhales();
      expect(whales).toHaveLength(2);
      expect(whales[0].topTokens).toEqual(['BONK']);
      expect(whales[1].topTokens).toEqual([]);
    });

    it('should get whale alerts for user', async () => {
      // 1. Get followed whales
      mockPrisma.whaleFollower.findMany.mockResolvedValue([{ whaleAddress: 'whale1' }]);

      // 2. Get whale IDs
      mockPrisma.whaleWallet.findMany.mockResolvedValue([{ id: 'id1', walletAddress: 'whale1' }]);

      // 3. Get alerts
      mockPrisma.whaleAlert.findMany.mockResolvedValue([{ id: 'alert1', description: 'Big Buy' }]);

      const alerts = await getWhaleAlertsForUser(mockWalletAddress);
      expect(alerts).toHaveLength(1);
    });
  });
});
