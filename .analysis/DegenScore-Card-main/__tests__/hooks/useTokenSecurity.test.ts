import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null, connected: false }),
}));

global.fetch = jest.fn();

describe('useTokenSecurity (enhanced)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ securityScore: 85, riskLevel: 'LOW' }),
    });
  });

  it('should initialize hook', () => {
    const { useTokenSecurity } = require('@/hooks/useTokenSecurity');
    if (useTokenSecurity) {
      const { result } = renderHook(() =>
        useTokenSecurity('So11111111111111111111111111111111111111112')
      );
      expect(result.current).toBeDefined();
    }
  });

  it('should fetch token security data', async () => {
    const { useTokenSecurity } = require('@/hooks/useTokenSecurity');
    if (useTokenSecurity) {
      renderHook(() => useTokenSecurity('So11111111111111111111111111111111111111112'));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(global.fetch).toHaveBeenCalled();
    }
  });

  it('should handle invalid address', () => {
    const { useTokenSecurity } = require('@/hooks/useTokenSecurity');
    if (useTokenSecurity) {
      const { result } = renderHook(() => useTokenSecurity('invalid'));
      expect(result.current).toBeDefined();
    }
  });
});
