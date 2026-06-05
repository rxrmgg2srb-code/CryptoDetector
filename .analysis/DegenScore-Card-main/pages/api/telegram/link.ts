import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySessionToken } from '../../../lib/walletAuth';
import { linkTelegramToWallet } from '../../../lib/telegramBot';
import { logger } from '../../../lib/logger';

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
      return res.status(401).json({ error: 'Invalid token' });
    }

    const walletAddress = authResult.wallet;
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Missing telegramId' });
    }

    // Parse telegramId (can be string or number)
    const telegramIdNum = typeof telegramId === 'string' ? parseInt(telegramId) : telegramId;

    if (isNaN(telegramIdNum)) {
      return res.status(400).json({ error: 'Invalid telegramId' });
    }

    // Link Telegram to wallet
    const success = await linkTelegramToWallet(telegramIdNum, walletAddress);

    if (!success) {
      return res.status(500).json({ error: 'Failed to link Telegram account' });
    }

    return res.status(200).json({
      success: true,
      message: 'Telegram account linked successfully',
    });
  } catch (error: any) {
    logger.error(
      'Error in /api/telegram/link:',
      error instanceof Error ? error : new Error(String(error))
    );
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
    });
  }
}
