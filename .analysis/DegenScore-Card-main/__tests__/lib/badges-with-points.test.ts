import { describe, it, expect } from '@jest/globals';
import {
  checkAllBadges,
  calculateBadgePoints,
  checkVolumeBadges,
  checkPnlBadges,
  checkWinRateBadges,
  checkActivityBadges,
  checkPremiumBadges,
  getBadgeColor,
  getBadgeGlow,
  BADGE_POINTS,
  VOLUME_BADGES,
  PNL_BADGES,
} from '@/lib/badges-with-points';

describe('Badges System (Bonk Ready 🐕)', () => {
  // Mock metrics for a "Whale" user
  const whaleMetrics = {
    totalVolume: 10000,
    profitLoss: 500,
    winRate: 95,
    totalTrades: 6000,
    tradingDays: 400,
    moonshots: 10,
    diamondHands: 20,
    isPaid: true,
    twitter: 'degentrader',
    telegram: 'degentrader_tg',
    profileImage: 'avatar.png',
    displayName: 'Degen King',
  };

  // Mock metrics for a "Rookie" user
  const rookieMetrics = {
    totalVolume: 2,
    profitLoss: -2,
    winRate: 40,
    totalTrades: 5,
    tradingDays: 2,
    moonshots: 0,
    diamondHands: 0,
    isPaid: false,
  };

  describe('Point System', () => {
    it('should have correct point values defined', () => {
      expect(BADGE_POINTS.COMMON).toBe(1);
      expect(BADGE_POINTS.RARE).toBe(3);
      expect(BADGE_POINTS.EPIC).toBe(5);
      expect(BADGE_POINTS.LEGENDARY).toBe(10);
      expect(BADGE_POINTS.MYTHIC).toBe(25);
    });

    it('should calculate total points correctly', () => {
      const badges = [
        VOLUME_BADGES[0], // COMMON (1)
        VOLUME_BADGES[3], // RARE (3)
        PNL_BADGES[6], // LEGENDARY (10)
      ];
      const points = calculateBadgePoints(badges);
      expect(points).toBe(1 + 3 + 10);
    });
  });

  describe('Badge Checking Logic', () => {
    it('should award volume badges correctly', () => {
      const badges = checkVolumeBadges(whaleMetrics);
      // Should have all volume badges up to max threshold
      expect(badges.length).toBeGreaterThan(10);
      expect(badges.some((b) => b.key === 'god_volume')).toBe(true);

      const rookieBadges = checkVolumeBadges(rookieMetrics);
      expect(rookieBadges.some((b) => b.key === 'mini_degen')).toBe(true);
      expect(rookieBadges.some((b) => b.key === 'whale')).toBe(false);
    });

    it('should award PnL badges correctly (Profit & Loss)', () => {
      const profitBadges = checkPnlBadges(whaleMetrics);
      expect(profitBadges.some((b) => b.key === 'profit_titan')).toBe(true);

      const lossBadges = checkPnlBadges(rookieMetrics); // -2 SOL
      expect(lossBadges.some((b) => b.key === 'rug_victim')).toBe(true); // -1 SOL threshold
    });

    it('should award Win Rate badges correctly', () => {
      const badges = checkWinRateBadges(whaleMetrics); // 95%
      expect(badges.some((b) => b.key === 'zen_trader')).toBe(true);

      const rookieBadges = checkWinRateBadges(rookieMetrics); // 40%
      expect(rookieBadges.length).toBe(0);
    });

    it('should award Activity badges correctly', () => {
      const badges = checkActivityBadges(whaleMetrics);
      expect(badges.some((b) => b.key === 'degen_god')).toBe(true); // 5000+ trades
      expect(badges.some((b) => b.key === 'eternal_degen')).toBe(true); // 365+ days
      expect(badges.some((b) => b.key === 'moonshot_hunter')).toBe(true);
      expect(badges.some((b) => b.key === 'diamond_hands')).toBe(true);
    });

    it('should award Premium/Social badges correctly', () => {
      const badges = checkPremiumBadges(whaleMetrics);
      expect(badges.some((b) => b.key === 'premium_trader')).toBe(true);
      expect(badges.some((b) => b.key === 'social_flex')).toBe(true);
      expect(badges.some((b) => b.key === 'full_profile')).toBe(true);

      const rookieBadges = checkPremiumBadges(rookieMetrics);
      expect(rookieBadges.length).toBe(0);
    });
  });

  describe('Integration: checkAllBadges', () => {
    it('should aggregate all badges and calculate total score', () => {
      const result = checkAllBadges(whaleMetrics);

      expect(result.badges.length).toBeGreaterThan(20);
      expect(result.totalPoints).toBeGreaterThan(100);

      // Ensure no duplicates
      const keys = result.badges.map((b) => b.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  describe('UI Helpers', () => {
    it('should return correct colors for rarity', () => {
      expect(getBadgeColor('COMMON')).toContain('gray');
      expect(getBadgeColor('MYTHIC')).toContain('pink');
    });

    it('should return correct glows for rarity', () => {
      expect(getBadgeGlow('LEGENDARY')).toContain('yellow');
      expect(getBadgeGlow('EPIC')).toContain('purple');
    });
  });
});
