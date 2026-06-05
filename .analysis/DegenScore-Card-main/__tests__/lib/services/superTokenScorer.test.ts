import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Connection, PublicKey } from '@solana/web3.js';
import { analyzeSuperTokenScore } from '@/lib/services/superTokenScorer';
import { analyzeTokenSecurity } from '@/lib/services/tokenSecurityAnalyzer';

// Mocks
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getSignaturesForAddress: jest.fn().mockResolvedValue([]),
    getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({ value: [] }),
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toBase58: () => key,
    toString: () => key,
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/lib/retryLogic', () => ({
  __esModule: true,
  retry: jest.fn((fn) => Promise.resolve(fn())),
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    execute: jest.fn((fn) => Promise.resolve(fn())),
  })),
}));

jest.mock('@/lib/services/tokenSecurityAnalyzer', () => ({
  __esModule: true,
  analyzeTokenSecurity: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('SuperTokenScorer Service', () => {
  const mockTokenAddress = 'So11111111111111111111111111111111111111112';

  const mockBaseSecurityReport = {
    securityScore: 85,
    riskLevel: 'LOW',
    metadata: {
      name: 'Test Token',
      symbol: 'TEST',
      supply: 1000000,
    },
    tokenAuthorities: {
      isRevoked: true,
      hasMintAuthority: false,
      hasFreezeAuthority: false,
    },
    liquidityAnalysis: {
      lpBurned: true,
    },
    redFlags: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      flags: [],
    },
    greenFlags: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (analyzeTokenSecurity as jest.Mock).mockResolvedValue(mockBaseSecurityReport);

    // Default successful fetch mocks
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('rugcheck')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ score: 100, risks: [], rugged: false, lpBurned: true }),
          });
        }
        if (url.includes('dexscreener')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                pairs: [
                  {
                    pairAddress: 'pair123',
                    dexId: 'raydium',
                    priceUsd: '1.00',
                    volume: { h24: 100000 },
                    liquidity: { usd: 50000 },
                    fdv: 1000000,
                    priceChange: { h24: 5, h7: 10, h30: 20 },
                    txns: { h24: { buys: 100, sells: 80 } },
                    holders: 500,
                    marketCap: 1000000,
                  },
                ],
              }),
          });
        }
        if (url.includes('birdeye')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  address: mockTokenAddress,
                  symbol: 'TEST',
                  value: 1.0,
                  liquidity: 50000,
                  v24hUSD: 100000,
                  holder: 500,
                  supply: 1000000,
                },
              }),
          });
        }
        if (url.includes('solscan')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                address: mockTokenAddress,
                symbol: 'TEST',
                holder: 500,
                marketCapUsdt: 1000000,
              }),
          });
        }
        if (url.includes('jup.ag')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                routePlan: [{ swapInfo: { label: 'Raydium' } }],
              }),
          });
        }
        // Helius RPC mocks
        if (url.includes('helius-rpc')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                result: {
                  total: 500,
                  token_accounts: Array(10).fill({
                    owner: 'wallet123',
                    amount: '1000',
                  }),
                },
              }),
          });
        }
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('should analyze token score successfully with all data sources', async () => {
    const onProgress = jest.fn();

    const result = await analyzeSuperTokenScore(mockTokenAddress, onProgress);

    expect(result).toBeDefined();
    expect(result.tokenAddress).toBe(mockTokenAddress);
    expect(result.superScore).toBeGreaterThan(0);
    expect(result.globalRiskLevel).toBeDefined();
    expect(analyzeTokenSecurity).toHaveBeenCalledWith(mockTokenAddress);
    expect(onProgress).toHaveBeenCalled();
    expect(result.rugCheckData).toBeDefined();
    expect(result.dexScreenerData).toBeDefined();
  });

  it('should handle API failures gracefully', async () => {
    // Mock APIs failing
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: false, status: 500 })
    );

    const result = await analyzeSuperTokenScore(mockTokenAddress);

    expect(result).toBeDefined();
    expect(result.superScore).toBeGreaterThanOrEqual(0);
    // Should still have base report data
    expect(result.baseSecurityReport).toEqual(mockBaseSecurityReport);
    // External data should be undefined
    expect(result.rugCheckData).toBeUndefined();
    expect(result.dexScreenerData).toBeUndefined();
  });

  it('should calculate scores correctly based on data', async () => {
    const result = await analyzeSuperTokenScore(mockTokenAddress);

    // Check breakdown structure
    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.baseSecurityScore).toBe('number');
    expect(typeof result.scoreBreakdown.volumeScore).toBe('number');
    expect(typeof result.scoreBreakdown.liquidityDepthScore).toBe('number');
  });

  it('should identify red flags', async () => {
    // Mock risky data
    (analyzeTokenSecurity as jest.Mock).mockResolvedValue({
      ...mockBaseSecurityReport,
      riskLevel: 'CRITICAL',
      securityScore: 20,
    });

    const result = await analyzeSuperTokenScore(mockTokenAddress);

    expect(result.allRedFlags.length).toBeGreaterThan(0);
    expect(result.globalRiskLevel).not.toBe('ULTRA_SAFE');
  });
});
