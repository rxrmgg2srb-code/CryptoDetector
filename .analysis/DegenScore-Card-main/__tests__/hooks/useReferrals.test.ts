import { describe, it, expect, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null, connected: false }),
}));

describe('useReferrals', () => {
  it('should initialize hook', () => {
    const { useReferrals } = require('@/hooks/useReferrals');
    if (useReferrals) {
      const { result } = renderHook(() => useReferrals());
      expect(result.current).toBeDefined();
    }
  });
});
