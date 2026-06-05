import type { NextApiRequest, NextApiResponse } from 'next';
import { claimReferralRewards } from '../../../lib/referralEngine';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    const result = await claimReferralRewards(authResult.wallet);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json({
      success: true,
      amount: result.amount,
      message: `Claimed ${result.amount} $DEGEN tokens`,
    });
  } catch (error) {
    logger.error('Error claiming referral rewards:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to claim rewards',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
