import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import checkinHandler from '@/pages/api/streaks/checkin';

jest.mock('@/lib/logger');

describe('/api/streaks/checkin', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    req = { method: 'POST', body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should perform check-in', async () => {
    req.body = { walletAddress: 'test' };
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should require wallet address', async () => {
    req.body = {};
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should increment streak', async () => {
    req.body = { walletAddress: 'test' };
    (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({ currentStreak: 5 });
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.userAnalytics.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currentStreak: 6 }) })
    );
  });

  it('should prevent duplicate check-in same day', async () => {
    req.body = { walletAddress: 'test' };
    (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({ lastCheckIn: new Date() });
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should reset streak if missed day', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    req.body = { walletAddress: 'test' };
    (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({
      lastCheckIn: twoDaysAgo,
      currentStreak: 10,
    });
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.userAnalytics.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ currentStreak: 1 }) })
    );
  });

  it('should award XP for check-in', async () => {
    req.body = { walletAddress: 'test' };
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.userAnalytics.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalXP: { increment: expect.any(Number) } }),
      })
    );
  });

  it('should award bonus XP for milestones', async () => {
    req.body = { walletAddress: 'test' };
    (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({ currentStreak: 29 });
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ milestone: true }));
  });

  it('should update longest streak', async () => {
    req.body = { walletAddress: 'test' };
    (prisma.userAnalytics.findUnique as jest.Mock).mockResolvedValue({
      currentStreak: 15,
      longestStreak: 10,
    });
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.userAnalytics.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ longestStreak: 16 }) })
    );
  });

  it('should return new streak value', async () => {
    req.body = { walletAddress: 'test' };
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ currentStreak: expect.any(Number) })
    );
  });

  it('should track check-in timestamp', async () => {
    req.body = { walletAddress: 'test' };
    await checkinHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.userAnalytics.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lastCheckIn: expect.any(Date) }) })
    );
  });
});
