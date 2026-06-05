import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        error: 'Missing walletAddress',
      });
    }

    // Obtener todos los referidos
    const referrals = await prisma.referral.findMany({
      where: {
        referrerAddress: walletAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Contar stats
    const totalReferrals = referrals.length;
    const paidReferrals = referrals.filter((r) => r.hasPaid).length;
    const pendingReferrals = totalReferrals - paidReferrals;

    // Calcular potencial reward (para mostrar cuánto ganarían)
    // Por ahora 0, pero en el futuro será automático
    const potentialEarnings = 0; // paidReferrals * REWARD_PER_REFERRAL;

    res.status(200).json({
      success: true,
      stats: {
        total: totalReferrals,
        paid: paidReferrals,
        pending: pendingReferrals,
        potentialEarnings, // SOL
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        referredAddress: r.referredAddress,
        hasPaid: r.hasPaid,
        paidAt: r.paidAt,
        createdAt: r.createdAt,
      })),
      message:
        paidReferrals >= 3
          ? `🎉 You have ${paidReferrals} paid referrals! Rewards coming soon!`
          : `${3 - paidReferrals} more paid referrals to unlock rewards`,
    });
  } catch (error) {
    logger.error('Error fetching referrals:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to fetch referrals',
    });
  }
}
