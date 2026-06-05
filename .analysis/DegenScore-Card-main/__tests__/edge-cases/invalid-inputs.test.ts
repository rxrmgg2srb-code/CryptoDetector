import { validateWalletAddress } from '@/lib/validation';

describe('Edge Cases: Invalid Inputs', () => {
  it('should reject extremely long strings', () => {
    const longString = 'a'.repeat(10000);
    expect(validateWalletAddress(longString)).toBe(false);
  });

  it('should handle special characters', () => {
    expect(validateWalletAddress('!@#$%^&*()')).toBe(false);
  });

  it('should handle unicode characters', () => {
    expect(validateWalletAddress('👍')).toBe(false);
  });

  it('should handle whitespace only', () => {
    expect(validateWalletAddress('   ')).toBe(false);
  });
});
