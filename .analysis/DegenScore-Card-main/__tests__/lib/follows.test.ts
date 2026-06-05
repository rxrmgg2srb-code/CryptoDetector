import { getFollowers, followUser, unfollowUser } from '@/lib/follows';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  follow: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('lib/follows', () => {
  describe('getFollowers', () => {
    it('should return followers', async () => {
      (prisma.follow.findMany as jest.Mock).mockResolvedValue([{ followerId: 'user1' }]);
      const result = await getFollowers('target');
      expect(result).toHaveLength(1);
    });
  });

  describe('followUser', () => {
    it('should create follow', async () => {
      (prisma.follow.create as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await followUser('follower', 'target');
      expect(result.success).toBe(true);
    });
  });

  describe('unfollowUser', () => {
    it('should delete follow', async () => {
      (prisma.follow.delete as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await unfollowUser('follower', 'target');
      expect(result.success).toBe(true);
    });
  });
});
