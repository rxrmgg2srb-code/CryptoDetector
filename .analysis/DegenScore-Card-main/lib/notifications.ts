import { prisma } from './prisma';
import { logger } from './logger';

/**
 * Notification system for sending alerts via multiple channels
 */

export interface NotificationData {
  title: string;
  message: string;
  url?: string;
  type: 'trade' | 'milestone' | 'challenge' | 'follow';
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Send Discord notification to user's personal webhook
 */
async function sendDiscordNotification(
  webhookUrl: string,
  data: NotificationData
): Promise<boolean> {
  try {
    const color = {
      trade: 0x9945ff, // Purple
      milestone: 0x00ff00, // Green
      challenge: 0xffd700, // Gold
      follow: 0x00aaff, // Blue
    }[data.type];

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'DegenScore Notifications',
        avatar_url: 'https://i.imgur.com/AfFp7pu.png',
        embeds: [
          {
            title: data.title,
            description: data.message,
            color,
            timestamp: new Date().toISOString(),
            footer: {
              text: 'DegenScore Cards',
            },
            ...(data.url && {
              url: data.url,
            }),
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    logger.error('Failed to send Discord notification:', error as Error);
    return false;
  }
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(chatId: string, data: NotificationData): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    logger.warn('Telegram bot token not configured');
    return false;
  }

  try {
    const icon = {
      trade: '📊',
      milestone: '🎉',
      challenge: '🏆',
      follow: '👤',
    }[data.type];

    let message = `${icon} *${data.title}*\n\n${data.message}`;
    if (data.url) {
      message += `\n\n[Ver más](${data.url})`;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    const result = await response.json();
    return result.ok;
  } catch (error) {
    logger.error('Failed to send Telegram notification:', error as Error);
    return false;
  }
}

/**
 * Send email notification
 * Note: Requires email service configuration (SendGrid, SES, etc.)
 */
async function sendEmailNotification(email: string, data: NotificationData): Promise<boolean> {
  // TODO: Implement email sending using SendGrid, AWS SES, or similar
  // For now, just log
  logger.info('Email notification (not implemented):', {
    to: email,
    subject: data.title,
    message: data.message,
  });

  // Example with SendGrid (requires @sendgrid/mail package):
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    await sgMail.send({
      to: email,
      from: 'notifications@degenscore.com',
      subject: data.title,
      text: data.message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9945FF;">${data.title}</h2>
          <p>${data.message}</p>
          ${data.url ? `<p><a href="${data.url}" style="color: #9945FF;">Ver más</a></p>` : ''}
        </div>
      `,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error as Error);
    return false;
  }
  */

  return false; // Not implemented yet
}

/**
 * Send notification to a specific wallet address
 */
export async function notifyWallet(walletAddress: string, data: NotificationData): Promise<void> {
  try {
    // Get user's notification preferences
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { walletAddress },
    });

    if (!preferences) {
      logger.debug('No notification preferences found for wallet:', { walletAddress });
      return;
    }

    // Check if user wants this type of notification
    const wantsNotification = {
      trade: preferences.followedTrades,
      milestone: preferences.milestones,
      challenge: preferences.challenges,
      follow: true, // Always notify for follows
    }[data.type];

    if (!wantsNotification) {
      logger.debug('User disabled this notification type:', { walletAddress, type: data.type });
      return;
    }

    // Send via enabled channels
    const promises: Promise<boolean>[] = [];

    if (preferences.discordEnabled && preferences.discordWebhook) {
      promises.push(sendDiscordNotification(preferences.discordWebhook, data));
    }

    if (preferences.telegramEnabled && preferences.telegramChatId) {
      promises.push(sendTelegramNotification(preferences.telegramChatId, data));
    }

    if (preferences.emailEnabled && preferences.email) {
      promises.push(sendEmailNotification(preferences.email, data));
    }

    if (promises.length === 0) {
      logger.debug('No notification channels enabled for wallet:', { walletAddress });
      return;
    }

    const results = await Promise.allSettled(promises);
    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;

    logger.info('Notifications sent:', {
      walletAddress,
      type: data.type,
      sent: successCount,
      total: promises.length,
    });
  } catch (error) {
    logger.error('Error sending notifications:', error as Error);
  }
}

/**
 * Notify followers when a wallet makes a trade
 */
export async function notifyFollowersOfTrade(
  walletAddress: string,
  tradeData: {
    tokenSymbol: string;
    type: 'buy' | 'sell';
    solAmount: number;
    profitLoss?: number;
  }
): Promise<void> {
  try {
    // Get all followers of this wallet
    const followers = await prisma.userFollows.findMany({
      where: { following: walletAddress },
      select: { follower: true },
    });

    if (followers.length === 0) {
      return;
    }

    // Get wallet profile for better notification
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
      select: { displayName: true, degenScore: true },
    });

    const walletName = card?.displayName || `${walletAddress.slice(0, 8)}...`;
    const action = tradeData.type === 'buy' ? 'compró' : 'vendió';
    const profitInfo = tradeData.profitLoss
      ? ` (${tradeData.profitLoss > 0 ? '+' : ''}${tradeData.profitLoss.toFixed(2)} SOL)`
      : '';

    const notificationData: NotificationData = {
      title: `🔔 ${walletName} hizo un trade`,
      message: `${action} ${tradeData.tokenSymbol} por ${tradeData.solAmount} SOL${profitInfo}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${walletAddress}`,
      type: 'trade',
      priority: 'normal',
    };

    // Send notifications to all followers
    await Promise.all(followers.map((f) => notifyWallet(f.follower, notificationData)));

    logger.info('Notified followers of trade:', {
      wallet: walletAddress,
      followers: followers.length,
    });
  } catch (error) {
    logger.error('Error notifying followers:', error as Error);
  }
}

/**
 * Notify wallet of a milestone achievement
 */
export async function notifyMilestone(
  walletAddress: string,
  milestone: {
    title: string;
    description: string;
    badgeName?: string;
  }
): Promise<void> {
  await notifyWallet(walletAddress, {
    title: `🎉 ${milestone.title}`,
    message: milestone.description,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${walletAddress}`,
    type: 'milestone',
    priority: 'high',
  });
}

/**
 * Notify wallet they have a new follower
 */
export async function notifyNewFollower(
  walletAddress: string,
  followerAddress: string
): Promise<void> {
  const followerCard = await prisma.degenCard.findUnique({
    where: { walletAddress: followerAddress },
    select: { displayName: true, degenScore: true },
  });

  const followerName = followerCard?.displayName || `${followerAddress.slice(0, 8)}...`;

  await notifyWallet(walletAddress, {
    title: '👥 Nuevo Seguidor',
    message: `${followerName} ahora te está siguiendo`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${followerAddress}`,
    type: 'follow',
    priority: 'low',
  });
}
