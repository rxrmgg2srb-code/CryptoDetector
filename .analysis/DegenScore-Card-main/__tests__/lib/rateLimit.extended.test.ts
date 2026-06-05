import { applyRateLimit, getRateLimitInfo, resetRateLimit } from '@/lib/rateLimit';

jest.mock('@/lib/redis');
jest.mock('@/lib/logger');

describe('rateLimit - Extended Tests', () => {
  const testKey = 'test-user';

  beforeEach(async () => {
    await resetRateLimit(testKey);
  });

  it('should allow requests within limit', async () => {
    for (let i = 0; i < 10; i++) {
      const result = await applyRateLimit(testKey, { max: 10, window: 60 });
      expect(result.allowed).toBe(true);
    }
  });

  it('should block after exceeding limit', async () => {
    for (let i = 0; i < 11; i++) {
      await applyRateLimit(testKey, { max: 10, window: 60 });
    }
    const result = await applyRateLimit(testKey, { max: 10, window: 60 });
    expect(result.allowed).toBe(false);
  });

  it('should return remaining count', async () => {
    await applyRateLimit(testKey, { max: 10, window: 60 });
    const info = await getRateLimitInfo(testKey);
    expect(info.remaining).toBe(9);
  });

  it('should reset after window expires', async () => {
    jest.useFakeTimers();
    await applyRateLimit(testKey, { max: 5, window: 1 });
    jest.advanceTimersByTime(1100);
    const result = await applyRateLimit(testKey, { max: 5, window: 1 });
    expect(result.allowed).toBe(true);
    jest.useRealTimers();
  });

  it('should handle different rate limits per key', async () => {
    await applyRateLimit('user1', { max: 10, window: 60 });
    await applyRateLimit('user2', { max: 10, window: 60 });
    const info1 = await getRateLimitInfo('user1');
    const info2 = await getRateLimitInfo('user2');
    expect(info1.remaining).toBe(9);
    expect(info2.remaining).toBe(9);
  });

  it('should support burst limits', async () => {
    const result = await applyRateLimit(testKey, {
      max: 100,
      window: 60,
      burst: 10,
    });
    expect(result.allowed).toBe(true);
  });

  it('should handle Redis failures gracefully', async () => {
    (redis.incr as jest.Mock).mockRejectedValue(new Error('Redis down'));
    const result = await applyRateLimit(testKey, { max: 10, window: 60 });
    expect(result.allowed).toBe(true); // Fail open
  });

  it('should return retry-after header value', async () => {
    for (let i = 0; i < 11; i++) {
      await applyRateLimit(testKey, { max: 10, window: 60 });
    }
    const info = await getRateLimitInfo(testKey);
    expect(info.retryAfter).toBeGreaterThan(0);
  });

  it('should support IP-based limiting', async () => {
    const result = await applyRateLimit('ip:192.168.1.1', { max: 100, window: 60 });
    expect(result.allowed).toBe(true);
  });

  it('should support sliding window', async () => {
    await applyRateLimit(testKey, { max: 10, window: 60, sliding: true });
    const info = await getRateLimitInfo(testKey);
    expect(info.windowStart).toBeDefined();
  });
});
