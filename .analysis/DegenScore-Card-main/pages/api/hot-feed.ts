import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.query;

    // 1. Determinar el tier del usuario
    let tier = 'FREE';
    let actualTier = 'FREE'; // Para tracking interno

    if (walletAddress) {
      const subscription = await prisma.subscription.findUnique({
        where: { walletAddress: walletAddress as string },
      });

      if (subscription) {
        actualTier = subscription.tier;

        // Verificar si la suscripción PRO expiró
        if (
          subscription.tier === 'PRO' &&
          subscription.seasonExpiresAt &&
          subscription.seasonExpiresAt <= new Date()
        ) {
          // Downgrade automático a PREMIUM (pagas una vez, tienes acceso permanente con delay)
          await prisma.subscription.update({
            where: { walletAddress: walletAddress as string },
            data: {
              tier: 'PREMIUM',
              seasonExpiresAt: null, // Acceso permanente a PREMIUM
            },
          });
          tier = 'PREMIUM';
          logger.info(`⬇️ Downgraded ${walletAddress} from PRO to PREMIUM (trial expired)`);
        } else if (!subscription.seasonExpiresAt || subscription.seasonExpiresAt > new Date()) {
          tier = subscription.tier;
        } else {
          // Si hay isPaid en la card, debería tener al menos PREMIUM
          const card = await prisma.degenCard.findUnique({
            where: { walletAddress: walletAddress as string },
            select: { isPaid: true },
          });

          if (card?.isPaid) {
            tier = 'PREMIUM';
          }
        }
      }
    }

    logger.info(`📊 Fetching hot feed for tier: ${tier} (actual: ${actualTier})`);

    // 2. Calcular el delay según el tier (PLAN DE NEGOCIO)
    let delayHours = 72; // FREE: 72h delay
    if (tier === 'PREMIUM') {
      delayHours = 6;
    } // PREMIUM: 6h delay (después del trial)
    if (tier === 'PRO') {
      delayHours = 1;
    } // PRO: Near real-time (1h delay for safety)

    const delayTimestamp = new Date(Date.now() - delayHours * 60 * 60 * 1000);

    // 3. Obtener trades según el tier
    const limit = tier === 'FREE' ? 5 : tier === 'PREMIUM' ? 10 : 20;

    const trades = await prisma.hotTrade.findMany({
      where: {
        timestamp: { lte: delayTimestamp },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // 4. Formatear respuesta según tier
    const formattedTrades = trades.map((trade) => ({
      id: trade.id,
      degen:
        tier === 'FREE'
          ? `${trade.walletAddress.slice(0, 4)}...${trade.walletAddress.slice(-4)}`
          : trade.displayName || trade.walletAddress,
      degenScore: trade.degenScore,
      type: trade.type,
      solAmount: tier === 'FREE' ? '???' : trade.solAmount.toFixed(2),
      tokenMint: tier === 'PRO' ? trade.tokenMint : `${trade.tokenMint.slice(0, 6)}...`,
      tokenSymbol: trade.tokenSymbol || 'TOKEN',
      timestamp: trade.timestamp,
      timeAgo: getTimeAgo(trade.timestamp),
    }));

    res.status(200).json({
      success: true,
      tier,
      delay: delayHours === 1 ? 'near real-time' : `${delayHours}h`,
      trades: formattedTrades,
      upgradeAvailable: tier !== 'PRO',
      trialInfo:
        tier === 'PRO'
          ? 'Active 30-day trial'
          : tier === 'PREMIUM'
            ? 'Upgrade to PRO for real-time'
            : 'Upgrade to Premium for better access',
    });
  } catch (error) {
    logger.error('❌ Error fetching hot feed:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to fetch hot feed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getTimeAgo(timestamp: Date): string {
  const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }
  return `${Math.floor(seconds / 86400)}d ago`;
}
