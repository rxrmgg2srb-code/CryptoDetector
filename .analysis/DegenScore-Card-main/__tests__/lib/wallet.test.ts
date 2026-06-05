import { getWalletHistory, getWalletTokens } from '@/lib/wallet';

// Mock external APIs
global.fetch = jest.fn();

describe('lib/wallet', () => {
  describe('getWalletHistory', () => {
    it('should return history', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ result: [] }),
      });
      const result = await getWalletHistory('wallet');
      expect(result).toBeDefined();
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
      await expect(getWalletHistory('wallet')).rejects.toThrow();
    });
  });

  describe('getWalletTokens', () => {
    it('should return tokens', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ result: { items: [] } }),
      });
      const result = await getWalletTokens('wallet');
      expect(result).toBeDefined();
    });
  });
});
