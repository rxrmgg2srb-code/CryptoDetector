import { getReferralStats, checkRewards } from '@/lib/referrals';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  referral: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
}));

describe('lib/referrals', () => {
  describe('getReferralStats', () => {
    it('should return stats', async () => {
      (prisma.referral.count as jest.Mock).mockResolvedValue(10);
      const result = await getReferralStats('wallet');
      expect(result.total).toBe(10);
    });
  });

  describe('checkRewards', () => {
    it('should return rewards', async () => {
      // Mock rewards logic
      const result = await checkRewards('wallet');
      expect(result).toBeDefined();
    });
  });
});
