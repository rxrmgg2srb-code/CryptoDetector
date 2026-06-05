/**
 * 📊 Advanced P&L (Profit & Loss) Calculator
 * 
 * Provides precise calculations for trading expenses, profits, and net balance.
 * Supports multiple accounting methods and detailed per-token analysis.
 */

import { logger } from './logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Transaction {
  timestamp: number;
  type: 'buy' | 'sell';
  tokenMint: string;
  tokenSymbol?: string;
  tokenAmount: number;
  solAmount: number;
  pricePerToken: number;
  fees?: number;
  source?: string; // 'helius', 'csv', 'manual'
  signature?: string;
}

export interface TokenPnL {
  tokenMint: string;
  tokenSymbol?: string;
  
  // Buy metrics
  totalBuys: number;
  totalBuyAmount: number; // SOL spent
  totalTokensBought: number;
  avgBuyPrice: number;
  
  // Sell metrics
  totalSells: number;
  totalSellAmount: number; // SOL received
  totalTokensSold: number;
  avgSellPrice: number;
  
  // Position metrics
  remainingTokens: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  totalFees: number;
  
  // Cost basis (using selected method)
  costBasis: number;
  
  // Trading metrics
  firstTradeTimestamp: number;
  lastTradeTimestamp: number;
  holdingPeriodDays: number;
  tradeCount: number;
}

export interface PnLSummary {
  // Overall metrics
  totalExpenses: number; // Total SOL spent on buys
  totalIncome: number; // Total SOL received from sells
  netBalance: number; // Income - Expenses
  totalFees: number;
  netBalanceAfterFees: number;
  
  // Trade counts
  totalBuys: number;
  totalSells: number;
  totalTrades: number;
  
  // Per-token breakdown
  tokenBreakdown: TokenPnL[];
  
  // Top performers
  topGainers: TokenPnL[];
  topLosers: TokenPnL[];
  
  // Realized vs Unrealized
  totalRealizedPnL: number;
  totalUnrealizedPnL: number; // Would need current prices
  
  // Time range
  firstTradeDate: number;
  lastTradeDate: number;
  tradingPeriodDays: number;
}

export type AccountingMethod = 'FIFO' | 'LIFO' | 'AVERAGE_COST';

// ============================================================================
// MAIN P&L CALCULATOR
// ============================================================================

export class PnLCalculator {
  private transactions: Transaction[];
  private method: AccountingMethod;
  
  constructor(transactions: Transaction[], method: AccountingMethod = 'FIFO') {
    this.transactions = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    this.method = method;
  }
  
  /**
   * Calculate comprehensive P&L summary
   */
  calculateSummary(): PnLSummary {
    logger.info(`📊 Calculating P&L with method: ${this.method}`);
    
    // Group transactions by token
    const tokenMap = new Map<string, Transaction[]>();
    
    for (const tx of this.transactions) {
      if (!tokenMap.has(tx.tokenMint)) {
        tokenMap.set(tx.tokenMint, []);
      }
      tokenMap.get(tx.tokenMint)!.push(tx);
    }
    
    // Calculate P&L for each token
    const tokenBreakdown: TokenPnL[] = [];
    
    for (const [tokenMint, txs] of tokenMap.entries()) {
      const tokenPnL = this.calculateTokenPnL(tokenMint, txs);
      tokenBreakdown.push(tokenPnL);
    }
    
    // Calculate overall metrics
    const totalExpenses = this.transactions
      .filter(tx => tx.type === 'buy')
      .reduce((sum, tx) => sum + tx.solAmount, 0);
    
    const totalIncome = this.transactions
      .filter(tx => tx.type === 'sell')
      .reduce((sum, tx) => sum + tx.solAmount, 0);
    
    const totalFees = this.transactions
      .reduce((sum, tx) => sum + (tx.fees || 0), 0);
    
    const totalRealizedPnL = tokenBreakdown
      .reduce((sum, t) => sum + t.realizedPnL, 0);
    
    const totalBuys = this.transactions.filter(tx => tx.type === 'buy').length;
    const totalSells = this.transactions.filter(tx => tx.type === 'sell').length;
    
    // Sort for top gainers/losers
    const sortedByPnL = [...tokenBreakdown].sort((a, b) => b.realizedPnL - a.realizedPnL);
    const topGainers = sortedByPnL.filter(t => t.realizedPnL > 0).slice(0, 10);
    const topLosers = sortedByPnL.filter(t => t.realizedPnL < 0).slice(-10).reverse();
    
    // Time range
    const firstTradeDate = this.transactions[0]?.timestamp || 0;
    const lastTradeDate = this.transactions[this.transactions.length - 1]?.timestamp || 0;
    const tradingPeriodDays = Math.floor((lastTradeDate - firstTradeDate) / (24 * 3600));
    
    const summary: PnLSummary = {
      totalExpenses,
      totalIncome,
      netBalance: totalIncome - totalExpenses,
      totalFees,
      netBalanceAfterFees: totalIncome - totalExpenses - totalFees,
      totalBuys,
      totalSells,
      totalTrades: this.transactions.length,
      tokenBreakdown,
      topGainers,
      topLosers,
      totalRealizedPnL,
      totalUnrealizedPnL: 0, // Would need current prices
      firstTradeDate,
      lastTradeDate,
      tradingPeriodDays,
    };
    
    logger.info('✅ P&L Summary calculated', {
      tokens: tokenBreakdown.length,
      netBalance: summary.netBalance.toFixed(4),
      realizedPnL: summary.totalRealizedPnL.toFixed(4),
    });
    
    return summary;
  }
  
