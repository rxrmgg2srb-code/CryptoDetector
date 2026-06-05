import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { isValidSolanaAddress } from '../../../lib/validation';
import { logger } from '../../../lib/logger';
import { sanitizeText } from '../../../lib/sanitize';
import { cacheDel, CacheKeys } from '../../../lib/cache/redis';

// 🔒 Admin wallet autorizada para usar el modo espía
const ADMIN_WALLET = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminWallet, targetWallet, analysisData, profileData } = req.body;

    // 🔒 SECURITY: Verificar que quien llama es el admin
    if (adminWallet !== ADMIN_WALLET) {
      logger.warn('Unauthorized spy mode access attempt', { attemptedBy: adminWallet });
      return res.status(403).json({ error: 'Unauthorized: Admin access only' });
    }

    // Validar datos requeridos
    if (!targetWallet || !analysisData) {
      return res.status(400).json({ error: 'Missing required fields: targetWallet or analysisData' });
    }

    if (!isValidSolanaAddress(targetWallet)) {
      return res.status(400).json({ error: 'Invalid target wallet address' });
    }

    logger.info('🕵️ Spy Mode: Admin saving premium card', {
      admin: adminWallet,
      target: targetWallet,
    });

    // Sanitizar datos de perfil
    const safeProfileData = {
      displayName: profileData?.displayName
        ? sanitizeText(String(profileData.displayName)).slice(0, 50)
        : null,
      twitter: profileData?.twitter ? sanitizeText(String(profileData.twitter)).slice(0, 50) : null,
      telegram: profileData?.telegram
        ? sanitizeText(String(profileData.telegram)).slice(0, 50)
        : null,
      profileImage: profileData?.profileImage
        ? sanitizeText(String(profileData.profileImage)).slice(0, 500)
        : null,
    };

    // Convert badges to correct format with XSS sanitization
    const badgesData = (analysisData.badges || []).map((badge: any) => ({
      name: sanitizeText(String(badge.name || '')).slice(0, 100),
      description: sanitizeText(String(badge.description || '')).slice(0, 500),
      icon: sanitizeText(String(badge.icon || '')).slice(0, 50),
      rarity: String(badge.rarity || 'COMMON').toUpperCase(),
    }));

    // Preparar datos completos para la card
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
      // 🎁 MODO ESPÍA: Marcar como pagada gratis (sin transacción)
      isPaid: true,
      // Agregar datos de perfil
      ...safeProfileData,
    };

    // Usar upsert para crear o actualizar
    const card = await prisma.degenCard.upsert({
      where: { walletAddress: targetWallet },
      update: {
        ...cardData,
        badges: {
          deleteMany: {},
          create: badgesData,
        },
      },
      create: {
        walletAddress: targetWallet,
        ...cardData,
        badges: {
          create: badgesData,
        },
      },
      include: {
        badges: true,
      },
    });

    logger.info('✅ Spy Mode: Premium card saved successfully', {
      cardId: card.id,
      isPaid: card.isPaid,
      displayName: card.displayName,
    });

    // Invalidar cache de la imagen para regenerarla
    const cacheKey = CacheKeys.cardImage(targetWallet);
    await cacheDel(cacheKey);
    logger.info('🗑️ Cache cleared for card image');

    // También invalidar cache del leaderboard
    await cacheDel('leaderboard:*');
    logger.info('🗑️ Leaderboard cache cleared');

    res.status(200).json({
      success: true,
      message: 'Premium card saved to leaderboard (free via spy mode)',
      card: {
        id: card.id,
        walletAddress: card.walletAddress,
        displayName: card.displayName,
        degenScore: card.degenScore,
        isPaid: card.isPaid,
      },
    });
  } catch (error: any) {
    logger.error('Error in spy mode save-card', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Failed to save card in spy mode';

    res.status(500).json({ error: errorMessage });
  }
}
