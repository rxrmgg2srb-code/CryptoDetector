import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/save-card';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  degenCard: {
    upsert: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  scoreHistory: {
    create: jest.fn(),
  },
}));

// Mock Redis rate limiting
jest.mock('@/lib/rateLimitRedis', () => ({
  rateLimit: jest.fn().mockResolvedValue(true),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('/api/save-card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should save card data successfully', async () => {
    const mockCardData = {
      walletAddress: 'SomeValidSolanaAddress123456789',
      degenScore: 85,
      totalTrades: 50,
      totalVolume: 500000,
      profitLoss: 10000,
      winRate: 70,
      bestTrade: 5000,
      worstTrade: -2000,
      avgTradeSize: 10000,
      totalFees: 500,
      tradingDays: 30,
    };

    const { prisma } = require('@/lib/prisma');
    prisma.degenCard.upsert.mockResolvedValue({ id: '1', ...mockCardData });

    const { req, res } = createMocks({
      method: 'POST',
      body: mockCardData,
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });

  it('should reject invalid wallet address', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: 'invalid',
        degenScore: 85,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should reject missing required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: 'SomeValidSolanaAddress123456789',
        // Missing degenScore
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should handle database errors', async () => {
    const { prisma } = require('@/lib/prisma');
    prisma.degenCard.upsert.mockRejectedValue(new Error('Database error'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: 'SomeValidSolanaAddress123456789',
        degenScore: 85,
        totalTrades: 50,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
  });
});
