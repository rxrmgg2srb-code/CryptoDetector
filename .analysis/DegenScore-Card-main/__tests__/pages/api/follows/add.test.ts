import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import addFollowHandler from '@/pages/api/follows/add';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/logger');

describe('/api/follows/add', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    req = { method: 'POST', body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should add new follow', async () => {
    req.body = { follower: 'alice', following: 'bob' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should require follower', async () => {
    req.body = { following: 'bob' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should require following', async () => {
    req.body = { follower: 'alice' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should prevent self-follow', async () => {
    req.body = { follower: 'alice', following: 'alice' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should increment follower count', async () => {
    req.body = { follower: 'alice', following: 'bob' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ followerCount: { increment: 1 } }),
      })
    );
  });

  it('should increment following count', async () => {
    req.body = { follower: 'alice', following: 'bob' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('should prevent duplicate follows', async () => {
    req.body = { follower: 'alice', following: 'bob' };
    (prisma.follow.findFirst as jest.Mock).mockResolvedValue({ id: '1' });
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should create follow record', async () => {
    req.body = { follower: 'alice', following: 'bob' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.follow.create).toHaveBeenCalled();
  });

  it('should create notification', async () => {
    req.body = { follower: 'alice', following: 'bob' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'FOLLOW' }) })
    );
  });

  it('should sanitize inputs', async () => {
    req.body = { follower: '<script>alert(1)</script>', following: 'bob' };
    await addFollowHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
