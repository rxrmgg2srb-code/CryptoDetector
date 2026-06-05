import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import analyzeHandler from '@/pages/api/analyze';

// Mock dependencies
jest.mock('@/lib/logger');
jest.mock('@/lib/services/helius');

global.fetch = jest.fn();

describe('/api/analyze', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    req.method = 'GET';
    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should validate wallet address', async () => {
    req.body = { walletAddress: 'invalid' };
    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should require wallet address', async () => {
    req.body = {};
    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should analyze valid wallet', async () => {
    req.body = { walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'mock' }),
    });

    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle analysis errors', async () => {
    req.body = { walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' };
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));

    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return degenScore', async () => {
    req.body = { walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ degenScore: 85 }),
    });

    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ degenScore: expect.any(Number) })
    );
  });

  it('should handle rate limiting', async () => {
    // Simulate rate limit
    req.body = { walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' };
    for (let i = 0; i < 100; i++) {
      await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    }
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should sanitize input', async () => {
    req.body = { walletAddress: '<script>alert(1)</script>' };
    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle timeouts', async () => {
    req.body = { walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' };
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
    );

    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return proper error messages', async () => {
    req.body = {};
    await analyzeHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});
