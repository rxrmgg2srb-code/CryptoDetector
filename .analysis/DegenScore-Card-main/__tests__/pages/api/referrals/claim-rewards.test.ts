import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import claimRewardsHandler from '@/pages/api/referrals/claim-rewards';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/walletAuth';
import { claimReferralRewards } from '@/lib/referralEngine';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    referral: {
      findMany: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    degenCard: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    badge: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/walletAuth', () => ({
  verifySessionToken: jest.fn(),
}));

jest.mock('@/lib/referralEngine', () => ({
  claimReferralRewards: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('/api/referrals/claim-rewards', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Default mock implementations
    (verifySessionToken as jest.Mock).mockReturnValue({
      valid: true,
      wallet: 'wallet-123',
    });
  });

  it('should return 405 for non-POST methods', async () => {
    req.method = 'GET';
    await claimRewardsHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 401 if no authorization header', async () => {
    req.headers = {};
    await claimRewardsHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 if invalid session', async () => {
    (verifySessionToken as jest.Mock).mockReturnValue({ valid: false });
    await claimRewardsHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 400 if claim fails', async () => {
    (claimReferralRewards as jest.Mock).mockResolvedValue({
      success: false,
      error: 'No rewards',
    });

    await claimRewardsHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No rewards' });
  });

  it('should return 200 and amount if claim succeeds', async () => {
    (claimReferralRewards as jest.Mock).mockResolvedValue({
      success: true,
      amount: 1000,
    });

    await claimRewardsHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        amount: 1000,
      })
    );
  });

  it('should handle internal errors', async () => {
    (claimReferralRewards as jest.Mock).mockRejectedValue(new Error('DB Error'));
    await claimRewardsHandler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
