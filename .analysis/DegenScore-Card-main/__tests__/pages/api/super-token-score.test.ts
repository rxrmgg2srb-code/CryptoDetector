import { createMocks } from 'node-mocks-http';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import handler from '@/pages/api/super-token-score';
import { analyzeSuperTokenScore } from '@/lib/services/superTokenScorer';
import { strictRateLimit } from '@/lib/rateLimitRedis';
import { isValidSolanaAddress } from '@/lib/validation';
import redis from '@/lib/cache/redis';

// Mocks
jest.mock('@/lib/services/superTokenScorer', () => ({
  analyzeSuperTokenScore: jest.fn(),
}));

jest.mock('@/lib/validation', () => ({
  isValidSolanaAddress: jest.fn(),
}));

jest.mock('@/lib/rateLimitRedis', () => ({
  strictRateLimit: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock Prisma inline to avoid hoisting issues
jest.mock('@/lib/prisma', () => ({
  prisma: {
    superTokenAnalysis: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

// Mock Redis
jest.mock('@/lib/cache/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  },
}));

describe('API: /api/super-token-score', () => {
  const mockTokenAddress = 'So11111111111111111111111111111111111111112';
  const mockResult = {
    tokenAddress: mockTokenAddress,
    tokenSymbol: 'TEST',
    tokenName: 'Test Token',
    superScore: 85,
    globalRiskLevel: 'LOW',
    recommendation: 'Safe to buy',
    scoreBreakdown: {
      baseSecurityScore: 90,
      newWalletScore: 40,
      insiderScore: 45,
      volumeScore: 35,
      socialScore: 25,
      botDetectionScore: 55,
      smartMoneyScore: 60,
      teamScore: 35,
      pricePatternScore: 40,
      historicalHoldersScore: 35,
      liquidityDepthScore: 45,
      crossChainScore: 25,
      competitorScore: 20,
      rugCheckScore: 95,
      dexScreenerScore: 50,
      birdeyeScore: 45,
      jupiterScore: 45,
    },
    newWalletAnalysis: { walletsUnder10Days: 5, percentageNewWallets: 10 },
    insiderAnalysis: { insiderWallets: 2, insiderProfitTaking: false },
    volumeAnalysis: { realVolume: 100000, fakeVolumePercent: 5 },
    botDetection: { totalBots: 10, botPercent: 2 },
    smartMoneyAnalysis: { signal: 'BUY' },
    teamAnalysis: { teamTokensLocked: true },
    pricePattern: { pattern: 'ORGANIC_GROWTH' },
    liquidityDepth: { liquidityHealth: 'EXCELLENT' },
    allRedFlags: [],
    greenFlags: [],
    analysisTimeMs: 1500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (strictRateLimit as jest.Mock).mockResolvedValue(true);
    (isValidSolanaAddress as jest.Mock).mockReturnValue(true);
    (analyzeSuperTokenScore as jest.Mock).mockResolvedValue(mockResult);

    // Reset Prisma mocks
    const { prisma } = require('@/lib/prisma');
    (prisma.superTokenAnalysis.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.superTokenAnalysis.upsert as jest.Mock).mockResolvedValue({});
    (prisma.superTokenAnalysis.update as jest.Mock).mockResolvedValue({});

    // Reset Redis mocks
    (redis.get as jest.Mock).mockResolvedValue(null);
    (redis.set as jest.Mock).mockResolvedValue('OK');
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 400 if token address is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should return cached result from Redis if available', async () => {
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockResult));

    const { req, res } = createMocks({
      method: 'POST',
      body: { tokenAddress: mockTokenAddress },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().cached).toBe(true);
    expect(analyzeSuperTokenScore).not.toHaveBeenCalled();
  });

  it('should return cached result from DB if available and fresh', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);

    const { prisma } = require('@/lib/prisma');
    (prisma.superTokenAnalysis.findUnique as jest.Mock).mockResolvedValue({
      analyzedAt: new Date(), // Just now
      fullDataJson: mockResult,
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: { tokenAddress: mockTokenAddress },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().cached).toBe(true);
    expect(analyzeSuperTokenScore).not.toHaveBeenCalled();
  });

  it('should perform fresh analysis if cache is stale', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);

    const { prisma } = require('@/lib/prisma');
    (prisma.superTokenAnalysis.findUnique as jest.Mock).mockResolvedValue({
      analyzedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago (stale)
      fullDataJson: mockResult,
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: { tokenAddress: mockTokenAddress },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().cached).toBe(false);
    expect(analyzeSuperTokenScore).toHaveBeenCalled();
    expect(prisma.superTokenAnalysis.upsert).toHaveBeenCalled();
  });

  it('should force refresh if requested', async () => {
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockResult));

    const { req, res } = createMocks({
      method: 'POST',
      body: { tokenAddress: mockTokenAddress, forceRefresh: true },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().cached).toBe(false);
    expect(analyzeSuperTokenScore).toHaveBeenCalled();
  });

  it('should handle analysis errors', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);

    const { prisma } = require('@/lib/prisma');
    (prisma.superTokenAnalysis.findUnique as jest.Mock).mockResolvedValue(null);
    (analyzeSuperTokenScore as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

    const { req, res } = createMocks({
      method: 'POST',
      body: { tokenAddress: mockTokenAddress },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
  });
});
