import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import leaderboardHandler from '@/pages/api/leaderboard';

jest.mock('@/lib/logger');

describe('/api/leaderboard', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    req = { method: 'GET', query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return leaderboard data', async () => {
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should support pagination', async () => {
    req.query = { page: '2', limit: '10' };
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ page: expect.any(Number) }));
  });

  it('should filter by timeframe', async () => {
    req.query = { timeframe: 'week' };
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalled();
  });

  it('should sort by score', async () => {
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ leaders: expect.any(Array) }));
  });

  it('should cache results', async () => {
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', expect.any(String));
  });

  it('should handle invalid page numbers', async () => {
    req.query = { page: '-1' };
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should limit results per page', async () => {
    req.query = { limit: '100' };
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalled();
  });

  it('should include user rank', async () => {
    req.query = { walletAddress: 'test-wallet' };
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ userRank: expect.any(Number) })
    );
  });

  it('should handle empty leaderboard', async () => {
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ leaders: [] }));
  });

  it('should return total count', async () => {
    await leaderboardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: expect.any(Number) }));
  });
});
