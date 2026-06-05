import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyAdminAuth } from '../../../lib/adminAuth';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticación de admin
    const authResult = verifyAdminAuth(req);
    if (!authResult.authorized) {
      return res.status(403).json({
        error: 'Forbidden',
        details: authResult.error,
      });
    }

    logger.info(`🔐 Admin authorized: ${authResult.wallet}`);
    logger.info('🔄 Updating weekly challenge prizes...');

    // Update all challenges que tengan 3.0 SOL a 1.0 SOL
    const result = await prisma.weeklyChallenge.updateMany({
      where: {
        prizeSOL: 3.0,
      },
      data: {
        prizeSOL: 1.0,
        minCardsRequired: 100,
      },
    });

    logger.info(`✅ Updated ${result.count} challenge(s)`);

    // Obtener challenges recientes
    const challenges = await prisma.weeklyChallenge.findMany({
      orderBy: {
        startDate: 'desc',
      },
      take: 10,
    });

    res.status(200).json({
      success: true,
      message: `Updated ${result.count} challenge(s) from 3 SOL to 1 SOL`,
      updatedCount: result.count,
      recentChallenges: challenges.map((c) => ({
        week: c.week,
        year: c.year,
        title: c.title,
        prizeSOL: c.prizeSOL,
        minCardsRequired: c.minCardsRequired,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
    });
  } catch (error: any) {
    logger.error('❌ Error updating challenges:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to update challenges',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
