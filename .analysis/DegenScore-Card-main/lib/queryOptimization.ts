/**
 * Database Query Optimization Utilities
 *
 * Optimized queries with connection pooling, pagination,
 * and efficient data fetching strategies
 */

import { prisma } from './prisma';

// Pagination helper with cursor-based pagination for better performance
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

/**
 * Optimized leaderboard query with proper indexing
 */
export async function getOptimizedLeaderboard(
  sortBy: 'degenScore' | 'totalVolume' | 'winRate' | 'likes' = 'degenScore',
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const { page = 1, pageSize = 50 } = options;
  const skip = (page - 1) * pageSize;

  // Use parallel queries for better performance
  const [data, total] = await Promise.all([
    prisma.degenCard.findMany({
      where: { isPaid: true, deletedAt: null },
      select: {
        walletAddress: true,
        degenScore: true,
        totalVolume: true,
        winRate: true,
        likes: true,
        displayName: true,
        profileImage: true,
        level: true,
      },
      orderBy: { [sortBy]: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.degenCard.count({ where: { isPaid: true, deletedAt: null } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Batch fetch wallet data to avoid N+1 queries
 */
export async function batchFetchWallets(walletAddresses: string[]) {
  if (walletAddresses.length === 0) {
    return [];
  }

  return await prisma.degenCard.findMany({
    where: {
      walletAddress: { in: walletAddresses },
    },
    select: {
      walletAddress: true,
      degenScore: true,
      totalVolume: true,
      winRate: true,
      displayName: true,
      profileImage: true,
    },
  });
}

/**
 * Optimized search with full-text search capabilities
 */
export async function searchWallets(query: string, limit: number = 20) {
  // Search by wallet address or username
  const results = await prisma.degenCard.findMany({
    where: {
      OR: [
        { walletAddress: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
      isPaid: true,
      deletedAt: null,
    },
    select: {
      walletAddress: true,
      displayName: true,
      profileImage: true,
      degenScore: true,
      level: true,
    },
    take: limit,
    orderBy: { degenScore: 'desc' },
  });

  return results;
}

/**
 * Get trending wallets (hot wallets with recent activity)
 */
export async function getTrendingWallets(limit: number = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const trending = await prisma.degenCard.findMany({
    where: {
      isPaid: true,
      deletedAt: null,
      lastSeen: { gte: oneDayAgo },
    },
    select: {
      walletAddress: true,
      displayName: true,
      profileImage: true,
      degenScore: true,
      totalVolume: true,
      level: true,
    },
    orderBy: [{ likes: 'desc' }, { degenScore: 'desc' }],
    take: limit,
  });

  return trending;
}

/**
 * Efficient badge count aggregation
 */
export async function getWalletBadgeCount(walletAddress: string): Promise<number> {
  // Badge model doesn't have walletAddress field, it has cardId
  // We need to find the card first, then count badges
  const card = await prisma.degenCard.findUnique({
    where: { walletAddress },
    select: { id: true },
  });

  if (!card) {
    return 0;
  }

  const count = await prisma.badge.count({
    where: { cardId: card.id },
  });

  return count;
}

/**
 * Bulk update with transaction for atomic operations
 */
export async function bulkUpdateScores(updates: Array<{ wallet: string; score: number }>) {
  const operations = updates.map((update) =>
    prisma.degenCard.update({
      where: { walletAddress: update.wallet },
      data: { degenScore: update.score },
    })
  );

  // Execute in transaction for atomicity
  return await prisma.$transaction(operations);
}

/**
 * Efficient referral stats calculation
 * NOTE: Currently disabled - Referral model doesn't exist in schema
 * TODO: Implement referral tracking if needed
 */
/* 
export async function getReferralStatsOptimized(walletAddress: string) {
  // Use aggregation instead of fetching all records
  const stats = await prisma.referral.aggregate({
    where: { referrerAddress: walletAddress },
    _count: { _all: true },
    _sum: { rewardAmount: true },
  });

  const paidCount = await prisma.referral.count({
    where: {
      referrerAddress: walletAddress,
      hasPaid: true,
    },
  });

  return {
    totalReferrals: stats._count._all,
    paidReferrals: paidCount,
    totalEarnings: stats._sum.rewardAmount || 0,
  };
}
*/

/**
 * Get activity feed with efficient pagination
 */
export async function getActivityFeed(
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const { page = 1, pageSize = 20 } = options;
  const skip = (page - 1) * pageSize;

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      select: {
        id: true,
        walletAddress: true,
        action: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.activityLog.count(),
  ]);

  return {
    data: activities,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNext: skip + pageSize < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Optimized score history with data aggregation
 */
export async function getScoreHistoryOptimized(walletAddress: string, days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const history = await prisma.scoreHistory.findMany({
    where: {
      walletAddress,
      timestamp: { gte: startDate },
    },
    select: {
      timestamp: true,
      score: true,
      rank: true,
      totalVolume: true,
      profitLoss: true,
    },
    orderBy: { timestamp: 'asc' },
  });

  // Downsample if too many points (keep max 100 points for chart)
  if (history.length > 100) {
    const step = Math.floor(history.length / 100);
    return history.filter((_, index) => index % step === 0);
  }

  return history;
}

/**
 * Connection pool health check
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clean up old activity logs (data retention policy)
 */
export async function cleanupOldLogs(daysToKeep: number = 90) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await prisma.activityLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Vacuum analyze for PostgreSQL performance
 * (Call this periodically via cron job)
 */
export async function optimizeDatabaseTables() {
  try {
    await prisma.$executeRaw`VACUUM ANALYZE`;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
