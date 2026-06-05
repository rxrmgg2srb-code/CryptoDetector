import { toggleLike, getLikeStatus } from '@/lib/likes';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  like: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('lib/likes', () => {
  describe('toggleLike', () => {
    it('should create like if not exists', async () => {
      (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.like.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await toggleLike('user', 'item');
      expect(result.liked).toBe(true);
    });

    it('should delete like if exists', async () => {
      (prisma.like.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.like.delete as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await toggleLike('user', 'item');
      expect(result.liked).toBe(false);
    });
  });

  describe('getLikeStatus', () => {
    it('should return like status', async () => {
      (prisma.like.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await getLikeStatus('user', 'item');
      expect(result.liked).toBe(true);
    });
  });
});
