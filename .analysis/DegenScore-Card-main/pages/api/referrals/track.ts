import type { NextApiRequest, NextApiResponse } from 'next';
import { trackReferral } from '../../../lib/referralEngine';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { referralCode } = req.body;

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const authResult = verifySessionToken(token);

    if (!authResult.valid || !authResult.wallet) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userWallet = authResult.wallet;

    if (!referralCode) {
      return res.status(400).json({ error: 'Referral code required' });
    }

    // Track the referral
    const result = await trackReferral(referralCode, userWallet);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json({
      success: true,
      message: 'Referral tracked successfully',
    });
  } catch (error) {
    logger.error('Error in track referral API:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to track referral',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