  /**
   * Calculate P&L for a specific token
   */
  private calculateTokenPnL(tokenMint: string, transactions: Transaction[]): TokenPnL {
    const buys = transactions.filter(tx => tx.type === 'buy');
    const sells = transactions.filter(tx => tx.type === 'sell');
    
    const totalBuyAmount = buys.reduce((sum, tx) => sum + tx.solAmount, 0);
    const totalSellAmount = sells.reduce((sum, tx) => sum + tx.solAmount, 0);
    const totalTokensBought = buys.reduce((sum, tx) => sum + tx.tokenAmount, 0);
    const totalTokensSold = sells.reduce((sum, tx) => sum + tx.tokenAmount, 0);
    const totalFees = transactions.reduce((sum, tx) => sum + (tx.fees || 0), 0);
    
    const avgBuyPrice = totalTokensBought > 0 ? totalBuyAmount / totalTokensBought : 0;
    const avgSellPrice = totalTokensSold > 0 ? totalSellAmount / totalTokensSold : 0;
    
    // Calculate realized P&L based on accounting method
    const { realizedPnL, costBasis } = this.calculateRealizedPnL(buys, sells);
    
    const realizedPnLPercent = costBasis > 0 ? (realizedPnL / costBasis) * 100 : 0;
    
    const firstTradeTimestamp = transactions[0]?.timestamp || 0;
    const lastTradeTimestamp = transactions[transactions.length - 1]?.timestamp || 0;
    const holdingPeriodDays = Math.floor((lastTradeTimestamp - firstTradeTimestamp) / (24 * 3600));
    
    return {
      tokenMint,
      tokenSymbol: transactions[0]?.tokenSymbol,
      totalBuys: buys.length,
      totalBuyAmount,
      totalTokensBought,
      avgBuyPrice,
      totalSells: sells.length,
      totalSellAmount,
      totalTokensSold,
      avgSellPrice,
      remainingTokens: totalTokensBought - totalTokensSold,
      realizedPnL,
      realizedPnLPercent,
      totalFees,
      costBasis,
      firstTradeTimestamp,
      lastTradeTimestamp,
      holdingPeriodDays,
      tradeCount: transactions.length,
    };
  }
  
  /**
   * Calculate realized P&L using selected accounting method
   */
  private calculateRealizedPnL(
    buys: Transaction[],
    sells: Transaction[]
  ): { realizedPnL: number; costBasis: number } {
    if (sells.length === 0) {
      return { realizedPnL: 0, costBasis: 0 };
    }
    
    switch (this.method) {
      case 'FIFO':
        return this.calculateFIFO(buys, sells);
      case 'LIFO':
        return this.calculateLIFO(buys, sells);
      case 'AVERAGE_COST':
        return this.calculateAverageCost(buys, sells);
      default:
        return this.calculateFIFO(buys, sells);
    }
  }
  
