import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';

// Whale thresholds - traders with these minimums qualify as "whales"
const MIN_VOLUME = 1000; // $1000 minimum volume
const MIN_WIN_RATE = 55; // 55% minimum win rate
const MIN_TRADES = 10; // At least 10 trades

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    // First try to get from WhaleWallet table
    const whaleWallets = await prisma.whaleWallet.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: [
        { totalVolume: 'desc' },
        { winRate: 'desc' },
      ],
    });

    // If we have whales in the dedicated table, use them
    if (whaleWallets.length > 0) {
      return res.status(200).json({
        success: true,
        count: whaleWallets.length,
        source: 'whaleWallet',
        whales: whaleWallets.map(w => ({
          id: w.id,
          walletAddress: w.walletAddress,
          nickname: w.label || `Whale ${w.tier}`,
          totalVolume: w.totalVolume,
          winRate: w.winRate,
          avgPositionSize: w.avgTradeSize,
          followersCount: 0,
          totalProfit: 0,
          topTokens: [],
          lastActive: w.lastTradeAt?.toISOString() || new Date().toISOString(),
          tier: w.tier,
        })),
      });
    }

    // Fallback: Get top traders from DegenCard table
    const topCards = await prisma.degenCard.findMany({
      where: {
        totalVolume: { gte: MIN_VOLUME },
        winRate: { gte: MIN_WIN_RATE },
        totalTrades: { gte: MIN_TRADES },
      },
      orderBy: [
        { totalVolume: 'desc' },
        { winRate: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        walletAddress: true,
        displayName: true,
        totalVolume: true,
        winRate: true,
        avgTradeSize: true,
        totalTrades: true,
        profitLoss: true,
        updatedAt: true,
      },
    });

    // Transform DegenCard data to whale format
    const whales = topCards.map((card, index) => ({
      id: card.id,
      walletAddress: card.walletAddress,
      nickname: card.displayName || `Whale #${index + 1}`,
      totalVolume: card.totalVolume,
      winRate: card.winRate,
      avgPositionSize: card.avgTradeSize || 0,
      followersCount: 0,
      totalProfit: card.profitLoss || 0,
      topTokens: [],
      lastActive: card.updatedAt?.toISOString() || new Date().toISOString(),
      tier: card.totalVolume >= 10000 ? 'megawhale' : card.totalVolume >= 1000 ? 'whale' : 'shark',
    }));

    logger.info(`Returning ${whales.length} whales from DegenCard table`);

    return res.status(200).json({
      success: true,
      count: whales.length,
      source: 'degencard',
      whales,
    });
  } catch (error: any) {
    logger.error('Error in /api/whales/top:', error);
    return res.status(500).json({
      error: 'Failed to fetch whales',
      message: error.message,
    });
  }
}


