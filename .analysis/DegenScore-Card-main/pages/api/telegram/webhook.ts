import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../../lib/logger';
import {
  getOrCreateTelegramUser,
  TELEGRAM_COMMANDS,
  getStartMessage,
  getScoreMessage,
  getChallengeMessage,
  getWhaleMessage,
  getAlertsMessage,
  getHelpMessage,
} from '../../../lib/telegramBot';

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update: TelegramUpdate = req.body;

    if (!update.message || !update.message.text) {
      return res.status(200).json({ ok: true });
    }

    const message = update.message;
    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const telegramId = message.from?.id;
    const username = message.from?.username;

    if (!telegramId) {
      return res.status(200).json({ ok: true });
    }

    // Get or create user
    const telegramUser = await getOrCreateTelegramUser(telegramId, username);

    if (!telegramUser) {
      logger.error('Failed to get/create Telegram user');
      return res.status(500).json({ error: 'Internal error' });
    }

    let responseMessage = '';

    // Handle commands
    if (text.startsWith('/')) {
      const command = text.split(' ')[0]?.toLowerCase() || '';

      switch (command) {
        case TELEGRAM_COMMANDS.START:
          responseMessage = getStartMessage(username);
          break;

        case TELEGRAM_COMMANDS.SCORE:
          if (!telegramUser.walletAddress) {
            responseMessage = '❌ Primero vincula tu wallet con /link';
          } else {
            responseMessage = await getScoreMessage(telegramUser.walletAddress);
          }
          break;

        case TELEGRAM_COMMANDS.CHALLENGE:
          if (!telegramUser.walletAddress) {
            responseMessage = '❌ Primero vincula tu wallet con /link';
          } else {
            responseMessage = await getChallengeMessage(telegramUser.walletAddress);
          }
          break;

        case TELEGRAM_COMMANDS.WHALE:
          responseMessage = await getWhaleMessage(telegramUser.walletAddress || undefined);
          break;

        case TELEGRAM_COMMANDS.ALERTS:
          if (!telegramUser.walletAddress) {
            responseMessage = '❌ Primero vincula tu wallet con /link';
          } else {
            responseMessage = await getAlertsMessage(telegramUser.walletAddress);
          }
          break;

        case TELEGRAM_COMMANDS.LINK:
          responseMessage = `🔗 **Vincular Wallet**

Para vincular tu wallet de Solana:

1. Visita: https://www.solanamillondollar.com/telegram-link
2. Connect your wallet
3. Ingresa tu código: \`${telegramId}\`

¡Después podrás usar todos los comandos!`;
          break;

        case TELEGRAM_COMMANDS.HELP:
          responseMessage = getHelpMessage();
          break;

        default:
          responseMessage = `❓ Comando desconocido: ${command}\n\nUsa /help para ver los comandos disponibles.`;
      }
    } else {
      // Handle non-command messages
      responseMessage = `Hola! 👋\n\nUsa /help para ver los comandos disponibles.`;
    }

    // Send response using Telegram Bot API
    if (responseMessage) {
      await sendTelegramMessage(chatId, responseMessage);
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    logger.error('Error in Telegram webhook:', error);
    return res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }
}

/**
 * Send message via Telegram Bot API
 */
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN not configured');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    logger.info(`Message sent to Telegram chat ${chatId}`);
  } catch (error: any) {
    logger.error('Error sending Telegram message:', error);
    throw error;
  }
}
