import { describe, it, expect } from '@jest/globals';
import {
  getScoreColor,
  getRiskBadge,
  getRiskColor,
  getSeverityEmoji,
  getSignalColor,
  getPatternColor,
  getLiquidityColor,
} from '@/lib/utils/token-scoring';

describe('Token Scoring Utils 📊', () => {
  describe('getScoreColor', () => {
    it('should return correct colors for score ranges', () => {
      expect(getScoreColor(850)).toBe('text-green-400');
      expect(getScoreColor(700)).toBe('text-blue-400');
      expect(getScoreColor(550)).toBe('text-yellow-400');
      expect(getScoreColor(400)).toBe('text-orange-400');
      expect(getScoreColor(100)).toBe('text-red-400');
    });
  });

  describe('getRiskBadge', () => {
    it('should return correct badge classes for risk levels', () => {
      expect(getRiskBadge('ULTRA_SAFE')).toContain('bg-green-500');
      expect(getRiskBadge('SAFE')).toContain('bg-blue-500');
      expect(getRiskBadge('MODERATE')).toContain('bg-yellow-500');
      expect(getRiskBadge('RISKY')).toContain('bg-orange-500');
      expect(getRiskBadge('VERY_RISKY')).toContain('bg-red-500');
      expect(getRiskBadge('SCAM')).toContain('bg-black');
      expect(getRiskBadge('UNKNOWN')).toContain('bg-gray-500');
    });
  });

  describe('getRiskColor', () => {
    it('should return correct text colors for risk levels', () => {
      expect(getRiskColor('LOW')).toBe('text-green-400');
      expect(getRiskColor('MEDIUM')).toBe('text-yellow-400');
      expect(getRiskColor('HIGH')).toBe('text-orange-400');
      expect(getRiskColor('CRITICAL')).toBe('text-red-400');
      expect(getRiskColor('UNKNOWN')).toBe('text-gray-400');
    });
  });

  describe('getSeverityEmoji', () => {
    it('should return correct emojis for severity', () => {
      expect(getSeverityEmoji('CRITICAL')).toBe('🔴');
      expect(getSeverityEmoji('HIGH')).toBe('🟠');
      expect(getSeverityEmoji('MEDIUM')).toBe('🟡');
      expect(getSeverityEmoji('LOW')).toBe('🔵');
      expect(getSeverityEmoji('UNKNOWN')).toBe('ℹ️');
    });
  });

  describe('getSignalColor', () => {
    it('should return correct colors for signals', () => {
      expect(getSignalColor('STRONG_BUY')).toContain('text-green-500');
      expect(getSignalColor('BUY')).toBe('text-green-400');
      expect(getSignalColor('NEUTRAL')).toBe('text-gray-400');
      expect(getSignalColor('SELL')).toBe('text-red-400');
      expect(getSignalColor('STRONG_SELL')).toContain('text-red-500');
      expect(getSignalColor('UNKNOWN')).toBe('text-gray-400');
    });
  });

  describe('getPatternColor', () => {
    it('should return correct colors for patterns', () => {
      expect(getPatternColor('ORGANIC_GROWTH')).toBe('text-green-400');
      expect(getPatternColor('ACCUMULATION')).toBe('text-blue-400');
      expect(getPatternColor('SIDEWAYS')).toBe('text-gray-400');
      expect(getPatternColor('DISTRIBUTION')).toBe('text-yellow-400');
      expect(getPatternColor('PUMP_AND_DUMP')).toBe('text-red-400');
      expect(getPatternColor('UNKNOWN')).toBe('text-gray-400');
    });
  });

  describe('getLiquidityColor', () => {
    it('should return correct colors for liquidity health', () => {
      expect(getLiquidityColor('EXCELLENT')).toContain('text-green-500');
      expect(getLiquidityColor('GOOD')).toBe('text-green-400');
      expect(getLiquidityColor('FAIR')).toBe('text-yellow-400');
      expect(getLiquidityColor('POOR')).toBe('text-orange-400');
      expect(getLiquidityColor('CRITICAL')).toBe('text-red-400');
      expect(getLiquidityColor('UNKNOWN')).toBe('text-gray-400');
    });
  });
});
