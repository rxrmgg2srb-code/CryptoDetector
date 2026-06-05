import { getUserStats } from '@/lib/stats';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

describe('lib/stats', () => {
  describe('getUserStats', () => {
    it('should return user stats', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ score: 90, rank: 1 });
      const result = await getUserStats('wallet');
      expect(result.score).toBe(90);
    });

    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await getUserStats('unknown');
      expect(result).toBeNull();
    });
  });
});
