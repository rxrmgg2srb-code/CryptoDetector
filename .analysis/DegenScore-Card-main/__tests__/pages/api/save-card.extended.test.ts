import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import saveCardHandler from '@/pages/api/save-card';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/logger');

describe('/api/save-card', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    req = { method: 'POST', body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should save card data', async () => {
    req.body = {
      walletAddress: 'test-wallet',
      analysisData: { degenScore: 85 },
    };
    (prisma.degenScoreCard.create as jest.Mock).mockResolvedValue({ id: '1' });

    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should require wallet address', async () => {
    req.body = { analysisData: {} };
    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should validate analysis data', async () => {
    req.body = { walletAddress: 'test', analysisData: null };
    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle database errors', async () => {
    req.body = { walletAddress: 'test', analysisData: {} };
    (prisma.degenScoreCard.create as jest.Mock).mockRejectedValue(new Error('DB error'));
    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should update existing card', async () => {
    req.body = { walletAddress: 'test', analysisData: { degenScore: 90 } };
    (prisma.degenScoreCard.upsert as jest.Mock).mockResolvedValue({ id: '1' });
    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.degenScoreCard.upsert).toHaveBeenCalled();
  });

  it('should sanitize inputs', async () => {
    req.body = { walletAddress: '<script>alert(1)</script>', analysisData: {} };
    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return created card ID', async () => {
    req.body = { walletAddress: 'test', analysisData: {} };
    (prisma.degenScoreCard.create as jest.Mock).mockResolvedValue({ id: 'new-id' });
    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-id' }));
  });

  it('should handle concurrent saves', async () => {
    req.body = { walletAddress: 'test', analysisData: {} };
    const promises = Array(10)
      .fill(null)
      .map(() => saveCardHandler(req as NextApiRequest, res as NextApiResponse));
    await Promise.all(promises);
    expect(prisma.degenScoreCard.create).toHaveBeenCalled();
  });

  it('should validate degenScore range', async () => {
    req.body = { walletAddress: 'test', analysisData: { degenScore: 150 } };
    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should store metadata', async () => {
    req.body = {
      walletAddress: 'test',
      analysisData: { degenScore: 75, totalTrades: 100 },
    };
    (prisma.degenScoreCard.create as jest.Mock).mockResolvedValue({ id: '1' });
    await saveCardHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.degenScoreCard.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totalTrades: 100 }) })
    );
  });
});
