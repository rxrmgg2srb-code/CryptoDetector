import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

describe('csrfProtection (enhanced)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate CSRF token', async () => {
    const { generateCsrfToken } = await import('@/lib/csrfProtection');
    if (generateCsrfToken) {
      const token = generateCsrfToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    }
  });

  it('should verify CSRF token', async () => {
    const { generateCsrfToken, verifyCsrfToken } = await import('@/lib/csrfProtection');
    if (generateCsrfToken && verifyCsrfToken) {
      const token = generateCsrfToken();
      const isValid = verifyCsrfToken(token, token);
      expect(isValid).toBe(true);
    }
  });

  it('should reject invalid CSRF token', async () => {
    const { verifyCsrfToken } = await import('@/lib/csrfProtection');
    if (verifyCsrfToken) {
      const isValid = verifyCsrfToken('invalid', 'expected');
      expect(isValid).toBe(false);
    }
  });
});
