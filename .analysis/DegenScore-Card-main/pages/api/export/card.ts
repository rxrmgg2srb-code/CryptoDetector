import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { isValidSolanaAddress } from '../../../lib/validation';
import {
  cardToExportable,
  convertToCSV,
  convertToJSON,
  generateFileName,
} from '../../../lib/exportHelpers';
import { rateLimit } from '../../../lib/rateLimit';
import { logger } from '../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  if (!(await rateLimit(req, res))) {
    return;
  }

  try {
    const { walletAddress, format = 'json' } = req.query;

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Validate format
    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format as string)) {
      return res.status(400).json({ error: 'Invalid format. Use: json, csv' });
    }

    logger.debug('Export request:', { walletAddress, format });

    // Fetch card data
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
      include: {
        badges: {
          select: {
            name: true,
            rarity: true,
            icon: true,
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Convert to exportable format
    const exportData = cardToExportable(card);
    const fileName = generateFileName(walletAddress, format as string);

    // Generate export based on format
    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(csv);
    }

    if (format === 'json') {
      const json = convertToJSON(exportData);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(json);
    }

    return res.status(400).json({ error: 'Unsupported format' });
  } catch (error: any) {
    logger.error('Error exporting card data:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to export card data';

    res.status(500).json({ error: errorMessage });
  }
}
