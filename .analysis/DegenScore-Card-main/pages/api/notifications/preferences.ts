import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifySessionToken } from '../../../lib/walletAuth';
import { logger } from '../../../lib/logger';

/**
 * API endpoint to manage notification preferences
 * GET: Retrieve preferences
 * POST: Update preferences
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const authResult = verifySessionToken(token);

    if (!authResult.valid) {
      logger.warn('Invalid authentication token for notifications:', { error: authResult.error });
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const walletAddress = authResult.wallet!;

    if (req.method === 'GET') {
      // Get notification preferences
      let preferences = await prisma.notificationPreferences.findUnique({
        where: { walletAddress },
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
          data: {
            walletAddress,
            emailEnabled: false,
            telegramEnabled: false,
            discordEnabled: false,
            followedTrades: true,
            milestones: true,
            challenges: true,
          },
        });
      }

      return res.status(200).json(preferences);
    }

    if (req.method === 'POST') {
      // Update notification preferences
      const {
        emailEnabled,
        telegramEnabled,
        discordEnabled,
        email,
        telegramChatId,
        discordWebhook,
        followedTrades,
        milestones,
        challenges,
      } = req.body;

      // Validate email if provided
      if (emailEnabled && email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email address' });
        }
      }

      // Validate Discord webhook if provided
      if (discordEnabled && discordWebhook) {
        const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
        if (!discordWebhookRegex.test(discordWebhook)) {
          return res.status(400).json({ error: 'Invalid Discord webhook URL' });
        }
      }

      logger.debug('Updating notification preferences:', { walletAddress });

      const preferences = await prisma.notificationPreferences.upsert({
        where: { walletAddress },
        update: {
          emailEnabled: emailEnabled ?? undefined,
          telegramEnabled: telegramEnabled ?? undefined,
          discordEnabled: discordEnabled ?? undefined,
          email: email ?? undefined,
          telegramChatId: telegramChatId ?? undefined,
          discordWebhook: discordWebhook ?? undefined,
          followedTrades: followedTrades ?? undefined,
          milestones: milestones ?? undefined,
          challenges: challenges ?? undefined,
        },
        create: {
          walletAddress,
          emailEnabled: emailEnabled ?? false,
          telegramEnabled: telegramEnabled ?? false,
          discordEnabled: discordEnabled ?? false,
          email,
          telegramChatId,
          discordWebhook,
          followedTrades: followedTrades ?? true,
          milestones: milestones ?? true,
          challenges: challenges ?? true,
        },
      });

      logger.info('Notification preferences updated:', { walletAddress });

      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        preferences,
      });
    }
  } catch (error: any) {
    logger.error(
      'Error managing notification preferences:',
      error instanceof Error ? error : undefined,
      {
        error: String(error),
      }
    );

    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Failed to manage notification preferences';

    res.status(500).json({ error: errorMessage });
  }
}
