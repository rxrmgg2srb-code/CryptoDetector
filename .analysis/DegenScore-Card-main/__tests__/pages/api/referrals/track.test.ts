import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/referrals/track';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  referral: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  degenCard: {
    findUnique: jest.fn(),
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

// Mock referral engine
jest.mock('@/lib/referralEngine', () => ({
  trackReferral: jest.fn(),
  checkAndGrantRewards: jest.fn(),
}));

describe('/api/referrals/track', () => {
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

  it('should track referral successfully', async () => {
    const { referral } = require('@/lib/prisma');
    const { trackReferral } = require('@/lib/referralEngine');

    referral.findFirst.mockResolvedValue(null); // No existing referral
    trackReferral.mockResolvedValue({ success: true });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        referrerWallet: 'ReferrerWallet123456789',
        referredWallet: 'ReferredWallet123456789',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });

  it('should reject invalid wallet addresses', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        referrerWallet: 'invalid',
        referredWallet: 'also-invalid',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should prevent self-referral', async () => {
    const sameWallet = 'SameWallet123456789';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        referrerWallet: sameWallet,
        referredWallet: sameWallet,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should handle duplicate referrals', async () => {
    const { referral } = require('@/lib/prisma');
    referral.findFirst.mockResolvedValue({ id: '1' }); // Existing referral

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        referrerWallet: 'ReferrerWallet123456789',
        referredWallet: 'ReferredWallet123456789',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
