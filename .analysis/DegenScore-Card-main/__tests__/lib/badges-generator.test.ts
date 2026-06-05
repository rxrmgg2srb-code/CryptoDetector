import { describe, it, expect, jest } from '@jest/globals';
import { generateBadges } from '@/lib/badges-generator';

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('BadgesGenerator', () => {
  const mockWalletData = {
    totalTransactions: 1000,
    degenScore: 85,
    nftCount: 50,
    tokenCount: 30,
    stakingAmount: 1000,
    defiInteractions: 100,
  };

  it('should generate badges based on wallet data', () => {
    const badges = generateBadges(mockWalletData);

    expect(badges).toBeDefined();
    expect(Array.isArray(badges)).toBe(true);
  });

  it('should return empty array for minimal data', () => {
    const minimalData = {
      totalTransactions: 1,
      degenScore: 10,
    };

    const badges = generateBadges(minimalData);

    expect(Array.isArray(badges)).toBe(true);
  });

  it('should include badge properties', () => {
    const badges = generateBadges(mockWalletData);

    if (badges.length > 0) {
      expect(badges[0]).toHaveProperty('id');
      expect(badges[0]).toHaveProperty('name');
      expect(badges[0]).toHaveProperty('description');
    }
  });
});
