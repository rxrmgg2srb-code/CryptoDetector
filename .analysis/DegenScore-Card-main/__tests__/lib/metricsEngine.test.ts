import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { calculateAdvancedMetrics } from '@/lib/metricsEngine';

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('MetricsEngine', () => {
  const mockWalletData = {
    totalTransactions: 100,
    successfulTransactions: 90,
    failedTransactions: 10,
    totalVolumeSOL: 1000,
    avgTransactionSize: 10,
    uniqueInteractions: 50,
    nftCount: 25,
    tokenCount: 15,
    defiInteractions: 30,
    stakingAmount: 500,
  };

  it('should calculate advanced metrics successfully', async () => {
    const result = await calculateAdvancedMetrics(mockWalletData);

    expect(result).toBeDefined();
    expect(typeof result.degenScore).toBe('number');
    expect(result.degenScore).toBeGreaterThanOrEqual(0);
    expect(result.degenScore).toBeLessThanOrEqual(100);
  });

  it('should handle missing data gracefully', async () => {
    const minimalData = {
      totalTransactions: 10,
      successfulTransactions: 8,
      failedTransactions: 2,
    };

    const result = await calculateAdvancedMetrics(minimalData);

    expect(result).toBeDefined();
    expect(typeof result.degenScore).toBe('number');
  });

  it('should return metrics with expected structure', async () => {
    const result = await calculateAdvancedMetrics(mockWalletData);

    expect(result).toHaveProperty('degenScore');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('metrics');
  });
});
