import type { NextApiRequest, NextApiResponse } from 'next';
import { generateAuthChallenge } from '../../../lib/walletAuth';
import { isValidSolanaAddress } from '../../../lib/validation';
import { rateLimit } from '../../../lib/rateLimit';
import { logger } from '../../../lib/logger';

/**
 * Generate authentication challenge for wallet signature
 * POST /api/auth/challenge
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
    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    logger.debug('Generating auth challenge for:', { walletAddress });

    // Generate challenge
    const challenge = generateAuthChallenge(walletAddress);

    res.status(200).json({
      success: true,
      challenge,
    });
  } catch (error: any) {
    logger.error('Error generating auth challenge:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Failed to generate authentication challenge';

    res.status(500).json({ error: errorMessage });
  }
}
