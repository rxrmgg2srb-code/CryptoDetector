/**
 * Hot Wallet Cache System
 *
 * Caches frequently accessed wallet data to reduce Helius API calls
 * and improve response times for popular wallets.
 *
 * Features:
 * - Multi-tier caching (in-memory + Redis)
 * - Automatic cache warming for trending wallets
 * - TTL-based expiration
 * - Cache hit/miss metrics
 */

import { cacheGet, cacheSet, cacheDel } from './redis';
import { logger } from '../logger';

interface CachedWalletData {
  metrics: any;
  lastUpdated: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

// In-memory cache for ultra-fast access
const memoryCache = new Map<string, CachedWalletData>();
const MAX_MEMORY_CACHE_SIZE = 100;

// Cache TTL settings
const CACHE_TTL = {
  HOT_WALLET: 5 * 60 * 1000, // 5 minutes for trending wallets
  NORMAL_WALLET: 30 * 60 * 1000, // 30 minutes for regular wallets
  COLD_WALLET: 60 * 60 * 1000, // 1 hour for inactive wallets
};

// Cache statistics
let cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  hitRate: 0,
  totalRequests: 0,
};

/**
 * Get cached wallet metrics
 */
export async function getCachedWalletMetrics(walletAddress: string): Promise<any | null> {
  cacheStats.totalRequests++;

  // Check memory cache first (fastest)
  const memCached = memoryCache.get(walletAddress);
  if (memCached && !isCacheExpired(memCached)) {
    cacheStats.hits++;
    memCached.hitCount++;
    updateCacheStats();
    return memCached.metrics;
  }

  // Check Redis cache (slower but persistent)
  try {
    const redisCached = await cacheGet<string>(`wallet:metrics:${walletAddress}`);
    if (redisCached) {
      const parsed: CachedWalletData = JSON.parse(redisCached);

      if (!isCacheExpired(parsed)) {
        cacheStats.hits++;
        parsed.hitCount++;

        // Promote to memory cache if frequently accessed
        if (parsed.hitCount > 5) {
          setMemoryCache(walletAddress, parsed);
        }

        // Update hitCount in Redis
        await cacheSet(`wallet:metrics:${walletAddress}`, JSON.stringify(parsed), {
          ttl: getTTL(parsed.hitCount),
        });

        updateCacheStats();
        return parsed.metrics;
      }
    }
  } catch (error) {
    logger.error(
      'Redis cache read error',
      error instanceof Error ? error : new Error(String(error))
    );
  }

  cacheStats.misses++;
  updateCacheStats();
  return null;
}

/**
 * Set cached wallet metrics
 */
export async function setCachedWalletMetrics(walletAddress: string, metrics: any): Promise<void> {
  const cacheData: CachedWalletData = {
    metrics,
    lastUpdated: Date.now(),
    hitCount: 0,
  };

  // Always cache in Redis
  try {
    await cacheSet(`wallet:metrics:${walletAddress}`, JSON.stringify(cacheData), {
      ttl: CACHE_TTL.NORMAL_WALLET / 1000,
    });
  } catch (error) {
    logger.error(
      'Redis cache write error',
      error instanceof Error ? error : new Error(String(error))
    );
  }

  // Add to memory cache if there's space or it's replacing an existing entry
  if (memoryCache.has(walletAddress) || memoryCache.size < MAX_MEMORY_CACHE_SIZE) {
    setMemoryCache(walletAddress, cacheData);
  }
}

/**
 * Invalidate cache for a wallet
 */
export async function invalidateWalletCache(walletAddress: string): Promise<void> {
  memoryCache.delete(walletAddress);

  try {
    await cacheDel(`wallet:metrics:${walletAddress}`);
  } catch (error) {
    logger.error(
      'Redis cache invalidation error',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Warm cache for hot wallets
 */
export async function warmCacheForHotWallets(wallets: string[]): Promise<void> {
  logger.info('Warming cache for hot wallets', { count: wallets.length });

  // This would be called by a background job
  // For now, it just ensures these wallets are marked as hot
  for (const wallet of wallets) {
    try {
      const cached = await cacheGet<string>(`wallet:metrics:${wallet}`);
      if (cached) {
        const parsed: CachedWalletData = JSON.parse(cached);
        parsed.hitCount = Math.max(parsed.hitCount, 10); // Mark as hot

        await cacheSet(`wallet:metrics:${wallet}`, JSON.stringify(parsed), {
          ttl: CACHE_TTL.HOT_WALLET / 1000,
        });
      }
    } catch (error) {
      logger.error(
        'Failed to warm cache for wallet',
        error instanceof Error ? error : new Error(String(error)),
        { wallet }
      );
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return { ...cacheStats };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  cacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
  };
}

/**
 * Get trending wallets (most cache hits)
 */
export async function getTrendingWallets(
  limit: number = 10
): Promise<Array<{ wallet: string; hits: number }>> {
  const trending: Array<{ wallet: string; hits: number }> = [];

  // Get from memory cache
  for (const [wallet, data] of memoryCache.entries()) {
    trending.push({ wallet, hits: data.hitCount });
  }

  // Sort by hit count
  trending.sort((a, b) => b.hits - a.hits);

  return trending.slice(0, limit);
}

// Helper functions

function isCacheExpired(cached: CachedWalletData): boolean {
  const age = Date.now() - cached.lastUpdated;
  const ttl = getTTL(cached.hitCount);
  return age > ttl;
}

function getTTL(hitCount: number): number {
  if (hitCount > 20) {
    return CACHE_TTL.HOT_WALLET;
  }
  if (hitCount > 5) {
    return CACHE_TTL.NORMAL_WALLET;
  }
  return CACHE_TTL.COLD_WALLET;
}

function setMemoryCache(walletAddress: string, data: CachedWalletData): void {
  // Evict least recently used if cache is full
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE && !memoryCache.has(walletAddress)) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey !== undefined) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(walletAddress, data);
}

function updateCacheStats(): void {
  cacheStats.hitRate =
    cacheStats.totalRequests > 0 ? (cacheStats.hits / cacheStats.totalRequests) * 100 : 0;
}

// Periodic cleanup of expired memory cache entries
setInterval(() => {
  for (const [wallet, data] of memoryCache.entries()) {
    if (isCacheExpired(data)) {
      memoryCache.delete(wallet);
    }
  }
}, 60 * 1000); // Run every minute
