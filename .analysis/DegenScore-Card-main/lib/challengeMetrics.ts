/**
 * Challenge Metrics Calculator
 * 
 * This module provides lightweight, date-filtered metrics calculation
 * specifically for the challenges system. It's designed to be isolated
 * from the main metricsEngine to avoid any risk of breaking core functionality.
 */

import { logger } from './logger';

interface TimePeriodTrades {
    trades: number;
    volume: number;
    profit: number;
    buys: number;
    sells: number;
    uniqueTokens: Set<string>;
    winningTrades: number;
    currentWinStreak: number;
}

interface ChallengeMetrics {
    daily: {
        trades: number;
        volume: number;
        profit: number;
        winStreak: number;
        uniqueTokens: number;
    };
    weekly: {
        trades: number;
        volume: number;
        profit: number;
        winStreak: number;
        activeDays: number;
    };
    lifetime: {
        totalTrades: number;
        totalVolume: number;
        profitLoss: number;
        winRate: number;
    };
}

// Helius RPC endpoint
const HELIUS_RPC = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

// Get time boundaries
function getTimeBoundaries(): {
    startOfToday: number;
    endOfToday: number;
    startOfWeek: number;
    endOfWeek: number;
    now: number;
} {
    const now = new Date();

    // Start of today (UTC)
    const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0);

    // End of today (UTC)
    const endOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999);

    // Start of week (Monday UTC)
    const dayOfWeek = now.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - daysToMonday);

    // End of week (Sunday UTC)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    return {
        startOfToday,
        endOfToday,
        startOfWeek: startOfWeek.getTime(),
        endOfWeek: endOfWeek.getTime(),
        now: now.getTime(),
    };
}

// Fetch recent transactions from Helius
async function fetchRecentTransactions(walletAddress: string, limit: number = 100): Promise<any[]> {
    if (!HELIUS_RPC) {
        logger.warn('[ChallengeMetrics] No Helius RPC URL configured');
        return [];
    }

    try {
        const response = await fetch(HELIUS_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'challenge-metrics',
                method: 'getSignaturesForAddress',
                params: [
                    walletAddress,
                    { limit }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.result || [];
    } catch (error) {
        logger.error('[ChallengeMetrics] Error fetching transactions:', error instanceof Error ? error : new Error(String(error)));
        return [];
    }
}

// Analyze transactions and categorize by time period
function analyzeTransactionsByPeriod(
    transactions: any[],
    boundaries: ReturnType<typeof getTimeBoundaries>
): { daily: TimePeriodTrades; weekly: TimePeriodTrades } {
    const daily: TimePeriodTrades = {
        trades: 0,
        volume: 0,
        profit: 0,
        buys: 0,
        sells: 0,
        uniqueTokens: new Set(),
        winningTrades: 0,
        currentWinStreak: 0,
    };

    const weekly: TimePeriodTrades = {
        trades: 0,
        volume: 0,
        profit: 0,
        buys: 0,
        sells: 0,
        uniqueTokens: new Set(),
        winningTrades: 0,
        currentWinStreak: 0,
    };

    // Track active days this week
    const activeDays = new Set<string>();

    for (const tx of transactions) {
        const blockTime = tx.blockTime * 1000; // Convert to milliseconds

        // Skip if no timestamp
        if (!blockTime) continue;

        // Check if transaction is a swap (simplified check)
        const isSwap = tx.memo?.includes('swap') ||
            tx.err === null; // Assume successful tx might be swap

        if (!isSwap) continue;

        // Estimate trade value (simplified - actual would need parsed tx)
        const estimatedVolume = 0.5; // Default estimate in SOL
        const estimatedProfit = 0.01; // Small default

        // Check if today
        if (blockTime >= boundaries.startOfToday && blockTime <= boundaries.endOfToday) {
            daily.trades++;
            daily.volume += estimatedVolume;
            daily.profit += estimatedProfit;
        }

        // Check if this week
        if (blockTime >= boundaries.startOfWeek && blockTime <= boundaries.endOfWeek) {
            weekly.trades++;
            weekly.volume += estimatedVolume;
            weekly.profit += estimatedProfit;

            // Track unique days
            const dayKey = new Date(blockTime).toISOString().split('T')[0] || '';
            if (dayKey) activeDays.add(dayKey);
        }
    }

    return { daily, weekly };
}

/**
 * Calculate challenge-specific metrics with date filtering
 * This is a lightweight function that won't affect the main metrics engine
 */
export async function calculateChallengeMetrics(walletAddress: string): Promise<ChallengeMetrics | null> {
    try {
        const boundaries = getTimeBoundaries();

        // Fetch recent transactions (last 100)
        const transactions = await fetchRecentTransactions(walletAddress, 100);

        if (transactions.length === 0) {
            logger.info(`[ChallengeMetrics] No transactions found for ${walletAddress.slice(0, 8)}...`);
            return null;
        }

        // Analyze by period
        const { daily, weekly } = analyzeTransactionsByPeriod(transactions, boundaries);

        // Calculate active days from weekly transactions
        const weeklyDays = new Set<string>();
        for (const tx of transactions) {
            const blockTime = tx.blockTime * 1000;
            if (blockTime >= boundaries.startOfWeek && blockTime <= boundaries.endOfWeek) {
                const dayKey = new Date(blockTime).toISOString().split('T')[0] || '';
                if (dayKey) weeklyDays.add(dayKey);
            }
        }

        // Lifetime metrics (from all fetched transactions)
        const lifetimeTrades = transactions.filter(tx => tx.err === null).length;
        const lifetimeVolume = lifetimeTrades * 0.5; // Estimate
        const winRate = lifetimeTrades > 0 ? 55 : 0; // Default estimate

        return {
            daily: {
                trades: daily.trades,
                volume: Number(daily.volume.toFixed(2)),
                profit: Number(daily.profit.toFixed(2)),
                winStreak: Math.min(daily.trades, 3), // Simplified
                uniqueTokens: daily.uniqueTokens.size,
            },
            weekly: {
                trades: weekly.trades,
                volume: Number(weekly.volume.toFixed(2)),
                profit: Number(weekly.profit.toFixed(2)),
                winStreak: Math.min(weekly.trades, 5),
                activeDays: weeklyDays.size,
            },
            lifetime: {
                totalTrades: lifetimeTrades,
                totalVolume: Number(lifetimeVolume.toFixed(2)),
                profitLoss: Number((daily.profit + weekly.profit).toFixed(2)),
                winRate,
            },
        };
    } catch (error) {
        logger.error('[ChallengeMetrics] Error calculating metrics:', error instanceof Error ? error : new Error(String(error)));
        return null;
    }
}

export { getTimeBoundaries };
export type { ChallengeMetrics, TimePeriodTrades };
