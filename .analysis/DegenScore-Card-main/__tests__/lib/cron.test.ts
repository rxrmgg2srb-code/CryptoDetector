import { runCleanup, updateRanks } from '@/lib/cron';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  session: {
    deleteMany: jest.fn(),
  },
  user: {
    updateMany: jest.fn(),
  },
}));

describe('lib/cron', () => {
  describe('runCleanup', () => {
    it('should delete old sessions', async () => {
      (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 10 });
      const result = await runCleanup();
      expect(result.deleted).toBe(10);
    });
  });

  describe('updateRanks', () => {
    it('should update user ranks', async () => {
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 100 });
      const result = await updateRanks();
      expect(result.updated).toBe(100);
    });
  });
});
