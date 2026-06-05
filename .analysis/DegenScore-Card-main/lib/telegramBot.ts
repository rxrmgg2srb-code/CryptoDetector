import TelegramBot from 'node-telegram-bot-api';
import { logger } from './logger';
import { prisma } from './prisma';

// Bot commands and responses
export const TELEGRAM_COMMANDS = {
  START: '/start',
  SCORE: '/score',
  CHALLENGE: '/challenge',
  WHALE: '/whale',
  ALERTS: '/alerts',
  LINK: '/link',
  HELP: '/help',
};

/**
 * Create Telegram bot instance (only if token is configured)
 */
export function createTelegramBot(): TelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN not configured. Telegram bot disabled.');
    return null;
  }

  try {
    const bot = new TelegramBot(token, { polling: false });
    logger.info('Telegram bot created successfully');
    return bot;
  } catch (error: any) {
    logger.error('Failed to create Telegram bot:', error);
    return null;
  }
}

/**
 * Get or create Telegram user
 */
export async function getOrCreateTelegramUser(telegramId: number, username?: string) {
  try {
    let user = await prisma.telegramUser.findUnique({
      where: { telegramId: String(telegramId) },
    });

    if (!user) {
      user = await prisma.telegramUser.create({
        data: {
          telegramId: String(telegramId),
          username: username || null,
        },
      });
      logger.info(`New Telegram user created: ${telegramId}`);
    } else {
      // Update last interaction
      user = await prisma.telegramUser.update({
        where: { telegramId: String(telegramId) },
        data: {
          lastActiveAt: new Date(),
          commandsUsed: { increment: 1 },
        },
      });
    }

    return user;
  } catch (error: any) {
    logger.error('Error getting/creating Telegram user:', error);
    return null;
  }
}

/**
 * Link Telegram account to wallet
 */
export async function linkTelegramToWallet(
  telegramId: number,
  walletAddress: string
): Promise<boolean> {
  try {
    await prisma.telegramUser.update({
      where: { telegramId: String(telegramId) },
      data: { walletAddress },
    });

    logger.info(`Telegram ${telegramId} linked to wallet ${walletAddress}`);
    return true;
  } catch (error: any) {
    logger.error('Error linking Telegram to wallet:', error);
    return false;
  }
}

/**
 * Handle /start command
 */
export function getStartMessage(username?: string): string {
  return `🎮 ¡Bienvenido a DegenScore ${username ? username : 'trader'}!

Tu trading card de Solana ahora en Telegram.

🔗 **Vincula tu wallet:**
Usa /link para conectar tu wallet de Solana

📊 **Comandos disponibles:**
/score - Ver tu DegenScore
/challenge - Desafíos diarios
/whale - Alertas de whales
/alerts - Tus notificaciones
/help - Ver todos los comandos

🚀 ¡Comienza ahora!`;
}

/**
 * Handle /score command
 */
export async function getScoreMessage(walletAddress: string): Promise<string> {
  try {
    const degenCard = await prisma.degenCard.findUnique({
      where: { walletAddress },
    });

    if (!degenCard) {
      return '❌ No se encontró tu score card.\n\nPrimero vincula tu wallet con /link';
    }

    const analytics = await prisma.userAnalytics.findUnique({
      where: { walletAddress },
    });

    const level = analytics?.level || degenCard.level || 1;
    const xp = analytics?.totalXP || degenCard.xp || 0;

    return `📊 **Tu DegenScore**

🎯 Score: **${degenCard.degenScore}**
⭐ Nivel: **${level}** (${xp} XP)

📈 Trading Stats:
• Total Trades: ${degenCard.totalTrades}
• Win Rate: ${degenCard.winRate.toFixed(1)}%
• P&L: ${degenCard.profitLoss > 0 ? '+' : ''}${degenCard.profitLoss.toFixed(2)} SOL
• Volumen: ${degenCard.totalVolume.toFixed(2)} SOL

🌐 Ver card completa: https://www.solanamillondollar.com/${walletAddress}`;
  } catch (error: any) {
    logger.error('Error fetching score message:', error);
    return '❌ Error al obtener tu score. Intenta de nuevo.';
  }
}

/**
 * Handle /challenge command
 */
export async function getChallengeMessage(walletAddress: string): Promise<string> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        date: today,
      },
      include: {
        completions: {
          where: { walletAddress },
        },
      },
    });

    if (challenges.length === 0) {
      return '🎯 No hay desafíos disponibles hoy.\n\nVuelve mañana para nuevos desafíos.';
    }

    let message = '🎯 **Desafíos Diarios**\n\n';

    challenges.forEach((challenge, idx) => {
      const completion = challenge.completions[0];
      const progress = completion?.progress || 0;
      const completed = completion?.completed || false;
      const percent = Math.min((progress / challenge.targetValue) * 100, 100);

      const status = completed ? '✅' : '⏳';
      const progressBar =
        '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));

      message += `${idx + 1}. ${status} ${challenge.title}\n`;
      message += `   ${progressBar} ${progress}/${challenge.targetValue}\n`;
      message += `   🎁 +${challenge.rewardXP} XP\n\n`;
    });

    return message + '🌐 Completa en: https://www.solanamillondollar.com';
  } catch (error: any) {
    logger.error('Error fetching challenges:', error);
    return '❌ Error al obtener desafíos. Intenta de nuevo.';
  }
}

