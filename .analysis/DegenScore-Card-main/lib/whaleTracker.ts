import { prisma } from './prisma';
import { logger } from './logger';

// Whale detection thresholds
const WHALE_THRESHOLDS = {
  minVolume: 1000, // $1000+ total volume
  minPositionSize: 50, // $50+ average position
  minWinRate: 55, // 55%+ win rate
  minTrades: 10, // At least 10 trades
};

// Alert types
export type WhaleAlertType =
  | 'large_buy'
  | 'large_sell'
  | 'new_position'
  | 'position_close'
  | 'whale_detected';

interface WhaleMetrics {
  totalVolume: number;
  winRate: number;
  avgPositionSize: number;
  totalProfit: number;
  topTokens: string[];
}

/**
 * Calculate whale metrics from trading history
 */
export async function calculateWhaleMetrics(walletAddress: string): Promise<WhaleMetrics | null> {
  try {
    // Use DegenCard data as trades aren't stored individually
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
    });

    if (!card || card.totalTrades < WHALE_THRESHOLDS.minTrades) {
      return null;
    }

    // Get recent HotTrades to find top tokens
    const hotTrades = await prisma.hotTrade.findMany({
      where: { walletAddress },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    // Get top tokens from hot trades
    const tokenCounts = hotTrades.reduce(
      (acc, trade) => {
        const symbol = trade.tokenSymbol || 'UNKNOWN';
        acc[symbol] = (acc[symbol] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topTokens = Object.entries(tokenCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([symbol]) => symbol);

    return {
      totalVolume: card.totalVolume,
      winRate: card.winRate,
      avgPositionSize: card.avgTradeSize,
      totalProfit: card.profitLoss,
      topTokens,
    };
  } catch (error: any) {
    logger.error('Error calculating whale metrics:', error);
    return null;
  }
}

/**
 * Check if wallet qualifies as whale
 */
export function isWhale(metrics: WhaleMetrics): boolean {
  return (
    metrics.totalVolume >= WHALE_THRESHOLDS.minVolume &&
    metrics.avgPositionSize >= WHALE_THRESHOLDS.minPositionSize &&
    metrics.winRate >= WHALE_THRESHOLDS.minWinRate
  );
}

/**
 * Detect and register new whales
 */
export async function detectAndRegisterWhale(walletAddress: string): Promise<boolean> {
  try {
    // Check if already registered
    const existing = await prisma.whaleWallet.findUnique({
      where: { walletAddress },
    });

    if (existing) {
      return false; // Already a whale
    }

    // Calculate metrics
    const metrics = await calculateWhaleMetrics(walletAddress);

    if (!metrics || !isWhale(metrics)) {
      return false;
    }

    // Get card to fetch totalTrades
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
    });

    if (!card) {
      return false;
    }

    // Determine tier based on total volume
    const tier =
      metrics.totalVolume >= 1000 ? 'megawhale' : metrics.totalVolume >= 100 ? 'whale' : 'shark';

    // Register as whale
    await prisma.whaleWallet.create({
      data: {
        walletAddress,
        tier,
        totalBalance: metrics.totalVolume, // Using volume as balance estimate
        totalVolume: metrics.totalVolume,
        totalTrades: card.totalTrades,
        winRate: metrics.winRate,
        avgTradeSize: metrics.avgPositionSize,
        lastTradeAt: new Date(),
        tags: JSON.stringify(metrics.topTokens),
      },
    });

    logger.info(`New whale detected: ${walletAddress}`);
    return true;
  } catch (error: any) {
    logger.error('Error detecting whale:', error);
    return false;
  }
}

/**
 * Update whale metrics
 */
export async function updateWhaleMetrics(walletAddress: string): Promise<void> {
  try {
    const metrics = await calculateWhaleMetrics(walletAddress);

    if (!metrics) {
      return;
    }

    // Get card to fetch totalTrades
    const card = await prisma.degenCard.findUnique({
      where: { walletAddress },
    });

    if (!card) {
      return;
    }

    // Determine tier based on total volume
    const tier =
      metrics.totalVolume >= 1000 ? 'megawhale' : metrics.totalVolume >= 100 ? 'whale' : 'shark';

    await prisma.whaleWallet.update({
      where: { walletAddress },
      data: {
        tier,
        totalBalance: metrics.totalVolume, // Using volume as balance estimate
        totalVolume: metrics.totalVolume,
        totalTrades: card.totalTrades,
        winRate: metrics.winRate,
        avgTradeSize: metrics.avgPositionSize,
        lastTradeAt: new Date(),
        tags: JSON.stringify(metrics.topTokens),
      },
    });
  } catch (error: any) {
    logger.error('Error updating whale metrics:', error);
  }
}

/**
 * Create whale alert
 */
export async function createWhaleAlert(
  whaleId: string,
  alertType: WhaleAlertType,
  tokenMint: string,
  tokenSymbol: string,
  amount: number,
  description: string
): Promise<void> {
  try {
    await prisma.whaleAlert.create({
      data: {
        whaleId,
        alertType,
        tokenMint,
        tokenSymbol,
        amount,
        description,
      },
    });

    logger.info(`Whale alert created: ${alertType} for ${tokenSymbol}`);
  } catch (error: any) {
    logger.error('Error creating whale alert:', error);
  }
}

/**
 * Get top whales
 */
export async function getTopWhales(limit = 50) {
  try {
    const whales = await prisma.whaleWallet.findMany({
      orderBy: [{ totalVolume: 'desc' }, { winRate: 'desc' }],
      take: limit,
    });

    return whales.map((whale) => ({
      ...whale,
      topTokens: whale.tags ? JSON.parse(whale.tags) : [],
    }));
  } catch (error: any) {
    logger.error('Error fetching top whales:', error);
    return [];
  }
}

/**
 * Get whale alerts for followed whales
 */
export async function getWhaleAlertsForUser(walletAddress: string, limit = 20) {
  try {
    // Get followed whales
    const follows = await prisma.whaleFollower.findMany({
      where: {
        walletAddress,
        alertOnTrades: true,
      },
      select: { whaleAddress: true },
    });

    const whaleAddresses = follows.map((f) => f.whaleAddress);

    if (whaleAddresses.length === 0) {
      return [];
    }

    // Get whale wallets to get their IDs
    const whaleWallets = await prisma.whaleWallet.findMany({
      where: {
        walletAddress: { in: whaleAddresses },
      },
      select: { id: true },
    });

    const whaleIds = whaleWallets.map((w) => w.id);

    // Get recent alerts
    const alerts = await prisma.whaleAlert.findMany({
      where: {
        whaleId: { in: whaleIds },
      },
      include: {
        whale: {
          select: {
            walletAddress: true,
            label: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return alerts;
  } catch (error: any) {
    logger.error('Error fetching whale alerts:', error);
    return [];
  }
}

/**
 * Follow a whale
 */
export async function followWhale(walletAddress: string, whaleAddress: string): Promise<boolean> {
  try {
    // Check if whale exists
    const whale = await prisma.whaleWallet.findUnique({
      where: { walletAddress: whaleAddress },
    });

    if (!whale) {
      return false;
    }

    // Create follow
    await prisma.whaleFollower.create({
      data: {
        walletAddress,
        whaleAddress,
      },
    });

    return true;
  } catch (error: any) {
    // Might already be following
    logger.error('Error following whale:', error);
    return false;
  }
}

/**
 * Unfollow a whale
 */
export async function unfollowWhale(walletAddress: string, whaleAddress: string): Promise<boolean> {
  try {
    const deleted = await prisma.whaleFollower.deleteMany({
      where: {
        walletAddress,
        whaleAddress,
      },
    });

    return deleted.count > 0;
  } catch (error: any) {
    logger.error('Error unfollowing whale:', error);
    return false;
  }
}

/**
 * Check if user is following whale
 */
export async function isFollowingWhale(
  walletAddress: string,
  whaleAddress: string
): Promise<boolean> {
  try {
    const follow = await prisma.whaleFollower.findFirst({
      where: {
        walletAddress,
        whaleAddress,
      },
    });

    return !!follow;
  } catch (error: any) {
    logger.error('Error checking whale follow:', error);
    return false;
  }
}

/**
 * Get user's followed whales
 */
export async function getFollowedWhales(walletAddress: string) {
  try {
    const follows = await prisma.whaleFollower.findMany({
      where: { walletAddress },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get whale details for each follow
    const whaleAddresses = follows.map((f) => f.whaleAddress);
    const whales = await prisma.whaleWallet.findMany({
      where: {
        walletAddress: { in: whaleAddresses },
      },
    });

    // Create a map for quick lookup
    const whaleMap = new Map(whales.map((w) => [w.walletAddress, w]));

    return follows.map((f) => {
      const whale = whaleMap.get(f.whaleAddress);
      return {
        ...whale,
        topTokens: whale?.tags ? JSON.parse(whale.tags) : [],
        followedAt: f.createdAt,
        alertOnTrades: f.alertOnTrades,
      };
    });
  } catch (error: any) {
    logger.error('Error fetching followed whales:', error);
    return [];
  }
}

/**
 * Process new trade to check for whale activity
 */
export async function processTradeForWhaleDetection(
  walletAddress: string,
  trade: {
    type: 'buy' | 'sell';
    tokenMint: string;
    tokenSymbol: string;
    solAmount: number;
    signature: string;
  }
): Promise<void> {
  try {
    // Check if wallet is a whale
    let whale = await prisma.whaleWallet.findUnique({
      where: { walletAddress },
    });

    // If not, try to detect
    if (!whale) {
      const detected = await detectAndRegisterWhale(walletAddress);
      if (detected) {
        whale = await prisma.whaleWallet.findUnique({
          where: { walletAddress },
        });
      }
    }

    // If whale, create alert for large trades
    if (whale && trade.solAmount >= 50) {
      const alertType: WhaleAlertType =
        trade.solAmount >= 500
          ? trade.type === 'buy'
            ? 'large_buy'
            : 'large_sell'
          : trade.type === 'buy'
            ? 'new_position'
            : 'position_close';

      const description = `${trade.type === 'buy' ? 'Bought' : 'Sold'} ${trade.tokenSymbol} for ${trade.solAmount.toFixed(2)} SOL`;

      await createWhaleAlert(
        whale.id,
        alertType,
        trade.tokenMint,
        trade.tokenSymbol,
        trade.solAmount,
        description
      );

      // Update whale metrics
      await updateWhaleMetrics(walletAddress);
    }
  } catch (error: any) {
    logger.error('Error processing trade for whale detection:', error);
  }
}
