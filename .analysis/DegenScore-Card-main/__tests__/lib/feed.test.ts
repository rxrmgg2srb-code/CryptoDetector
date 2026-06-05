import { getHotFeed } from '@/lib/feed';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  feedItem: {
    findMany: jest.fn(),
  },
}));

describe('lib/feed', () => {
  describe('getHotFeed', () => {
    it('should return feed items', async () => {
      (prisma.feedItem.findMany as jest.Mock).mockResolvedValue([{ id: 1, title: 'Hot' }]);
      const result = await getHotFeed();
      expect(result).toHaveLength(1);
    });

    it('should support pagination', async () => {
      await getHotFeed({ page: 2 });
      expect(prisma.feedItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: expect.any(Number) })
      );
    });

    it('should filter by category', async () => {
      await getHotFeed({ category: 'news' });
      expect(prisma.feedItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'news' } })
      );
    });
  });
});
