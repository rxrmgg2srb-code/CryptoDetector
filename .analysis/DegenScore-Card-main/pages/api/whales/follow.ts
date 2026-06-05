import type { NextApiRequest, NextApiResponse } from 'next';
import { followWhale, unfollowWhale, getFollowedWhales } from '../../../lib/whaleTracker';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // GET - Get followed whales
    if (req.method === 'GET') {
      const followedWhales = await getFollowedWhales(walletAddress);

      return res.status(200).json({
        success: true,
        count: followedWhales.length,
        whales: followedWhales,
      });
    }

    // POST - Follow a whale
    if (req.method === 'POST') {
      const { whaleWalletId } = req.body;

      if (!whaleWalletId) {
        return res.status(400).json({ error: 'Missing whaleWalletId' });
      }

      const success = await followWhale(walletAddress, whaleWalletId);

      if (!success) {
        return res.status(400).json({ error: 'Failed to follow whale' });
      }

      return res.status(200).json({
        success: true,
        message: 'Whale followed successfully',
      });
    }

    // DELETE - Unfollow a whale
    if (req.method === 'DELETE') {
      const { whaleWalletId } = req.body;

      if (!whaleWalletId) {
        return res.status(400).json({ error: 'Missing whaleWalletId' });
      }

      const success = await unfollowWhale(walletAddress, whaleWalletId);

      if (!success) {
        return res.status(400).json({ error: 'Failed to unfollow whale' });
      }

      return res.status(200).json({
        success: true,
        message: 'Whale unfollowed successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    logger.error(
      'Error in /api/whales/follow:',
      error instanceof Error ? error : new Error(String(error))
    );
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
    });
  }
}
