import { describe, it, expect, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null, connected: false }),
}));

describe('useWhaleRadar', () => {
  it('should initialize hook', () => {
    const { useWhaleRadar } = require('@/hooks/useWhaleRadar');
    if (useWhaleRadar) {
      const { result } = renderHook(() => useWhaleRadar());
      expect(result.current).toBeDefined();
    }
  });
});
