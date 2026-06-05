import { prisma } from '@/lib/prisma';

jest.mock('@/lib/logger');

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    user: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    degenScoreCard: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('prisma', () => {
  it('should be properly mocked', () => {
    expect(prisma).toBeDefined();
    expect(prisma.user).toBeDefined();
    expect(prisma.degenScoreCard).toBeDefined();
  });

  it('should allow user operations', async () => {
    const mockUser = { walletAddress: 'test', username: 'test' };
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const result = await prisma.user.create({ data: mockUser });
    expect(result).toEqual(mockUser);
  });

  it('should handle transactions', async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prisma));

    const result = await prisma.$transaction(async (tx) => {
      return 'success';
    });

    expect(result).toBe('success');
  });
});
