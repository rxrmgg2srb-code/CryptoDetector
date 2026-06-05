import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';
import { CSVTransactionParser, validateCSVFile } from '@/lib/csvTransactionParser';
import { PnLCalculator } from '@/lib/pnlCalculator';
import { logger } from '@/lib/logger';
import { strictRateLimit } from '@/lib/rateLimitRedis';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  if (!(await strictRateLimit(req, res))) {
    return;
  }

  try {
    // Parse multipart form data
    const { files } = await parseForm(req);

    // Get the uploaded file
    const fileField = files.file;
    if (!fileField) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Handle both single file and array of files
    const file = Array.isArray(fileField) ? fileField[0] : fileField;
    if (!file) {
      return res.status(400).json({ error: 'Invalid file' });
    }

    // Validate file type
    if (!file.name?.endsWith('.csv')) {
      return res.status(400).json({ error: 'Only CSV files are supported' });
    }

    // Read file content
    const csvContent = fs.readFileSync(file.path, 'utf-8');

    // Validate CSV
    const validation = validateCSVFile(csvContent);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Parse CSV
    const parser = new CSVTransactionParser();
    const parseResult = parser.parse(csvContent);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Failed to parse CSV',
        details: parseResult.errors,
        warnings: parseResult.warnings,
      });
    }

    logger.info('✅ CSV parsed successfully', {
      transactions: parseResult.transactions.length,
      buys: parseResult.stats.buys,
      sells: parseResult.stats.sells,
    });

    // Calculate P&L from imported transactions
    const calculator = new PnLCalculator(parseResult.transactions);
    const pnlSummary = calculator.calculateSummary();

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    // Return results
    return res.status(200).json({
      success: true,
      stats: parseResult.stats,
      warnings: parseResult.warnings,
      pnlSummary: {
        totalExpenses: pnlSummary.totalExpenses,
        totalIncome: pnlSummary.totalIncome,
        netBalance: pnlSummary.netBalance,
        totalFees: pnlSummary.totalFees,
        netBalanceAfterFees: pnlSummary.netBalanceAfterFees,
        totalRealizedPnL: pnlSummary.totalRealizedPnL,
        totalTrades: pnlSummary.totalTrades,
        tradingPeriodDays: pnlSummary.tradingPeriodDays,
        tokensTraded: pnlSummary.tokenBreakdown.length,
      },
      topGainers: pnlSummary.topGainers.slice(0, 5).map(t => ({
        token: t.tokenMint.substring(0, 8) + '...',
        realizedPnL: t.realizedPnL,
        roi: t.realizedPnLPercent,
        trades: t.tradeCount,
      })),
      topLosers: pnlSummary.topLosers.slice(0, 5).map(t => ({
        token: t.tokenMint.substring(0, 8) + '...',
        realizedPnL: t.realizedPnL,
        roi: t.realizedPnLPercent,
        trades: t.tradeCount,
      })),
    });
  } catch (error) {
    logger.error('❌ Error importing transactions:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    return res.status(500).json({
      error: 'Failed to import transactions',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Parse multipart form data
 */
function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}
