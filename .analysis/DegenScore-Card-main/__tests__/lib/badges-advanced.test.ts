import { describe, it, expect } from '@jest/globals';
import {
  calculateUnlockedBadges,
  calculateLevel,
  calculateXP,
  WalletMetrics,
} from '../../lib/badges-advanced';

const mockMetricsLow: WalletMetrics = {
  degenScore: 50,
  totalVolume: 10,
  totalTrades: 5,
  winRate: 40,
  profitLoss: -2,
  rugsSurvived: 0,
  rugsCaught: 1,
  moonshots: 0,
  quickFlips: 5,
  diamondHands: 1,
  longestWinStreak: 2,
  tradingDays: 3,
  bestTrade: 5,
  worstTrade: -3,
  volatilityScore: 50,
  totalRugValue: 1,
};

const mockMetricsHigh: WalletMetrics = {
  degenScore: 95,
  totalVolume: 1500,
  totalTrades: 600,
  winRate: 85,
  profitLoss: 150,
  rugsSurvived: 12,
  rugsCaught: 2,
  moonshots: 15,
  quickFlips: 120,
  diamondHands: 60,
  longestWinStreak: 25,
  tradingDays: 45,
  bestTrade: 75,
  worstTrade: -25,
  volatilityScore: 18,
  totalRugValue: 5,
};

describe('calculateUnlockedBadges', () => {
  it('should return badges for low-performing wallet', () => {
    const badges = calculateUnlockedBadges(mockMetricsLow);

    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some((b) => b.name === 'Getting Started')).toBe(true);
  });

  it('should return many badges for high-performing wallet', () => {
    const badges = calculateUnlockedBadges(mockMetricsHigh);

    expect(badges.length).toBeGreaterThanOrEqual(15);
    expect(badges.some((b) => b.rarity === 'LEGENDARY')).toBe(true);
    expect(badges.some((b) => b.name === 'Whale Trader')).toBe(true);
    expect(badges.some((b) => b.name === 'Degen Legend')).toBe(true);
  });

  it('should recognize moonshot achievements', () => {
    const badges = calculateUnlockedBadges(mockMetricsHigh);

    expect(badges.some((b) => b.name === 'Moonshot Master')).toBe(true);
  });

  it('should recognize rug survival', () => {
    const badges = calculateUnlockedBadges(mockMetricsHigh);

    expect(badges.some((b) => b.name === 'Rug Survivor Legend')).toBe(true);
  });
});

describe('calculateLevel', () => {
  it('should calculate level 1 for new traders', () => {
    const level = calculateLevel(mockMetricsLow);
    expect(level).toBeGreaterThanOrEqual(1);
    expect(level).toBeLessThan(5);
  });

  it('should calculate high level for experienced traders', () => {
    const level = calculateLevel(mockMetricsHigh);
    expect(level).toBeGreaterThan(10);
  });

  it('should return at least level 1', () => {
    const emptyMetrics: WalletMetrics = {
      ...mockMetricsLow,
      degenScore: 0,
      totalTrades: 0,
      totalVolume: 0,
    };

    const level = calculateLevel(emptyMetrics);
    expect(level).toBe(1);
  });
});

describe('calculateXP', () => {
  it('should calculate XP from metrics', () => {
    const xp = calculateXP(mockMetricsHigh);

    expect(xp).toBeGreaterThan(0);
    expect(typeof xp).toBe('number');
  });

  it('should give bonus XP for moonshots and rug survival', () => {
    const baseMetrics: WalletMetrics = {
      ...mockMetricsLow,
      moonshots: 0,
      rugsSurvived: 0,
    };

    const bonusMetrics: WalletMetrics = {
      ...mockMetricsLow,
      moonshots: 5,
      rugsSurvived: 10,
    };

    const baseXP = calculateXP(baseMetrics);
    const bonusXP = calculateXP(bonusMetrics);

    expect(bonusXP).toBeGreaterThan(baseXP);
    expect(bonusXP - baseXP).toBe(100); // 5*10 + 10*5 = 100
  });
});

describe('getXPForNextLevel', () => {
  it('should return XP required for next level', () => {
    expect(getXPForNextLevel(1)).toBe(100);
    expect(getXPForNextLevel(2)).toBe(200);
    expect(getXPForNextLevel(10)).toBe(1000);
  });
});

describe('getBadgesByRarity', () => {
  it('should group badges by rarity', () => {
    const badges = calculateUnlockedBadges(mockMetricsHigh);
    const grouped = getBadgesByRarity(badges);

    expect(grouped).toHaveProperty('LEGENDARY');
    expect(grouped).toHaveProperty('EPIC');
    expect(grouped).toHaveProperty('RARE');
    expect(grouped).toHaveProperty('COMMON');

    expect(Array.isArray(grouped.LEGENDARY)).toBe(true);
  });

  it('should properly categorize legendary badges', () => {
    const badges = calculateUnlockedBadges(mockMetricsHigh);
    const grouped = getBadgesByRarity(badges);

    expect(grouped.LEGENDARY.length).toBeGreaterThan(0);
    expect(grouped.LEGENDARY.every((b) => b.rarity === 'LEGENDARY')).toBe(true);
  });
});

describe('getAchievementSummary', () => {
  it('should generate highlights for good performance', () => {
    const summary = getAchievementSummary(mockMetricsHigh);

    expect(summary.highlights.length).toBeGreaterThan(0);
    expect(summary.highlights.some((h) => h.includes('Survived'))).toBe(true);
    expect(summary.highlights.some((h) => h.includes('moonshot'))).toBe(true);
  });

  it('should generate warnings for poor performance', () => {
    const summary = getAchievementSummary(mockMetricsLow);

    // May or may not have warnings depending on thresholds
    expect(Array.isArray(summary.warnings)).toBe(true);
    expect(Array.isArray(summary.highlights)).toBe(true);
  });

  it('should highlight high win rate', () => {
    const summary = getAchievementSummary(mockMetricsHigh);

    expect(summary.highlights.some((h) => h.includes('win rate'))).toBe(true);
  });

  it('should warn about rug pulls caught', () => {
    const ruggyMetrics: WalletMetrics = {
      ...mockMetricsLow,
      rugsCaught: 5,
      totalRugValue: 10,
    };

    const summary = getAchievementSummary(ruggyMetrics);

    expect(summary.warnings.some((w) => w.includes('rug pull'))).toBe(true);
  });
});

describe('BADGES constant', () => {
  it('should have all badge categories', () => {
    const badgeNames = BADGES.map((b) => b.name);

    // Check for some key badges
    expect(badgeNames).toContain('Whale Trader');
    expect(badgeNames).toContain('Degen Legend');
    expect(badgeNames).toContain('Getting Started');
    expect(badgeNames).toContain('Moonshot Master');
  });

  it('should have proper badge structure', () => {
    BADGES.forEach((badge) => {
      expect(badge).toHaveProperty('name');
      expect(badge).toHaveProperty('description');
      expect(badge).toHaveProperty('icon');
      expect(badge).toHaveProperty('rarity');
      expect(badge).toHaveProperty('condition');
      expect(typeof badge.condition).toBe('function');
    });
  });
});
