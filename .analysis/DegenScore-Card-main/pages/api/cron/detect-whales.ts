import type { NextApiRequest, NextApiResponse } from 'next';
import { detectAndRegisterWhale, updateWhaleMetrics } from '../../../lib/whaleTracker';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify cron key
    const cronKey = req.headers['x-cron-key'];
    if (cronKey !== process.env.CRON_API_KEY) {
      logger.warn('Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.info('Starting whale detection cron job');

    // Get active traders (traded in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activeWallets = await prisma.hotTrade.findMany({
      where: {
        timestamp: {
          gte: sevenDaysAgo,
        },
      },
      distinct: ['walletAddress'],
      select: { walletAddress: true },
      take: 200, // Limit to avoid timeout
    });

    logger.info(`Found ${activeWallets.length} active wallets to check`);

    let detected = 0;
    let updated = 0;

    for (const { walletAddress } of activeWallets) {
      try {
        // Try to detect new whale
        const isNew = await detectAndRegisterWhale(walletAddress);
        if (isNew) {
          detected++;
          logger.info(`New whale detected: ${walletAddress}`);
        } else {
          // Update existing whale metrics
          const existingWhale = await prisma.whaleWallet.findUnique({
            where: { walletAddress },
          });

          if (existingWhale) {
            await updateWhaleMetrics(walletAddress);
            updated++;
          }
        }
      } catch (error: any) {
        logger.error(`Error processing wallet ${walletAddress}:`, error);
        // Continue with next wallet
      }
    }

    logger.info(`Whale detection complete. New: ${detected}, Updated: ${updated}`);

    return res.status(200).json({
      success: true,
      walletsChecked: activeWallets.length,
      newWhales: detected,
      updatedWhales: updated,
    });
  } catch (error: any) {
    logger.error('Error in whale detection cron:', error);
    return res.status(500).json({
      error: 'Cron job failed',
      message: error.message,
    });
  }
}
