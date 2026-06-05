import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimitRedis';

/**
 * 🔥 Recent Sales API
 * 
 * Returns the most recent card purchases for the live feed.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limit
    if (!(await rateLimit(req, res))) return;

    try {
        // Get recent paid cards (last 10)
        const recentCards = await prisma.degenCard.findMany({
            where: { isPaid: true },
            orderBy: { mintedAt: 'desc' },
            take: 10,
            select: {
                walletAddress: true,
                mintedAt: true,
            }
        });

        // Format for frontend
        const sales = recentCards.map(card => ({
            wallet: card.walletAddress,
            timestamp: card.mintedAt?.getTime() || Date.now(),
            amount: 0.1, // Fixed price per card
        }));

        res.status(200).json({
            success: true,
            sales,
        });
    } catch (error) {
        console.error('Failed to fetch recent sales:', error);
        res.status(500).json({ error: 'Failed to fetch recent sales' });
    }
}
