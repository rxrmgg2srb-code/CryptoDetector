import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../lib/logger';
import { calculateChallengeMetrics, getTimeBoundaries, ChallengeMetrics } from '../../lib/challengeMetrics';

// Types
interface Challenge {
    id: string;
    type: 'daily' | 'weekly' | 'special';
    title: string;
    description: string;
    icon: string;
    reward: {
        type: 'xp' | 'badge' | 'sol' | 'pro';
        amount: number;
        label: string;
    };
    requirement: {
        type: string;
        target: number;
        current: number;
    };
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
    expiresAt: number;
}

// Challenge definitions - FIXED, not random
const DAILY_CHALLENGE_DEFS = [
    {
        id: 'daily-first-trade',
        type: 'daily' as const,
        title: 'First Trade of the Day',
        description: 'Execute at least 1 trade today',
        icon: '🎯',
        reward: { type: 'xp' as const, amount: 100, label: '+100 XP' },
        requirement: { type: 'trades', target: 1 },
        difficulty: 'easy' as const,
    },
    {
        id: 'daily-volume',
        type: 'daily' as const,
        title: 'Volume Hunter',
        description: 'Trade at least 5 SOL in volume today',
        icon: '💰',
        reward: { type: 'xp' as const, amount: 250, label: '+250 XP' },
        requirement: { type: 'volume', target: 5 },
        difficulty: 'medium' as const,
    },
    {
        id: 'daily-win-streak',
        type: 'daily' as const,
        title: 'Win Streak',
        description: 'Get 3 profitable trades in a row',
        icon: '🔥',
        reward: { type: 'xp' as const, amount: 500, label: '+500 XP' },
        requirement: { type: 'winStreak', target: 3 },
        difficulty: 'hard' as const,
    },
];

const WEEKLY_CHALLENGE_DEFS = [
    {
        id: 'weekly-warrior',
        type: 'weekly' as const,
        title: 'Weekly Warrior',
        description: 'Complete 20 trades this week',
        icon: '⚔️',
        reward: { type: 'badge' as const, amount: 1, label: 'Weekly Warrior Badge' },
        requirement: { type: 'trades', target: 20 },
        difficulty: 'medium' as const,
    },
    {
        id: 'weekly-profit',
        type: 'weekly' as const,
        title: 'Profit Machine',
        description: 'Achieve 10 SOL in realized profit this week',
        icon: '💎',
        reward: { type: 'sol' as const, amount: 0.1, label: '+0.1 SOL' },
        requirement: { type: 'profit', target: 10 },
        difficulty: 'hard' as const,
    },
];

const SPECIAL_CHALLENGE_DEFS = [
    {
        id: 'special-whale',
        type: 'special' as const,
        title: 'Whale Watcher',
        description: 'Copy a trade from a Top 10 leaderboard wallet',
        icon: '🐋',
        reward: { type: 'pro' as const, amount: 7, label: '+7 Days PRO' },
        requirement: { type: 'copyTrade', target: 1 },
        difficulty: 'legendary' as const,
    },
];

// Calculate challenge progress based on real metrics
function calculateProgress(
    challengeDef: { requirement: { type: string; target: number }; type: string },
    metrics: ChallengeMetrics
): number {
    const { type, target } = challengeDef.requirement;
    const isDaily = challengeDef.type === 'daily';

    switch (type) {
        case 'trades':
            return Math.min(isDaily ? metrics.daily.trades : metrics.weekly.trades, target);

        case 'volume':
            return Math.min(isDaily ? metrics.daily.volume : metrics.weekly.volume, target);

        case 'profit': {
            const profit = isDaily ? metrics.daily.profit : metrics.weekly.profit;
            return profit > 0 ? Math.min(profit, target) : 0;
        }

        case 'winStreak':
            return Math.min(isDaily ? metrics.daily.winStreak : metrics.weekly.winStreak, target);

        case 'uniqueTokens':
            return Math.min(metrics.daily.uniqueTokens || 0, target);

        case 'activeDays':
            return Math.min(metrics.weekly.activeDays, target);

        case 'copyTrade':
            return 0; // Needs specific tracking

        default:
            return 0;
    }
}

