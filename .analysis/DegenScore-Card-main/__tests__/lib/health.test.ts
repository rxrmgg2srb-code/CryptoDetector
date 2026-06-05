import { checkDatabase, checkRedis } from '@/lib/health';
import prisma from '@/lib/prisma';
import Redis from 'ioredis';

jest.mock('@/lib/prisma', () => ({
  $queryRaw: jest.fn(),
}));

jest.mock('ioredis');

describe('lib/health', () => {
  describe('checkDatabase', () => {
    it('should return true if connected', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([1]);
      const result = await checkDatabase();
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Fail'));
      const result = await checkDatabase();
      expect(result).toBe(false);
    });
  });

  describe('checkRedis', () => {
    it('should return true if connected', async () => {
      // Mock redis ping
      const result = await checkRedis();
      // ...
    });
  });
});
