import type { NextApiRequest, NextApiResponse } from 'next';
import { getWalletTransactions } from '@/lib/services/helius';
import { logger } from '@/lib/logger';
import { isValidSolanaAddress } from '@/lib/validation';
import { strictRateLimit } from '@/lib/rateLimitRedis';

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
    const { wallet, format = 'csv' } = req.query;

    // Validate wallet address
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Validate format
    if (format !== 'csv' && format !== 'json') {
      return res.status(400).json({ error: 'Invalid format. Use: csv or json' });
    }

    logger.info('📥 Exporting transactions', { wallet, format });

    // Fetch transactions
    const transactions = await fetchTransactions(wallet);

    if (transactions.length === 0) {
      return res.status(200).json({
        wallet,
        message: 'No transactions found',
        transactions: [],
      });
    }

    // Export based on format
    if (format === 'csv') {
      const csv = convertToCSV(transactions);
      const filename = `transactions_${wallet.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    } else {
      const filename = `transactions_${wallet.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).json({
        wallet,
        exportDate: new Date().toISOString(),
        transactionCount: transactions.length,
        transactions,
      });
    }
  } catch (error) {
    logger.error('❌ Error exporting transactions:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    return res.status(500).json({
      error: 'Failed to export transactions',
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
      timestamp: new Date(tx.timestamp * 1000).toISOString(),
      unixTimestamp: tx.timestamp,
      type: isBuy ? 'buy' : 'sell',
      tokenMint: primaryMint,
      tokenAmount: tokenAmount.toFixed(6),
      solAmount: solAmount.toFixed(6),
      pricePerToken: pricePerToken.toFixed(12),
      fee: (tx.fee / 1e9).toFixed(6),
      signature: tx.signature,
      source: tx.source || 'UNKNOWN',
    });
  }

  return trades.sort((a, b) => a.unixTimestamp - b.unixTimestamp);
}

/**
 * Convert transactions to CSV format
 */
function convertToCSV(transactions: any[]): string {
  if (transactions.length === 0) {
    return 'timestamp,type,token,amount,price,fee,signature\n';
  }

  // CSV header
  const headers = [
    'timestamp',
    'type',
    'token',
    'amount',
    'price',
    'fee',
    'signature',
    'source',
  ];

  // CSV rows
  const rows = transactions.map(tx => {
    return [
      tx.timestamp,
      tx.type,
      tx.tokenMint,
      tx.tokenAmount,
      tx.solAmount,
      tx.fee,
      tx.signature,
      tx.source,
    ]
      .map(value => {
        // Escape values with commas or quotes
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
