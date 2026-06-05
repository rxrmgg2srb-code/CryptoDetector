import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/wallet/[walletAddress]';

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/lib/validation', () => ({
  isValidSolanaAddress: jest.fn(),
}));

jest.mock('@/lib/rateLimitRedis', () => ({
  strictRateLimit: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    walletAnalysis: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

describe('API: /api/wallet/[walletAddress]', () => {
  const mockWalletAddress = 'So11111111111111111111111111111111111111112';

  beforeEach(() => {
    jest.clearAllMocks();
    const { strictRateLimit } = require('@/lib/rateLimitRedis');
    const { isValidSolanaAddress } = require('@/lib/validation');

    (strictRateLimit as jest.Mock).mockResolvedValue(true);
    (isValidSolanaAddress as jest.Mock).mockReturnValue(true);
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { walletAddress: mockWalletAddress },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 400 for invalid wallet address', async () => {
    const { isValidSolanaAddress } = require('@/lib/validation');
    (isValidSolanaAddress as jest.Mock).mockReturnValue(false);

    const { req, res } = createMocks({
      method: 'GET',
      query: { walletAddress: 'invalid' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should return wallet data for valid address', async () => {
    const { prisma } = require('@/lib/prisma');
    (prisma.walletAnalysis.findUnique as jest.Mock).mockResolvedValue({
      walletAddress: mockWalletAddress,
      degenScore: 85,
      lastAnalyzed: new Date(),
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: { walletAddress: mockWalletAddress },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toHaveProperty('walletAddress');
  });
});
