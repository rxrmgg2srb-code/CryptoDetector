import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { isValidSolanaAddress } from '../../lib/validation';
import { enqueueCardGeneration } from '../../lib/queue';
import { rateLimit } from '../../lib/rateLimitRedis';
import { logger } from '../../lib/logger';

/**
 * API endpoint to start async card generation
 * Returns a job ID that can be polled for status
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  if (!(await rateLimit(req, res))) {
    return;
  }

  try {
    const { walletAddress } = req.body;

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    logger.debug('Async card generation request:', { walletAddress });

    // Check if card exists in database
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
      select: {
        walletAddress: true,
        isPaid: true,
      },
    });

    if (!card) {
      return res.status(404).json({
        error: 'Card not found',
        message: 'Please analyze this wallet first before generating a card',
      });
    }

    // Enqueue card generation job
    const jobId = await enqueueCardGeneration(walletAddress, card.isPaid);

    logger.info('Card generation job created:', { walletAddress, jobId });

    res.status(202).json({
      success: true,
      message: 'Card generation started',
      jobId,
      walletAddress,
      pollUrl: `/api/card-status?jobId=${jobId}`,
      estimatedTime: card.isPaid ? '10-20 seconds' : '20-40 seconds',
    });
  } catch (error: any) {
    logger.error(
      'Error starting async card generation:',
      error instanceof Error ? error : undefined,
      {
        error: String(error),
      }
    );

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to start card generation';

    res.status(500).json({ error: errorMessage });
  }
}
