import type { NextApiRequest, NextApiResponse } from 'next';
import { getWalletTransactions } from '@/lib/services/helius';
import { PnLCalculator, convertTradeToTransaction, calculateDailyPnL, calculateTokenROI } from '@/lib/pnlCalculator';
import { logger } from '@/lib/logger';
import { isValidSolanaAddress } from '@/lib/validation';
import { strictRateLimit } from '@/lib/rateLimitRedis';
import { cacheGet, cacheSet } from '@/lib/cache/redis';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  if (!(await strictRateLimit(req, res))) {
    return;
  }

  try {
    const { wallet, method = 'FIFO', includeDaily = 'false' } = req.query;

    // Validate wallet address
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Validate accounting method
    const accountingMethod = String(method).toUpperCase();
    if (!['FIFO', 'LIFO', 'AVERAGE_COST'].includes(accountingMethod)) {
      return res.status(400).json({
        error: 'Invalid accounting method. Use: FIFO, LIFO, or AVERAGE_COST',
      });
    }

    logger.info('📊 Generating P&L report', { wallet, method: accountingMethod });

    // Check cache (5 minutes for P&L reports)
    const cacheKey = `pnl:${wallet}:${accountingMethod}:${includeDaily}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      logger.info('✅ Returning cached P&L report');
      return res.status(200).json({ ...cached, cached: true });
    }

    // Fetch transactions from Helius
    const transactions = await fetchTransactions(wallet);

    if (transactions.length === 0) {
      return res.status(200).json({
        wallet,
        method: accountingMethod,
        message: 'No trading activity found',
        summary: {
          totalExpenses: 0,
          totalIncome: 0,
          netBalance: 0,
          totalFees: 0,
          totalTrades: 0,
        },
        tokenBreakdown: [],
      });
    }

    // Convert to Transaction format
    const transactionList = transactions.map(convertTradeToTransaction);

    // Calculate P&L
    const calculator = new PnLCalculator(
      transactionList,
      accountingMethod as 'FIFO' | 'LIFO' | 'AVERAGE_COST'
    );
    const summary = calculator.calculateSummary();

    // Prepare response
    const response: any = {
      wallet,
      method: accountingMethod,
      summary: {
        totalExpenses: summary.totalExpenses,
        totalIncome: summary.totalIncome,
        netBalance: summary.netBalance,
        totalFees: summary.totalFees,
        netBalanceAfterFees: summary.netBalanceAfterFees,
        totalRealizedPnL: summary.totalRealizedPnL,
        totalBuys: summary.totalBuys,
        totalSells: summary.totalSells,
        totalTrades: summary.totalTrades,
        tradingPeriodDays: summary.tradingPeriodDays,
        firstTradeDate: new Date(summary.firstTradeDate * 1000).toISOString(),
        lastTradeDate: new Date(summary.lastTradeDate * 1000).toISOString(),
      },
      tokenBreakdown: summary.tokenBreakdown.map(token => ({
        tokenMint: token.tokenMint,
        tokenSymbol: token.tokenSymbol || token.tokenMint.substring(0, 8) + '...',
        
        // Buy metrics
        totalBuys: token.totalBuys,
        totalBuyAmount: parseFloat(token.totalBuyAmount.toFixed(6)),
        totalTokensBought: parseFloat(token.totalTokensBought.toFixed(2)),
        avgBuyPrice: parseFloat(token.avgBuyPrice.toFixed(9)),
        
        // Sell metrics
        totalSells: token.totalSells,
        totalSellAmount: parseFloat(token.totalSellAmount.toFixed(6)),
        totalTokensSold: parseFloat(token.totalTokensSold.toFixed(2)),
        avgSellPrice: parseFloat(token.avgSellPrice.toFixed(9)),
        
        // Position metrics
        remainingTokens: parseFloat(token.remainingTokens.toFixed(2)),
        realizedPnL: parseFloat(token.realizedPnL.toFixed(6)),
        realizedPnLPercent: parseFloat(token.realizedPnLPercent.toFixed(2)),
        roi: parseFloat(calculateTokenROI(token).toFixed(2)),
        totalFees: parseFloat(token.totalFees.toFixed(6)),
        
        // Time metrics
        holdingPeriodDays: token.holdingPeriodDays,
        tradeCount: token.tradeCount,
        firstTrade: new Date(token.firstTradeTimestamp * 1000).toISOString(),
        lastTrade: new Date(token.lastTradeTimestamp * 1000).toISOString(),
      })).sort((a, b) => b.realizedPnL - a.realizedPnL),
      topGainers: summary.topGainers.slice(0, 10).map(token => ({
        tokenMint: token.tokenMint,
        tokenSymbol: token.tokenSymbol || token.tokenMint.substring(0, 8) + '...',
        realizedPnL: parseFloat(token.realizedPnL.toFixed(6)),
        roi: parseFloat(calculateTokenROI(token).toFixed(2)),
        trades: token.tradeCount,
      })),
      topLosers: summary.topLosers.slice(0, 10).map(token => ({
        tokenMint: token.tokenMint,
        tokenSymbol: token.tokenSymbol || token.tokenMint.substring(0, 8) + '...',
        realizedPnL: parseFloat(token.realizedPnL.toFixed(6)),
        roi: parseFloat(calculateTokenROI(token).toFixed(2)),
        trades: token.tradeCount,
      })),
    };

    // Add daily breakdown if requested
    if (includeDaily === 'true') {
      response.dailyBreakdown = calculateDailyPnL(transactionList).map(day => ({
        date: day.date,
        buys: parseFloat(day.buys.toFixed(6)),
        sells: parseFloat(day.sells.toFixed(6)),
        netFlow: parseFloat(day.netFlow.toFixed(6)),
        trades: day.trades,
      }));
    }

    // Cache the result (5 minutes = 300 seconds)
    await cacheSet(cacheKey, response, { ttl: 300 });

    logger.info('✅ P&L report generated', {
      tokens: response.tokenBreakdown.length,
      netBalance: response.summary.netBalance,
    });

    return res.status(200).json(response);
  } catch (error) {
    logger.error('❌ Error generating P&L report:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    return res.status(500).json({
      error: 'Failed to generate P&L report',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Fetch and extract trades from Helius
 */
async function fetchTransactions(walletAddress: string) {
  const allTransactions: any[] = [];
  let before: string | undefined;
  let fetchCount = 0;
  const MAX_BATCHES = 50;
  const BATCH_SIZE = 100;

  while (fetchCount < MAX_BATCHES) {
    try {
      const batch = await getWalletTransactions(walletAddress, BATCH_SIZE, before);

      if (batch.length === 0) break;
      
      // Filter for SWAP transactions only and add to our collection
      const swaps = batch.filter(tx => tx.type === 'SWAP');
      allTransactions.push(...swaps);
      before = batch[batch.length - 1]?.signature;
      fetchCount++;

      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error: any) {
      // Handle 404 continuation signature
      if (error?.status === 404) {
        let continuationSignature: string | null = null;

        if (error?.errorBody) {
          try {
            const errorJson = JSON.parse(error.errorBody);
            if (errorJson?.error) {
              const match = errorJson.error.match(/before.*parameter set to ([a-zA-Z0-9]+)/);
              if (match?.[1]) {
                continuationSignature = match[1];
              }
            }
          } catch (e) {
            // Continue
          }
        }

        if (continuationSignature) {
          before = continuationSignature;
          fetchCount++;
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
      }

      break;
    }
  }

  // Extract trades from transactions
  const trades: any[] = [];

  for (const tx of allTransactions) {
    if (!tx.tokenTransfers?.length || !tx.nativeTransfers?.length) continue;

    // Calculate SOL net change
    let solNet = 0;
    for (const nt of tx.nativeTransfers) {
      if (nt.fromUserAccount === walletAddress) {
        solNet -= nt.amount / 1e9;
      }
      if (nt.toUserAccount === walletAddress) {
        solNet += nt.amount / 1e9;
      }
    }

    if (Math.abs(solNet) < 0.0001) continue; // Skip dust

    // Get token transfers (excluding SOL)
    const tokenTransfers = tx.tokenTransfers.filter(
      (t: any) =>
        t.mint !== SOL_MINT &&
        (t.fromUserAccount === walletAddress || t.toUserAccount === walletAddress)
    );

    if (tokenTransfers.length === 0) continue;

    // Calculate net token balance per mint
    const tokenBalances = new Map<string, number>();
    for (const transfer of tokenTransfers) {
      const current = tokenBalances.get(transfer.mint) || 0;
      if (transfer.toUserAccount === walletAddress) {
        tokenBalances.set(transfer.mint, current + transfer.tokenAmount);
      }
      if (transfer.fromUserAccount === walletAddress) {
        tokenBalances.set(transfer.mint, current - transfer.tokenAmount);
      }
    }

    // Find primary token
    let primaryMint = '';
    let primaryNet = 0;
    for (const [mint, net] of tokenBalances.entries()) {
      if (Math.abs(net) > Math.abs(primaryNet)) {
        primaryMint = mint;
        primaryNet = net;
      }
    }

    if (!primaryMint || primaryNet === 0) continue;

    // Determine buy/sell
    const isBuy = solNet < 0 && primaryNet > 0;
    const isSell = solNet > 0 && primaryNet < 0;

    if (!isBuy && !isSell) continue;

    const tokenAmount = Math.abs(primaryNet);
    const solAmount = Math.abs(solNet);
    const pricePerToken = solAmount / tokenAmount;

    // Sanity checks
    if (pricePerToken < 0.000000001 || pricePerToken > 1000000) continue;
    if (solAmount > 1000) continue;

    trades.push({
      timestamp: tx.timestamp,
      tokenMint: primaryMint,
      type: isBuy ? 'buy' : 'sell',
      solAmount,
      tokenAmount,
      pricePerToken,
    });
  }

  return trades;
}
