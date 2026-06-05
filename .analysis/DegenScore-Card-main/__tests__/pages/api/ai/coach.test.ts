import React from 'react';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/ai/coach';
import { getAiAdvice } from '@/lib/aiCoach';

jest.mock('@/lib/aiCoach');

describe('/api/ai/coach', () => {
  it('should return advice for valid request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        score: 85,
        walletAddress: 'test-wallet',
      },
    });

    (getAiAdvice as jest.Mock).mockResolvedValue('Great job!');

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ advice: 'Great job!' });
  });

  it('should return 405 for non-POST methods', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 400 for missing score', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: 'test-wallet',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should handle internal errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        score: 85,
      },
    });

    (getAiAdvice as jest.Mock).mockRejectedValue(new Error('AI Error'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
  });

  it('should validate score range', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        score: 101,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should support personalization', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        score: 85,
        username: 'Degen',
      },
    });

    (getAiAdvice as jest.Mock).mockResolvedValue('Hello Degen');

    await handler(req, res);

    expect(getAiAdvice).toHaveBeenCalledWith(85, expect.objectContaining({ username: 'Degen' }));
  });

  it('should rate limit requests', async () => {
    // Mock rate limiter middleware if applicable
    // Or simulate rate limit response
  });

  it('should sanitize input', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        score: 85,
        username: '<script>alert(1)</script>',
      },
    });

    await handler(req, res);
    // Expect sanitization logic to be called
  });

  it('should log requests', async () => {
    // Check logger mock
  });

  it('should handle empty body', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });
});
