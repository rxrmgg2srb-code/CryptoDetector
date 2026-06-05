/**
 * Tests for P&L Calculator
 */

import {
  PnLCalculator,
  convertTradeToTransaction,
  calculateDailyPnL,
  calculateTokenROI,
  type Transaction,
  type TokenPnL,
} from '@/lib/pnlCalculator';

describe('PnLCalculator', () => {
  describe('Basic P&L Calculation', () => {
    it('should calculate P&L for simple buy-sell scenario', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
          source: 'helius',
        },
        {
          timestamp: 2000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
          source: 'helius',
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      expect(summary.totalExpenses).toBe(1);
      expect(summary.totalIncome).toBe(2);
      expect(summary.netBalance).toBe(1);
      expect(summary.totalRealizedPnL).toBe(1);
      expect(summary.totalBuys).toBe(1);
      expect(summary.totalSells).toBe(1);
    });

    it('should handle multiple buys and sells', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 2000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
        {
          timestamp: 3000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 150,
          solAmount: 3,
          pricePerToken: 0.02,
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      // Total expenses is sum of all buy SOL amounts: 1 + 2 = 3
      expect(summary.totalExpenses).toBe(3);
      expect(summary.totalIncome).toBe(3);
      expect(summary.totalBuys).toBe(2);
      expect(summary.totalSells).toBe(1);
      // Net balance should be 0 (income - expenses)
      expect(summary.netBalance).toBe(0);
    });

    it('should calculate fees correctly', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
          fees: 0.001,
        },
        {
          timestamp: 2000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
          fees: 0.002,
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      expect(summary.totalFees).toBe(0.003);
      // Net balance = income - expenses = 2 - 1 = 1
      // After fees = 1 - 0.003 = 0.997
      expect(summary.netBalanceAfterFees).toBeCloseTo(0.997, 3);
    });
  });

  describe('FIFO Accounting', () => {
    it('should use FIFO to match sells with buys', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 2000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 3,
          pricePerToken: 0.03,
        },
        {
          timestamp: 3000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
      ];

      const calculator = new PnLCalculator(transactions, 'FIFO');
      const summary = calculator.calculateSummary();

      // First buy at 1 SOL, sold at 2 SOL = 1 SOL profit
      expect(summary.totalRealizedPnL).toBe(1);
    });

    it('should handle partial position closes with FIFO', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 2000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 50,
          solAmount: 1,
          pricePerToken: 0.02,
        },
      ];

      const calculator = new PnLCalculator(transactions, 'FIFO');
      const summary = calculator.calculateSummary();

      // Half of 1 SOL cost (0.5) sold for 1 SOL = 0.5 profit
      expect(summary.totalRealizedPnL).toBe(0.5);
      expect(summary.tokenBreakdown[0]?.remainingTokens).toBe(50);
    });
  });

  describe('LIFO Accounting', () => {
    it('should use LIFO to match sells with buys', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 2000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 3,
          pricePerToken: 0.03,
        },
        {
          timestamp: 3000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
      ];

      const calculator = new PnLCalculator(transactions, 'LIFO');
      const summary = calculator.calculateSummary();

      // Last buy at 3 SOL, sold at 2 SOL = -1 SOL loss
      expect(summary.totalRealizedPnL).toBe(-1);
    });
  });

  describe('Average Cost Accounting', () => {
    it('should use average cost to calculate P&L', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 2000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 3,
          pricePerToken: 0.03,
        },
        {
          timestamp: 3000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
      ];

      const calculator = new PnLCalculator(transactions, 'AVERAGE_COST');
      const summary = calculator.calculateSummary();

      // Average cost: (1 + 3) / 200 = 0.02 per token
      // Sell 100 tokens: cost basis = 100 * 0.02 = 2
      // Proceeds = 2, P&L = 2 - 2 = 0
      expect(summary.totalRealizedPnL).toBe(0);
    });
  });

  describe('Multiple Tokens', () => {
    it('should calculate P&L for multiple tokens independently', () => {
      const transactions: Transaction[] = [
        // TOKEN1: buy 1 SOL, sell 2 SOL = +1 profit
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 2000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
        // TOKEN2: buy 3 SOL, sell 2 SOL = -1 loss
        {
          timestamp: 3000,
          type: 'buy',
          tokenMint: 'TOKEN2',
          tokenAmount: 100,
          solAmount: 3,
          pricePerToken: 0.03,
        },
        {
          timestamp: 4000,
          type: 'sell',
          tokenMint: 'TOKEN2',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      expect(summary.tokenBreakdown.length).toBe(2);
      expect(summary.totalRealizedPnL).toBe(0); // +1 - 1 = 0

      const token1 = summary.tokenBreakdown.find(t => t.tokenMint === 'TOKEN1');
      const token2 = summary.tokenBreakdown.find(t => t.tokenMint === 'TOKEN2');

      expect(token1?.realizedPnL).toBe(1);
      expect(token2?.realizedPnL).toBe(-1);
    });

    it('should identify top gainers and losers', () => {
      const transactions: Transaction[] = [
        // Winner
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'WINNER',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 2000,
          type: 'sell',
          tokenMint: 'WINNER',
          tokenAmount: 100,
          solAmount: 10,
          pricePerToken: 0.1,
        },
        // Loser
        {
          timestamp: 3000,
          type: 'buy',
          tokenMint: 'LOSER',
          tokenAmount: 100,
          solAmount: 10,
          pricePerToken: 0.1,
        },
        {
          timestamp: 4000,
          type: 'sell',
          tokenMint: 'LOSER',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      expect(summary.topGainers.length).toBeGreaterThan(0);
      expect(summary.topLosers.length).toBeGreaterThan(0);
      expect(summary.topGainers[0]?.tokenMint).toBe('WINNER');
      expect(summary.topLosers[0]?.tokenMint).toBe('LOSER');
    });
  });

  describe('Token Metrics', () => {
    it('should calculate average buy and sell prices', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 2000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 3,
          pricePerToken: 0.03,
        },
        {
          timestamp: 3000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
        {
          timestamp: 4000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 4,
          pricePerToken: 0.04,
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      const token = summary.tokenBreakdown[0];
      expect(token?.avgBuyPrice).toBe(0.02); // (1+3)/200
      expect(token?.avgSellPrice).toBe(0.03); // (2+4)/200
    });

    it('should calculate holding period', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: 1000 + 86400 * 10, // 10 days later
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      const token = summary.tokenBreakdown[0];
      expect(token?.holdingPeriodDays).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty transactions', () => {
      const calculator = new PnLCalculator([]);
      const summary = calculator.calculateSummary();

      expect(summary.totalTrades).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.totalIncome).toBe(0);
      expect(summary.netBalance).toBe(0);
    });

    it('should handle only buys (no sells)', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      expect(summary.totalExpenses).toBe(1);
      expect(summary.totalIncome).toBe(0);
      expect(summary.netBalance).toBe(-1);
      expect(summary.totalRealizedPnL).toBe(0); // No realized P&L without sells
    });

    it('should handle sells without prior buys', () => {
      const transactions: Transaction[] = [
        {
          timestamp: 1000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
      ];

      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();

      expect(summary.totalIncome).toBe(2);
      expect(summary.totalExpenses).toBe(0);
      // When selling without prior buys (cost basis = 0),
      // realized P&L = proceeds - cost = 2 - 0 = 2
      // This represents the full sale proceeds as realized gain
      expect(summary.totalRealizedPnL).toBe(2);
      expect(summary.netBalance).toBe(2); // income - expenses = 2 - 0
    });
  });

  describe('Helper Functions', () => {
    it('convertTradeToTransaction should convert trade format', () => {
      const trade = {
        timestamp: 1000,
        tokenMint: 'TOKEN1',
        type: 'buy' as const,
        solAmount: 1,
        tokenAmount: 100,
        pricePerToken: 0.01,
      };

      const transaction = convertTradeToTransaction(trade);

      expect(transaction.timestamp).toBe(1000);
      expect(transaction.type).toBe('buy');
      expect(transaction.tokenMint).toBe('TOKEN1');
      expect(transaction.source).toBe('helius');
    });

    it('calculateDailyPnL should group by day', () => {
      const transactions: Transaction[] = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z').getTime() / 1000,
          type: 'buy',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 1,
          pricePerToken: 0.01,
        },
        {
          timestamp: new Date('2024-01-01T14:00:00Z').getTime() / 1000,
          type: 'sell',
          tokenMint: 'TOKEN1',
          tokenAmount: 100,
          solAmount: 2,
          pricePerToken: 0.02,
        },
        {
          timestamp: new Date('2024-01-02T10:00:00Z').getTime() / 1000,
          type: 'buy',
          tokenMint: 'TOKEN2',
          tokenAmount: 100,
          solAmount: 3,
          pricePerToken: 0.03,
        },
      ];

      const daily = calculateDailyPnL(transactions);

      expect(daily.length).toBe(2);
      expect(daily[0]?.date).toBe('2024-01-01');
      expect(daily[0]?.buys).toBe(1);
      expect(daily[0]?.sells).toBe(2);
      expect(daily[0]?.netFlow).toBe(1); // 2 - 1
      expect(daily[0]?.trades).toBe(2);
      expect(daily[1]?.date).toBe('2024-01-02');
    });

    it('calculateTokenROI should calculate ROI percentage', () => {
      const tokenPnL: TokenPnL = {
        tokenMint: 'TOKEN1',
        totalBuys: 1,
        totalBuyAmount: 10,
        totalTokensBought: 100,
        avgBuyPrice: 0.1,
        totalSells: 1,
        totalSellAmount: 20,
        totalTokensSold: 100,
        avgSellPrice: 0.2,
        remainingTokens: 0,
        realizedPnL: 10,
        realizedPnLPercent: 100,
        totalFees: 0,
        costBasis: 10,
        firstTradeTimestamp: 1000,
        lastTradeTimestamp: 2000,
        holdingPeriodDays: 0,
        tradeCount: 2,
      };

      const roi = calculateTokenROI(tokenPnL);
      expect(roi).toBe(100); // 10/10 * 100 = 100%
    });
  });

  describe('Performance', () => {
    it('should handle large number of transactions efficiently', () => {
      const transactions: Transaction[] = [];

      // Generate 1000 transactions
      for (let i = 0; i < 1000; i++) {
        transactions.push({
          timestamp: 1000 + i * 60,
          type: i % 2 === 0 ? 'buy' : 'sell',
          tokenMint: `TOKEN${i % 10}`,
          tokenAmount: 100,
          solAmount: 1 + Math.random(),
          pricePerToken: 0.01 + Math.random() * 0.01,
        });
      }

      const start = Date.now();
      const calculator = new PnLCalculator(transactions);
      const summary = calculator.calculateSummary();
      const duration = Date.now() - start;

      expect(summary.totalTrades).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
