import { createMocks } from 'node-mocks-http';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import handler from '@/pages/api/analyze';
import { calculateAdvancedMetrics } from '@/lib/metrics';
import { strictRateLimit } from '@/lib/rateLimitRedis';
import { isValidSolanaAddress } from '@/lib/validation';

// Mocks
jest.mock('@/lib/metrics', () => ({
  calculateAdvancedMetrics: jest.fn(),
}));

jest.mock('@/lib/badges-generator', () => ({
  generateBadges: jest.fn().mockReturnValue([{ id: 'test-badge', name: 'Test Badge' }]),
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

describe('API: /api/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (strictRateLimit as jest.Mock).mockResolvedValue(true);
    (isValidSolanaAddress as jest.Mock).mockReturnValue(true);
    (calculateAdvancedMetrics as jest.Mock).mockResolvedValue({
      degenScore: 85,
      totalTrades: 100,
      totalVolume: 5000,
      profitLoss: 1000,
      winRate: 0.6,
      bestTrade: 500,
      worstTrade: -100,
      avgTradeSize: 50,
      totalFees: 10,
      tradingDays: 30,
      rugsSurvived: 2,
      rugsCaught: 1,
      totalRugValue: 100,
      moonshots: 5,
      avgHoldTime: 3600,
      quickFlips: 10,
      diamondHands: 5,
      realizedPnL: 800,
      unrealizedPnL: 200,
      firstTradeDate: 1600000000,
      longestWinStreak: 5,
      longestLossStreak: 2,
      volatilityScore: 0.5,
    });
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({ error: 'Method not allowed' });
  });

  it('should return 400 if wallet address is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Wallet address is required' });
  });

  it('should return 400 if wallet address is invalid', async () => {
    (isValidSolanaAddress as jest.Mock).mockReturnValue(false);

    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'invalid-address' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid Solana wallet address' });
  });

  it('should return 200 with analysis data for valid request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-address' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.degenScore).toBe(85);
    expect(data.badges).toBeDefined();
    expect(data.level).toBe(9); // 85/10 + 1
  });

  it('should handle rate limiting', async () => {
    (strictRateLimit as jest.Mock).mockResolvedValue(false);

    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-address' },
    });

    await handler(req, res);

    // strictRateLimit handles the response itself
    expect(calculateAdvancedMetrics).not.toHaveBeenCalled();
  });

  it('should handle analysis errors', async () => {
    (calculateAdvancedMetrics as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-address' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toHaveProperty('error');
  });

  it('should handle timeout errors', async () => {
    // Mock timeout error
    (calculateAdvancedMetrics as jest.Mock).mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 100);
      });
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: { walletAddress: 'valid-address' },
    });

    // We need to wait for the promise race in the handler
    // This is tricky to test perfectly without real timers, but we can simulate the rejection
    (calculateAdvancedMetrics as jest.Mock).mockRejectedValue(new Error('Analysis timeout'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(504);
    expect(res._getJSONData().details).toBe('Wallet analysis timeout');
  });
});