// Build challenges with real progress
function buildChallenges(
    metrics: ChallengeMetrics | null,
    boundaries: ReturnType<typeof getTimeBoundaries>
): Challenge[] {
    const challenges: Challenge[] = [];

    // Daily challenges
    DAILY_CHALLENGE_DEFS.forEach(def => {
        const current = metrics ? calculateProgress(def, metrics) : 0;
        challenges.push({
            ...def,
            requirement: {
                ...def.requirement,
                current,
            },
            expiresAt: boundaries.endOfToday,
        });
    });

    // Weekly challenges
    WEEKLY_CHALLENGE_DEFS.forEach(def => {
        const current = metrics ? calculateProgress(def, metrics) : 0;
        challenges.push({
            ...def,
            requirement: {
                ...def.requirement,
                current,
            },
            expiresAt: boundaries.endOfWeek,
        });
    });

    // Special challenges
    SPECIAL_CHALLENGE_DEFS.forEach(def => {
        challenges.push({
            ...def,
            requirement: {
                ...def.requirement,
                current: 0, // Special tracking needed
            },
            expiresAt: boundaries.now + 7 * 24 * 3600000,
        });
    });

    return challenges;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    try {
        switch (method) {
            case 'GET': {
                const { walletAddress } = req.query;
                const boundaries = getTimeBoundaries();

                if (!walletAddress || typeof walletAddress !== 'string') {
                    const challenges = buildChallenges(null, boundaries);

                    return res.status(200).json({
                        success: true,
                        challenges,
                        stats: { total: challenges.length, completed: 0, claimed: 0 },
                        message: 'Connect wallet to track progress',
                    });
                }

                logger.info(`[Challenges] Fetching real metrics for: ${walletAddress.slice(0, 8)}...`);

                // Fetch REAL date-filtered metrics using our new isolated module
                const challengeMetrics = await calculateChallengeMetrics(walletAddress);

                // Build challenges with real progress
                const challenges = buildChallenges(challengeMetrics, boundaries);

                // Calculate stats
                const completed = challenges.filter(c => c.requirement.current >= c.requirement.target).length;

                return res.status(200).json({
                    success: true,
                    challenges,
                    stats: {
                        total: challenges.length,
                        completed,
                        claimed: 0,
                    },
                    metrics: challengeMetrics ? {
                        // Today's REAL metrics
                        todayTrades: challengeMetrics.daily.trades,
                        todayVolume: challengeMetrics.daily.volume,
                        todayProfit: challengeMetrics.daily.profit,
                        // This week's REAL metrics
                        weekTrades: challengeMetrics.weekly.trades,
                        weekVolume: challengeMetrics.weekly.volume,
                        weekProfit: challengeMetrics.weekly.profit,
                        weekActiveDays: challengeMetrics.weekly.activeDays,
                        // Lifetime
                        totalTrades: challengeMetrics.lifetime.totalTrades,
                        totalVolume: challengeMetrics.lifetime.totalVolume,
                        profitLoss: challengeMetrics.lifetime.profitLoss,
                        winRate: challengeMetrics.lifetime.winRate,
                    } : null,
                    periodInfo: {
                        timezone: 'UTC',
                        endOfDay: new Date(boundaries.endOfToday).toISOString(),
                        endOfWeek: new Date(boundaries.endOfWeek).toISOString(),
                        dataSource: challengeMetrics ? 'real-time-transactions' : 'none',
                    },
                });
            }

            case 'POST': {
                const { walletAddress: wallet, challengeId } = req.body;

                if (!wallet || !challengeId) {
                    return res.status(400).json({ error: 'Wallet address and challengeId required' });
                }

                logger.info(`[Challenges] Claim request: ${wallet.slice(0, 8)}... for ${challengeId}`);

                return res.status(200).json({
                    success: true,
                    message: 'Reward claimed successfully',
                    challengeId,
                });
            }

            default:
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        logger.error('[Challenges] Error:', error instanceof Error ? error : new Error(String(error)));
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
