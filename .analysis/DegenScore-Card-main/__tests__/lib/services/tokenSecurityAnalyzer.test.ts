import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Connection, PublicKey } from '@solana/web3.js';
import { analyzeTokenSecurity } from '@/lib/services/tokenSecurityAnalyzer';

// Create shared mock function
const mockGetParsedAccountInfo = jest.fn();

// Mocks
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getParsedAccountInfo: mockGetParsedAccountInfo,
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

// Mock global fetch
global.fetch = jest.fn();

describe('TokenSecurityAnalyzer', () => {
  const mockTokenAddress = 'So11111111111111111111111111111111111111112';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Connection methods
    mockGetParsedAccountInfo.mockResolvedValue({
      value: {
        data: {
          parsed: {
            info: {
              mintAuthority: null,
              freezeAuthority: null,
              decimals: 9,
              supply: '1000000000000000',
            },
          },
        },
      },
    });

    // Mock fetch responses with default data
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('should analyze a token and return a report', async () => {
    const result = await analyzeTokenSecurity(mockTokenAddress);

    expect(result).toBeDefined();
    expect(result.tokenAddress).toBe(mockTokenAddress);
    expect(result.securityScore).toBeGreaterThanOrEqual(0);
    expect(result.riskLevel).toBeDefined();
    expect(result.tokenAuthorities).toBeDefined();
    expect(result.tokenAuthorities.hasMintAuthority).toBe(false);
    expect(result.tokenAuthorities.hasFreezeAuthority).toBe(false);
    expect(result.tokenAuthorities.riskLevel).toBe('LOW');
  });

  it('should detect risky authorities', async () => {
    mockGetParsedAccountInfo.mockResolvedValue({
      value: {
        data: {
          parsed: {
            info: {
              mintAuthority: 'auth123',
              freezeAuthority: 'auth123',
              decimals: 9,
              supply: '1000000000000000',
            },
          },
        },
      },
    });

    const result = await analyzeTokenSecurity(mockTokenAddress);

    expect(result.tokenAuthorities.riskLevel).toBe('CRITICAL');
    expect(result.tokenAuthorities.hasMintAuthority).toBe(true);
    expect(result.tokenAuthorities.hasFreezeAuthority).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    const result = await analyzeTokenSecurity(mockTokenAddress);

    expect(result).toBeDefined();
    expect(result.tokenAddress).toBe(mockTokenAddress);
  });

  it('should report progress via callback', async () => {
    const onProgress = jest.fn();
    await analyzeTokenSecurity(mockTokenAddress, onProgress);

    expect(onProgress).toHaveBeenCalled();
  });
});
