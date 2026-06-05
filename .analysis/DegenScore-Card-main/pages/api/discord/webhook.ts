import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

/**
 * Discord webhook integration
 * Sends notifications to Discord channel for important events
 */

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
  footer?: {
    text: string;
  };
}

async function sendToDiscord(embeds: DiscordEmbed[]): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('Discord webhook URL not configured');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'DegenScore Bot',
        avatar_url: 'https://i.imgur.com/AfFp7pu.png', // Optional: your bot avatar
        embeds,
      }),
    });

    return response.ok;
  } catch (error) {
    logger.error('Failed to send Discord webhook:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Verify webhook authentication
  const apiKey = req.headers['x-api-key'] as string;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!apiKey || apiKey !== webhookSecret) {
    logger.warn('Unauthorized webhook attempt from:', {
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { event, data } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Missing event type' });
    }

    // Validate event type
    const validEvents = [
      'new_premium',
      'new_record',
      'weekly_challenge_winner',
      'milestone',
      'hot_trade',
    ];
    if (!validEvents.includes(event)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    let embeds: DiscordEmbed[] = [];

    switch (event) {
      case 'new_premium':
        embeds = [
          {
            title: '🎉 New Premium Member!',
            description: `${data.wallet.slice(0, 8)}... just upgraded to PREMIUM tier!`,
            color: 0x9945ff, // Purple
            fields: [
              {
                name: 'DegenScore',
                value: String(data.degenScore || 'N/A'),
                inline: true,
              },
              {
                name: 'Total Volume',
                value: data.totalVolume ? `$${data.totalVolume.toLocaleString()}` : 'N/A',
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: 'DegenScore Cards',
            },
          },
        ];
        break;

      case 'new_record':
        embeds = [
          {
            title: '🏆 New Record Set!',
            description: data.description || 'A new milestone has been reached!',
            color: 0xffd700, // Gold
            fields: data.fields || [],
            timestamp: new Date().toISOString(),
          },
        ];
        break;

      case 'weekly_challenge_winner':
        embeds = [
          {
            title: '👑 Weekly Challenge Winner!',
            description: `Congratulations to ${data.winner}!`,
            color: 0xff4500, // Orange-red
            fields: [
              {
                name: 'Challenge',
                value: data.challengeName,
                inline: false,
              },
              {
                name: 'Prize',
                value: `${data.prize} SOL`,
                inline: true,
              },
              {
                name: 'Score',
                value: String(data.score),
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ];
        break;

      case 'milestone':
        embeds = [
          {
            title: '🎊 Platform Milestone!',
            description: data.message,
            color: 0x00ff00, // Green
            timestamp: new Date().toISOString(),
          },
        ];
        break;

      case 'hot_trade':
        embeds = [
          {
            title: '🔥 Hot Trade Alert!',
            description: `Top trader ${data.wallet.slice(0, 8)}... just made a move!`,
            color: 0xff6b6b,
            fields: [
              {
                name: 'Token',
                value: data.tokenSymbol || 'Unknown',
                inline: true,
              },
              {
                name: 'Type',
                value: data.type === 'buy' ? '🟢 BUY' : '🔴 SELL',
                inline: true,
              },
              {
                name: 'Amount',
                value: `${data.solAmount} SOL`,
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ];
        break;
    }

    const success = await sendToDiscord(embeds);

    if (success) {
      res.status(200).json({ success: true, message: 'Webhook sent' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send webhook' });
    }
  } catch (error: any) {
    logger.error('Discord webhook handler error:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
}
