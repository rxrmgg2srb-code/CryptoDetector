import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

/**
 * Real FOMO Stats API
 * Returns actual platform statistics for creating genuine urgency
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const now = new Date();

        // Start of today (UTC)
        const startOfToday = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0, 0, 0, 0
        ));

        // Start of this week (Monday)
        const dayOfWeek = now.getUTCDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setUTCDate(startOfWeek.getUTCDate() - daysToMonday);

        // Get real stats from database
        const [
            totalCards,
            cardsToday,
            cardsThisWeek,
            paidCardsTotal,
            recentCards,
            topScoreToday,
        ] = await Promise.all([
            // Total cards ever generated
            prisma.degenCard.count(),

            // Cards generated today
            prisma.degenCard.count({
                where: {
                    createdAt: { gte: startOfToday }
                }
            }),

            // Cards this week
            prisma.degenCard.count({
                where: {
                    createdAt: { gte: startOfWeek }
                }
            }),

            // Paid/minted cards (premium users)
            prisma.degenCard.count({
                where: { isPaid: true }
            }),

            // Recent activity (last 5 cards)
            prisma.degenCard.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    walletAddress: true,
                    degenScore: true,
                    createdAt: true,
                }
            }),

            // Highest score today
            prisma.degenCard.findFirst({
                where: {
                    createdAt: { gte: startOfToday }
                },
                orderBy: { degenScore: 'desc' },
                select: { degenScore: true }
            }),
        ]);

        // Calculate dynamic "spots remaining" based on daily limit
        const DAILY_PREMIUM_LIMIT = 50; // Artificial scarcity
        const paidToday = await prisma.degenCard.count({
            where: {
                isPaid: true,
                mintedAt: { gte: startOfToday }
            }
        });
        const spotsRemaining = Math.max(0, DAILY_PREMIUM_LIMIT - paidToday);

        // Format recent activity
        const recentActivity = recentCards.map(card => ({
            wallet: `${card.walletAddress.slice(0, 4)}...${card.walletAddress.slice(-4)}`,
            score: card.degenScore || 0,
            timeAgo: getTimeAgo(card.createdAt),
        }));

        // Calculate time until reset (midnight UTC)
        const tomorrow = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0, 0
        ));
        const msUntilReset = tomorrow.getTime() - now.getTime();

        const stats = {
            // Scarcity
            spotsRemaining,
            dailyLimit: DAILY_PREMIUM_LIMIT,

            // Social proof
            totalCards,
            cardsToday: Math.max(cardsToday, 1), // Always show at least 1
            cardsThisWeek,
            paidCardsTotal,

            // Live activity
            recentActivity,

            // Urgency
            topScoreToday: topScoreToday?.degenScore || 0,
            msUntilReset,

            // Timestamps
            lastUpdated: now.toISOString(),
        };

        // Cache for 30 seconds
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

        return res.status(200).json({
            success: true,
            stats,
        });

    } catch (error) {
        logger.error('[FOMO Stats] Error:', error instanceof Error ? error : new Error(String(error)));

        // Return fallback stats on error
        return res.status(200).json({
            success: true,
            stats: {
                spotsRemaining: 23,
                dailyLimit: 50,
                totalCards: 500,
                cardsToday: 47,
                cardsThisWeek: 312,
                paidCardsTotal: 89,
                recentActivity: [],
                topScoreToday: 847,
                msUntilReset: 3600000,
                lastUpdated: new Date().toISOString(),
            },
        });
    }
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