  /**
   * FIFO (First In, First Out) accounting
   */
  private calculateFIFO(
    buys: Transaction[],
    sells: Transaction[]
  ): { realizedPnL: number; costBasis: number } {
    // Deep copy to avoid modifying original transactions
    const buyQueue = buys.map(b => ({ ...b }));
    let totalCostBasis = 0;
    let totalProceeds = 0;
    
    for (const sell of sells) {
      let tokensToSell = sell.tokenAmount;
      const sellProceeds = sell.solAmount;
      totalProceeds += sellProceeds;
      
      while (tokensToSell > 0 && buyQueue.length > 0) {
        const buy = buyQueue[0];
        if (!buy) break;
        
        const tokensAvailable = buy.tokenAmount;
        const tokensToClose = Math.min(tokensToSell, tokensAvailable);
        
        // Calculate proportional cost
        const proportionalCost = (tokensToClose / buy.tokenAmount) * buy.solAmount;
        totalCostBasis += proportionalCost;
        
        // Update buy transaction (on the copy)
        buy.tokenAmount -= tokensToClose;
        buy.solAmount -= proportionalCost;
        
        if (buy.tokenAmount <= 0) {
          buyQueue.shift();
        }
        
        tokensToSell -= tokensToClose;
      }
    }
    
    return {
      realizedPnL: totalProceeds - totalCostBasis,
      costBasis: totalCostBasis,
    };
  }
  
  /**
   * LIFO (Last In, First Out) accounting
   */
  private calculateLIFO(
    buys: Transaction[],
    sells: Transaction[]
  ): { realizedPnL: number; costBasis: number } {
    // Deep copy to avoid modifying original transactions
    const buyStack = buys.map(b => ({ ...b })).reverse();
    let totalCostBasis = 0;
    let totalProceeds = 0;
    
    for (const sell of sells) {
      let tokensToSell = sell.tokenAmount;
      const sellProceeds = sell.solAmount;
      totalProceeds += sellProceeds;
      
      while (tokensToSell > 0 && buyStack.length > 0) {
        const buy = buyStack[0];
        if (!buy) break;
        
        const tokensAvailable = buy.tokenAmount;
        const tokensToClose = Math.min(tokensToSell, tokensAvailable);
        
        const proportionalCost = (tokensToClose / buy.tokenAmount) * buy.solAmount;
        totalCostBasis += proportionalCost;
        
        buy.tokenAmount -= tokensToClose;
        buy.solAmount -= proportionalCost;
        
        if (buy.tokenAmount <= 0) {
          buyStack.shift();
        }
        
        tokensToSell -= tokensToClose;
      }
    }
    
    return {
      realizedPnL: totalProceeds - totalCostBasis,
      costBasis: totalCostBasis,
    };
  }
  
  /**
   * Average Cost accounting
   */
  private calculateAverageCost(
    buys: Transaction[],
    sells: Transaction[]
  ): { realizedPnL: number; costBasis: number } {
    const totalTokensBought = buys.reduce((sum, tx) => sum + tx.tokenAmount, 0);
    const totalBuyAmount = buys.reduce((sum, tx) => sum + tx.solAmount, 0);
    const avgCostPerToken = totalTokensBought > 0 ? totalBuyAmount / totalTokensBought : 0;
    
    const totalTokensSold = sells.reduce((sum, tx) => sum + tx.tokenAmount, 0);
    const totalSellAmount = sells.reduce((sum, tx) => sum + tx.solAmount, 0);
    
    const costBasis = totalTokensSold * avgCostPerToken;
    const realizedPnL = totalSellAmount - costBasis;
    
    return { realizedPnL, costBasis };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Trade format to Transaction format
 */
export function convertTradeToTransaction(trade: {
  timestamp: number;
  tokenMint: string;
  type: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  pricePerToken: number;
}): Transaction {
  return {
    timestamp: trade.timestamp,
    type: trade.type,
    tokenMint: trade.tokenMint,
    tokenAmount: trade.tokenAmount,
    solAmount: trade.solAmount,
    pricePerToken: trade.pricePerToken,
    source: 'helius',
  };
}

/**
 * Calculate daily P&L breakdown
 */
export function calculateDailyPnL(transactions: Transaction[]): {
  date: string;
  buys: number;
  sells: number;
  netFlow: number;
  trades: number;
}[] {
  const dailyMap = new Map<string, {
    buys: number;
    sells: number;
    trades: number;
  }>();
  
  for (const tx of transactions) {
    const date = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
    if (!date) continue; // Skip if date parsing fails
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { buys: 0, sells: 0, trades: 0 });
    }
    
    const day = dailyMap.get(date);
    if (!day) continue; // Type guard
    
    day.trades++;
    
    if (tx.type === 'buy') {
      day.buys += tx.solAmount;
    } else {
      day.sells += tx.solAmount;
    }
  }
  
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      buys: data.buys,
      sells: data.sells,
      netFlow: data.sells - data.buys,
      trades: data.trades,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate ROI for each token
 */
export function calculateTokenROI(tokenPnL: TokenPnL): number {
  if (tokenPnL.totalBuyAmount === 0) return 0;
  return (tokenPnL.realizedPnL / tokenPnL.totalBuyAmount) * 100;
}
