import {
  getTierConfig,
  getLevelPhrase,
  formatNumber,
  getFOMOPhrase,
} from '@/components/leaderboard/utils';

describe('Leaderboard Utils', () => {
  describe('getTierConfig', () => {
    it('should return LEGENDARY tier for score >= 90', () => {
      const tier = getTierConfig(95);
      expect(tier.name).toBe('LEGENDARY');
      expect(tier.emoji).toBe('👑');
    });

    it('should return MASTER tier for score >= 80', () => {
      const tier = getTierConfig(85);
      expect(tier.name).toBe('MASTER');
      expect(tier.emoji).toBe('💎');
    });

    it('should return DIAMOND tier for score >= 70', () => {
      const tier = getTierConfig(75);
      expect(tier.name).toBe('DIAMOND');
      expect(tier.emoji).toBe('💠');
    });

    it('should return PLATINUM tier for score >= 60', () => {
      const tier = getTierConfig(65);
      expect(tier.name).toBe('PLATINUM');
      expect(tier.emoji).toBe('⚡');
    });

    it('should return GOLD tier for score >= 50', () => {
      const tier = getTierConfig(55);
      expect(tier.name).toBe('GOLD');
      expect(tier.emoji).toBe('🌟');
    });

    it('should return DEGEN tier for score < 50', () => {
      const tier = getTierConfig(45);
      expect(tier.name).toBe('DEGEN');
      expect(tier.emoji).toBe('🎮');
    });
  });

  describe('getLevelPhrase', () => {
    it('should return correct phrase for high levels', () => {
      expect(getLevelPhrase(55)).toBe('🔥 Absolute Gigachad');
      expect(getLevelPhrase(45)).toBe('💪 Degen Overlord');
    });

    it('should return correct phrase for mid levels', () => {
      expect(getLevelPhrase(35)).toBe('🚀 Moon Mission Commander');
      expect(getLevelPhrase(25)).toBe('💎 Diamond Handed Legend');
    });

    it('should return correct phrase for low levels', () => {
      expect(getLevelPhrase(15)).toBe('⚡ Certified Degen');
      expect(getLevelPhrase(12)).toBe('🎯 Getting There');
      expect(getLevelPhrase(6)).toBe('🐣 Baby Degen');
      expect(getLevelPhrase(2)).toBe('😅 Just Started');
    });
  });

  describe('formatNumber', () => {
    it('should format billions', () => {
      expect(formatNumber(1500000000)).toBe('1.50B');
    });

    it('should format millions', () => {
      expect(formatNumber(1500000)).toBe('1.50M');
    });

    it('should format thousands', () => {
      expect(formatNumber(1500)).toBe('1.50K');
    });

    it('should format small numbers', () => {
      expect(formatNumber(100)).toBe('100.00');
    });

    it('should handle null/undefined', () => {
      expect(formatNumber(null as any)).toBe('N/A');
      expect(formatNumber(undefined as any)).toBe('N/A');
    });
  });

  describe('getFOMOPhrase', () => {
    it('should return correct FOMO phrase based on score', () => {
      expect(getFOMOPhrase(96)).toBe('🔥 GOD MODE - They Bow to You');
      expect(getFOMOPhrase(92)).toBe('👑 APEX PREDATOR - Pure Domination');
      expect(getFOMOPhrase(5)).toBe("🪦 QUIT FOREVER - It's Over Bro");
    });
  });
});
