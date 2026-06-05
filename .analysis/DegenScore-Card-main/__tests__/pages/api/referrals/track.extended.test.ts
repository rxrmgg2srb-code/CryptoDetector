import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import trackHandler from '@/pages/api/referrals/track';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/logger');

describe('/api/referrals/track', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    req = { method: 'POST', body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should track referral signup', async () => {
    req.body = { referrer: 'alice', referee: 'bob' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should require referrer', async () => {
    req.body = { referee: 'bob' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should require referee', async () => {
    req.body = { referrer: 'alice' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should prevent self-referral', async () => {
    req.body = { referrer: 'alice', referee: 'alice' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should increment referral count', async () => {
    req.body = { referrer: 'alice', referee: 'bob' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ referralCount: { increment: 1 } }),
      })
    );
  });

  it('should store referral relationship', async () => {
    req.body = { referrer: 'alice', referee: 'bob' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.referral.create).toHaveBeenCalled();
  });

  it('should handle duplicate tracking', async () => {
    req.body = { referrer: 'alice', referee: 'bob' };
    (prisma.referral.findFirst as jest.Mock).mockResolvedValue({ id: '1' });
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should award referral XP', async () => {
    req.body = { referrer: 'alice', referee: 'bob' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.userAnalytics.update).toHaveBeenCalled();
  });

  it('should track referral source', async () => {
    req.body = { referrer: 'alice', referee: 'bob', source: 'twitter' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.referral.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ source: 'twitter' }) })
    );
  });

  it('should sanitize inputs', async () => {
    req.body = { referrer: '<script>alert(1)</script>', referee: 'bob' };
    await trackHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
