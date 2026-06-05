import { describe, it, expect } from '@jest/globals';
import {
  formatNumber,
  formatCurrency,
  truncateAddress,
  calculatePercentage,
  formatTimeAgo,
} from '@/lib/utils';

describe('Utils', () => {
  describe('formatNumber', () => {
    it('should format large numbers with K/M/B suffixes', () => {
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(1500000000)).toBe('1.5B');
    });

    it('should format small numbers without suffix', () => {
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with $ sign', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('truncateAddress', () => {
    it('should truncate long addresses', () => {
      const address = 'So11111111111111111111111111111111111111112';
      const truncated = truncateAddress(address);

      expect(truncated).toContain('So1');
      expect(truncated).toContain('...');
      expect(truncated.length).toBeLessThan(address.length);
    });

    it('should handle short addresses', () => {
      const short = 'abc123';
      expect(truncateAddress(short)).toBe(short);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(1, 4)).toBe(25);
    });

    it('should handle zero denominator', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });
  });

  describe('formatTimeAgo', () => {
    it('should format recent times', () => {
      const now = new Date();
      const result = formatTimeAgo(now);

      expect(result).toContain('ago');
    });

    it('should format past dates', () => {
      const past = new Date(Date.now() - 86400000); // 1 day ago
      const result = formatTimeAgo(past);

      expect(result).toBeDefined();
    });
  });
});
