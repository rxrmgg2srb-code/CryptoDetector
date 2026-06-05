import type { NextApiRequest, NextApiResponse } from 'next';
import { calculateAdvancedMetrics } from '../../lib/metrics';
import { generateBadges } from '../../lib/badges-generator';
import { isValidSolanaAddress } from '../../lib/validation';
import { strictRateLimit } from '../../lib/rateLimitRedis';
import { logger } from '../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply strict rate limiting (expensive operation)
  if (!(await strictRateLimit(req, res))) {
    return;
  }

  try {
    const { walletAddress } = req.body;

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    logger.info('Analyzing wallet:', { walletAddress });

    // PERFORMANCE: Timeout de 50 seconds para fallar antes del límite de Vercel (60s)
    const metricsPromise = calculateAdvancedMetrics(walletAddress);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Analysis timeout - wallet took too long to analyze')),
        50000 // 50 seconds - fail before Vercel's 60s hard limit
      )
    );

    let metrics;
    try {
      metrics = await Promise.race([metricsPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        logger.warn('Wallet analysis timeout:', { walletAddress });
        return res.status(504).json({
          error:
            'El análisis está tomando demasiado tiempo. Por favor intenta de nuevo en unos minutos.',
          details: 'Wallet analysis timeout',
        });
      }
      throw error;
    }

    logger.info('✅ Analysis complete for wallet:', { walletAddress });

    // Validar que tenemos datos reales
    if (!metrics || (metrics.degenScore === 0 && metrics.totalTrades === 0)) {
      logger.warn('⚠️ Wallet has no trading activity or analysis returned default values:', {
        walletAddress,
        degenScore: metrics?.degenScore,
        totalTrades: metrics?.totalTrades,
      });
    } else {
      logger.info('📊 Metrics summary:', {
        degenScore: metrics.degenScore,
        totalTrades: metrics.totalTrades,
        profitLoss: metrics.profitLoss,
        winRate: metrics.winRate,
      });
    }

    // 2. Generate badges usando la función encapsulada (MÁS LIMPIO)
    const badges = generateBadges(metrics); // <--- LÓGICA EXTRAÍDA AQUÍ

    // Preparar respuesta con los datos reales
    const analysisData = {
      // Uso de Number() es redundante si TypeScript está configurado correctamente
      // pero se mantiene si es necesario asegurar el tipo en la respuesta JSON.
      degenScore: metrics.degenScore,
      totalTrades: metrics.totalTrades,
      totalVolume: metrics.totalVolume,
      profitLoss: metrics.profitLoss,
      winRate: metrics.winRate,
      bestTrade: metrics.bestTrade,
      worstTrade: metrics.worstTrade,
      avgTradeSize: metrics.avgTradeSize,
      totalFees: metrics.totalFees,
      tradingDays: metrics.tradingDays,
      level: Math.floor(metrics.degenScore / 10) + 1,
      xp: metrics.degenScore * 10,
      rugsSurvived: metrics.rugsSurvived,
      rugsCaught: metrics.rugsCaught,
      totalRugValue: metrics.totalRugValue,
      moonshots: metrics.moonshots,
      avgHoldTime: metrics.avgHoldTime,
      quickFlips: metrics.quickFlips,
      diamondHands: metrics.diamondHands,
      realizedPnL: metrics.realizedPnL,
      unrealizedPnL: metrics.unrealizedPnL,
      firstTradeDate: new Date(metrics.firstTradeDate * 1000).toISOString(),
      longestWinStreak: metrics.longestWinStreak,
      longestLossStreak: metrics.longestLossStreak,
      volatilityScore: metrics.volatilityScore,
      badges, // <--- LISTA DE BADGES GENERADA
    };

    res.status(200).json(analysisData);
  } catch (error: any) {
    logger.error('Error analyzing wallet:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    // Don't expose internal error details in production
    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to analyze wallet';

    res.status(500).json({
      error: errorMessage,
    });
  }
}