/**
 * Handle /whale command
 */
export async function getWhaleMessage(walletAddress?: string): Promise<string> {
  try {
    if (!walletAddress) {
      return '🐋 **Top Whales**\n\nPara ver alertas personalizadas, primero vincula tu wallet con /link\n\n🌐 Ver whales: https://www.solanamillondollar.com';
    }

    // Get recent whale alerts for followed whales
    const follows = await prisma.whaleFollower.findMany({
      where: { walletAddress },
      select: { whaleAddress: true },
    });

    if (follows.length === 0) {
      return '🐋 No sigues ninguna whale.\n\n🌐 Descubre whales en: https://www.solanamillondollar.com';
    }

    const whaleAddresses = follows.map((f) => f.whaleAddress);

    // Get whale wallets to get their IDs
    const whaleWallets = await prisma.whaleWallet.findMany({
      where: {
        walletAddress: { in: whaleAddresses },
      },
      select: { id: true },
    });

    const whaleIds = whaleWallets.map((w) => w.id);

    const alerts = await prisma.whaleAlert.findMany({
      where: {
        whaleId: { in: whaleIds },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
        },
      },
      include: {
        whale: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    if (alerts.length === 0) {
      return '🐋 No hay actividad reciente de tus whales.\n\nTe notificaremos cuando hagan trades.';
    }

    let message = '🐋 **Actividad de Whales (últimas 24h)**\n\n';

    alerts.forEach((alert, idx) => {
      const isBuy = alert.alertType === 'large_buy';
      const emoji = isBuy ? '💰' : '💸';
      const whale = alert.whale;
      const walletShort = `${whale.walletAddress.slice(0, 4)}...${whale.walletAddress.slice(-4)}`;

      message += `${idx + 1}. ${emoji} ${whale.label || walletShort}\n`;
      message += `   ${isBuy ? 'Compró' : 'Vendió'} ${alert.tokenSymbol || 'token'}\n`;
      message += `   💵 ${alert.amount.toFixed(2)} SOL\n\n`;
    });

    return message + '🌐 Ver más: https://www.solanamillondollar.com';
  } catch (error: any) {
    logger.error('Error fetching whale alerts:', error);
    return '❌ Error al obtener alertas de whales.';
  }
}

/**
 * Handle /alerts command
 */
export async function getAlertsMessage(walletAddress: string): Promise<string> {
  try {
    const user = await prisma.telegramUser.findFirst({
      where: { walletAddress },
    });

    if (!user) {
      return '❌ Primero vincula tu wallet con /link';
    }

    const notificationsStatus = user.notifications ? '✅ Activadas' : '❌ Desactivadas';

    return `🔔 **Tus Notificaciones**

Estado: ${notificationsStatus}

Recibirás alertas de:
• 🐋 Whales que sigues
• 🏆 Nuevos logros desbloqueados
• 📊 Cambios en tu ranking
• 🎯 Desafíos completados

Para gestionar tus notificaciones:
🌐 https://www.solanamillondollar.com/settings`;
  } catch (error: any) {
    logger.error('Error fetching alerts:', error);
    return '❌ Error al obtener alertas.';
  }
}

/**
 * Handle /help command
 */
export function getHelpMessage(): string {
  return `📚 **Comandos Disponibles**

/start - Mensaje de bienvenida
/link - Vincular tu wallet de Solana
/score - Ver tu DegenScore y stats
/challenge - Ver desafíos diarios
/whale - Ver actividad de whales
/alerts - Gestionar notificaciones
/help - Ver esta ayuda

🌐 Web: https://www.solanamillondollar.com
💬 Support: @DegenScoreSupport`;
}

/**
 * Send notification to Telegram user
 */
export async function sendTelegramNotification(
  telegramId: number,
  message: string
): Promise<boolean> {
  const bot = createTelegramBot();

  if (!bot) {
    logger.warn('Cannot send notification: Telegram bot not configured');
    return false;
  }

  try {
    await bot.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
    });
    return true;
  } catch (error: any) {
    logger.error('Error sending Telegram notification:', error);
    return false;
  }
}

/**
 * Notify whale followers about new alert
 */
export async function notifyWhaleFollowers(
  whaleAddress: string,
  alertMessage: string
): Promise<number> {
  try {
    const followers = await prisma.whaleFollower.findMany({
      where: {
        whaleAddress,
        alertOnTrades: true,
      },
    });

    let notifiedCount = 0;

    for (const follower of followers) {
      // Find Telegram user
      const telegramUser = await prisma.telegramUser.findFirst({
        where: {
          walletAddress: follower.walletAddress,
          notifications: true,
        },
      });

      if (telegramUser) {
        const sent = await sendTelegramNotification(Number(telegramUser.telegramId), alertMessage);
        if (sent) {
          notifiedCount++;
        }
      }
    }

    logger.info(`Notified ${notifiedCount} followers about whale alert`);
    return notifiedCount;
  } catch (error: any) {
    logger.error('Error notifying whale followers:', error);
    return 0;
  }
}
