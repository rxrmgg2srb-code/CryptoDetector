import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimitRedis';

/**
 * 🏆 Season Stats API
 * 
 * Returns current season statistics including:
 * - Prize pool amount
 * - Total sales count
 * - Season end date
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limit
    if (!(await rateLimit(req, res))) return;

    try {
        // Count total paid cards (Season 1 sales)
        const totalSales = await prisma.degenCard.count({
            where: { isPaid: true }
        });

        // Calculate prize pool: 3 SOL per 100 cards (starts at 0)
        const baseSeed = 0;
        const contributedFromSales = Math.floor(totalSales / 100) * 3;
        const prizePool = baseSeed + contributedFromSales;

        // Season end date (30 days from now or fixed date)
        // For now, using a static end date - adjust as needed
        const seasonEndDate = new Date();
        seasonEndDate.setDate(seasonEndDate.getDate() + 27); // ~27 days remaining

        res.status(200).json({
            success: true,
            prizePool,
            totalSales,
            seasonEndDate: seasonEndDate.toISOString(),
            daysRemaining: 27,
            nextMilestone: Math.ceil(totalSales / 100) * 100,
            salesUntilNextBonus: 100 - (totalSales % 100),
        });
    } catch (error) {
        console.error('Failed to fetch season stats:', error);
        res.status(500).json({ error: 'Failed to fetch season stats' });
    }
}
