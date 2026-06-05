import type { NextApiRequest, NextApiResponse } from 'next';
import { getReferralStats } from '../../../lib/referralEngine';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const stats = await getReferralStats(authResult.wallet);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error getting referral stats:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to get referral stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
