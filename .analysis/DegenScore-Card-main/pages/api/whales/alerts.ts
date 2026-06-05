import type { NextApiRequest, NextApiResponse } from 'next';
import { getWhaleAlertsForUser } from '../../../lib/whaleTracker';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '../../../lib/logger';

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
      return res.status(401).json({ error: 'Invalid token' });
    }

    const walletAddress = authResult.wallet;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const alerts = await getWhaleAlertsForUser(walletAddress, limit);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error: any) {
    logger.error(
      'Error in /api/whales/alerts:',
      error instanceof Error ? error : new Error(String(error))
    );
    return res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message,
    });
  }
}
