import Pusher from 'pusher';
import PusherClient from 'pusher-js';
import { logger } from '@/lib/logger';

// Pusher gratis: 200k mensajes/día, 100 conexiones concurrentes
// Si excede: Ably (6M mensajes/mes gratis, 200 conexiones concurrentes)

const isPusherEnabled = !!(
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
);

// Server-side Pusher
export const pusherServer = isPusherEnabled
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || 'us2',
      useTLS: true,
    })
  : null;

// Client-side Pusher (para componentes React)
export function getPusherClient(): PusherClient | null {
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
    return null;
  }

  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  });
}

// Canales y eventos
export const PusherChannels = {
  LEADERBOARD: 'leaderboard',
  HOT_FEED: 'hot-feed',
  GLOBAL_ACTIVITY: 'global-activity',
  WEEKLY_CHALLENGE: 'weekly-challenge',
} as const;

export const PusherEvents = {
  // Leaderboard
  LEADERBOARD_UPDATE: 'leaderboard-update',
  NEW_TOP_SCORER: 'new-top-scorer',

  // Hot Feed
  NEW_HOT_WALLET: 'new-hot-wallet',
  HOT_WALLET_TRADE: 'hot-wallet-trade',

  // Global Activity
  NEW_CARD: 'new-card',
  CARD_LIKED: 'card-liked',
  CARD_SHARED: 'card-shared',
  BADGE_EARNED: 'badge-earned',

  // Weekly Challenge
  CHALLENGE_UPDATE: 'challenge-update',
  NEW_CHALLENGE_LEADER: 'new-challenge-leader',
} as const;

/**
 * Trigger event to channel
 */
export async function triggerEvent(channel: string, event: string, data: any): Promise<boolean> {
  if (!isPusherEnabled || !pusherServer) {
    logger.warn('Pusher not configured, skipping event:', { event });
    return false;
  }

  try {
    await pusherServer.trigger(channel, event, data);
    return true;
  } catch (error) {
    logger.error('Pusher trigger error', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    return false;
  }
}

/**
 * Trigger múltiples eventos en batch
 */
export async function triggerBatch(
  batch: Array<{ channel: string; event: string; data: any }>
): Promise<boolean> {
  if (!isPusherEnabled || !pusherServer) {
    return false;
  }

  try {
    // Pusher requiere 'name' en vez de 'event' en el tipo BatchEvent
    const pusherBatch = batch.map(({ channel, event, data }) => ({
      channel,
      name: event,
      data,
    }));
    await pusherServer.triggerBatch(pusherBatch);
    return true;
  } catch (error) {
    logger.error('Pusher batch trigger error', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    return false;
  }
}

// Helpers para eventos específicos
export const realtimeHelpers = {
  /**
   * Notificar nueva card creada
   */
  async notifyNewCard(cardData: {
    walletAddress: string;
    username?: string;
    score: number;
    badges: number;
  }) {
    return triggerEvent(PusherChannels.GLOBAL_ACTIVITY, PusherEvents.NEW_CARD, cardData);
  },

  /**
   * Notificar like en card
   */
  async notifyCardLiked(data: { walletAddress: string; totalLikes: number }) {
    return triggerEvent(PusherChannels.GLOBAL_ACTIVITY, PusherEvents.CARD_LIKED, data);
  },

  /**
   * Notificar actualización de leaderboard
   */
  async notifyLeaderboardUpdate(leaderboardData: any[]) {
    return triggerEvent(PusherChannels.LEADERBOARD, PusherEvents.LEADERBOARD_UPDATE, {
      leaderboard: leaderboardData,
    });
  },

  /**
   * Notificar nuevo top scorer
   */
  async notifyNewTopScorer(data: {
    walletAddress: string;
    username?: string;
    score: number;
    previousTop?: string;
  }) {
    return triggerBatch([
      {
        channel: PusherChannels.LEADERBOARD,
        event: PusherEvents.NEW_TOP_SCORER,
        data,
      },
      {
        channel: PusherChannels.GLOBAL_ACTIVITY,
        event: PusherEvents.NEW_TOP_SCORER,
        data,
      },
    ]);
  },

  /**
   * Notificar trade de hot wallet
   */
  async notifyHotWalletTrade(data: {
    walletAddress: string;
    tokenSymbol: string;
    action: 'buy' | 'sell';
    amount: number;
    value: number;
  }) {
    return triggerEvent(PusherChannels.HOT_FEED, PusherEvents.HOT_WALLET_TRADE, data);
  },

  /**
   * Notificar nuevo badge ganado
   */
  async notifyBadgeEarned(data: { walletAddress: string; badgeName: string; badgeType: string }) {
    return triggerEvent(PusherChannels.GLOBAL_ACTIVITY, PusherEvents.BADGE_EARNED, data);
  },

  /**
   * Notificar actualización de challenge
   */
  async notifyChallengeUpdate(challengeData: {
    title: string;
    leaders: Array<{ walletAddress: string; value: number }>;
    endsAt: string;
  }) {
    return triggerEvent(
      PusherChannels.WEEKLY_CHALLENGE,
      PusherEvents.CHALLENGE_UPDATE,
      challengeData
    );
  },
};

export const isRealtimeEnabled = isPusherEnabled;
