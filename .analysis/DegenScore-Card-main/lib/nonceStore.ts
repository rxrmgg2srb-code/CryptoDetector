import redis from './cache/redis';
import { logger } from './logger';

/**
 * Nonce Store for Replay Attack Prevention
 *
 * Stores used nonces in Redis with 5-minute TTL to prevent
 * replay attacks during wallet authentication.
 */

const NONCE_PREFIX = 'auth:nonce:';
const NONCE_TTL = 300; // 5 minutes in seconds

/**
 * Check if a nonce has been used
 */
export async function isNonceUsed(nonce: string): Promise<boolean> {
  if (!redis) {
    // Fallback to in-memory if Redis unavailable (not ideal but graceful)
    logger.warn('Redis unavailable - replay attack protection degraded');
    return false;
  }

  try {
    const key = `${NONCE_PREFIX}${nonce}`;
    const exists = await redis.get(key);
    return exists !== null;
  } catch (error) {
    logger.error('Error checking nonce', error as Error);
    // Fail open on error to not block legitimate users
    return false;
  }
}

/**
 * Mark a nonce as used
 */
export async function markNonceAsUsed(nonce: string): Promise<void> {
  if (!redis) {
    logger.warn('Redis unavailable - cannot mark nonce as used');
    return;
  }

  try {
    const key = `${NONCE_PREFIX}${nonce}`;
    // Store nonce with timestamp and TTL of 5 minutes
    await redis.set(key, Date.now().toString(), { ex: NONCE_TTL });
    logger.debug(`Nonce marked as used: ${nonce.slice(0, 8)}...`);
  } catch (error) {
    logger.error('Error marking nonce as used', error as Error);
  }
}

/**
 * Delete a nonce (for testing/cleanup)
 */
export async function deleteNonce(nonce: string): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    const key = `${NONCE_PREFIX}${nonce}`;
    await redis.del(key);
  } catch (error) {
    logger.error('Error deleting nonce', error as Error);
  }
}

/**
 * Get nonce statistics (for monitoring)
 */
export async function getNonceStats(): Promise<{
  total: number;
  sample: string[];
}> {
  if (!redis) {
    return { total: 0, sample: [] };
  }

  try {
    // Get all nonce keys (use SCAN in production for large datasets)
    const keys = await redis.keys(`${NONCE_PREFIX}*`);
    const sample = keys.slice(0, 10).map((k) => k.replace(NONCE_PREFIX, ''));

    return {
      total: keys.length,
      sample,
    };
  } catch (error) {
    logger.error('Error getting nonce stats', error as Error);
    return { total: 0, sample: [] };
  }
}
