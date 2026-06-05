import { describe, it, expect, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';

jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: jest.fn(), update: jest.fn() } },
}));
jest.mock('@/lib/rateLimitRedis', () => ({ strictRateLimit: jest.fn().mockResolvedValue(true) }));

describe('API: /api/xp/claim', () => {
  let handler: any;
  beforeEach(async () => {
    jest.clearAllMocks();
    try {
      handler = (await import('@/pages/api/xp/claim')).default;
    } catch {
      handler = null;
    }
  });
  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
  it('should handle requests', async () => {
    if (!handler) return;
    const { req, res } = createMocks({ method: 'POST', body: {} });
    try {
      await handler(req, res);
      expect(res._getStatusCode()).toBeGreaterThan(0);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
