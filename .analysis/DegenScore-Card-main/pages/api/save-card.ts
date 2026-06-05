import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { isValidSolanaAddress } from '../../lib/validation';
import { rateLimit } from '../../lib/rateLimitRedis';
import { logger } from '../../lib/logger';
import { sanitizeText } from '../../lib/sanitize';
import { cacheDel, CacheKeys } from '../../lib/cache/redis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  if (!(await rateLimit(req, res))) {
    return;
  }

  try {
    const { walletAddress, analysisData } = req.body;

    // Validate inputs
    if (!walletAddress || !analysisData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    logger.info('💾 Saving card for wallet:', { walletAddress });
    logger.info('📊 Analysis data received:', {
      degenScore: analysisData.degenScore,
      totalTrades: analysisData.totalTrades,
      totalVolume: analysisData.totalVolume,
      profitLoss: analysisData.profitLoss,
      winRate: analysisData.winRate,
    });

    // Convert badges to correct format with XSS sanitization
    const badgesData = (analysisData.badges || []).map((badge: any) => ({
      name: sanitizeText(String(badge.name || '')).slice(0, 100),
      description: sanitizeText(String(badge.description || '')).slice(0, 500),
      icon: sanitizeText(String(badge.icon || '')).slice(0, 50),
      rarity: String(badge.rarity || 'COMMON').toUpperCase(),
    }));

    // Preparar datos para Prisma
    const cardData = {
      degenScore: Number(analysisData.degenScore) || 0,
      totalTrades: Number(analysisData.totalTrades) || 0,
      totalVolume: Number(analysisData.totalVolume) || 0,
      profitLoss: Number(analysisData.profitLoss) || 0,
      winRate: Number(analysisData.winRate) || 0,
      bestTrade: Number(analysisData.bestTrade) || 0,
      worstTrade: Number(analysisData.worstTrade) || 0,
      avgTradeSize: Number(analysisData.avgTradeSize) || 0,
      totalFees: Number(analysisData.totalFees) || 0,
      tradingDays: Number(analysisData.tradingDays) || 0,
      level: Number(analysisData.level) || 1,
      xp: Number(analysisData.xp) || 0,
      rugsSurvived: Number(analysisData.rugsSurvived) || 0,
      rugsCaught: Number(analysisData.rugsCaught) || 0,
      totalRugValue: Number(analysisData.totalRugValue) || 0,
      moonshots: Number(analysisData.moonshots) || 0,
      avgHoldTime: Number(analysisData.avgHoldTime) || 0,
      quickFlips: Number(analysisData.quickFlips) || 0,
      diamondHands: Number(analysisData.diamondHands) || 0,
      realizedPnL: Number(analysisData.realizedPnL) || 0,
      unrealizedPnL: Number(analysisData.unrealizedPnL) || 0,
      firstTradeDate: analysisData.firstTradeDate ? new Date(analysisData.firstTradeDate) : null,
      longestWinStreak: Number(analysisData.longestWinStreak) || 0,
      longestLossStreak: Number(analysisData.longestLossStreak) || 0,
      volatilityScore: Number(analysisData.volatilityScore) || 0,
      lastSeen: new Date(),
    };

    // Usar upsert para crear o actualizar
    const card = await prisma.degenCard.upsert({
      where: { walletAddress },
      update: {
        ...cardData,
        badges: {
          deleteMany: {},
          create: badgesData,
        },
      },
      create: {
        walletAddress,
        ...cardData,
        badges: {
          create: badgesData,
        },
      },
      include: {
        badges: true,
      },
    });

    logger.info('✅ Card saved successfully:', { cardId: card.id });
    logger.info('💾 Saved card data:', {
      degenScore: card.degenScore,
      totalTrades: card.totalTrades,
      totalVolume: card.totalVolume,
      profitLoss: card.profitLoss,
      winRate: card.winRate,
      isPaid: card.isPaid,
    });

    // Invalidate cached card image so it regenerates with new data
    const cacheKey = CacheKeys.cardImage(walletAddress);
    logger.info('🗑️ Attempting to clear cache for key:', { cacheKey });
    const cacheDeleted = await cacheDel(cacheKey);
    if (cacheDeleted) {
      logger.info('✅ Successfully cleared cached card image for wallet');
    } else {
      logger.warn('⚠️ Cache key was not found or already cleared');
    }

    res.status(200).json({ success: true, card });
  } catch (error: any) {
    logger.error('Error saving card:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to save card';

    res.status(500).json({ error: errorMessage });
  }
}
