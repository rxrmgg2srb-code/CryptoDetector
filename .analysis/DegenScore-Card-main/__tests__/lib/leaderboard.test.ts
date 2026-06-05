import { getLeaderboard } from '@/lib/leaderboard';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  user: {
    findMany: jest.fn(),
  },
}));

describe('lib/leaderboard', () => {
  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 1, score: 100 }]);
      const result = await getLeaderboard();
      expect(result).toHaveLength(1);
    });

    it('should sort by score', async () => {
      await getLeaderboard();
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { score: 'desc' } })
      );
    });
  });
});
