import { describe, it, expect } from '@jest/globals';
import { isValidSolanaAddress, validateEmail, sanitizeInput } from '@/lib/validation';

describe('Validation', () => {
  describe('isValidSolanaAddress', () => {
    it('should validate correct Solana addresses', () => {
      const validAddress = 'So11111111111111111111111111111111111111112';
      expect(isValidSolanaAddress(validAddress)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidSolanaAddress('')).toBe(false);
      expect(isValidSolanaAddress('invalid')).toBe(false);
      expect(isValidSolanaAddress('123')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(isValidSolanaAddress(null as any)).toBe(false);
      expect(isValidSolanaAddress(undefined as any)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize malicious input', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
    });

    it('should preserve safe text', () => {
      const safe = 'Hello World';
      expect(sanitizeInput(safe)).toBe(safe);
    });
  });
});
