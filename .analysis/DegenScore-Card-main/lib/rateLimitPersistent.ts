import { prisma } from './prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

/**
 * Persistent rate limiting using database
 * Prevents abuse even across server restarts
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string; // Optional custom identifier
  endpoint?: string; // Optional endpoint tracking
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Get client identifier (IP or wallet)
 */
function getClientIdentifier(req: NextApiRequest, customIdentifier?: string): string {
  if (customIdentifier) {
    return customIdentifier;
  }

  // Try to get IP from various headers
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0] || 'unknown'
      : req.socket.remoteAddress || 'unknown';

  return ip;
}

/**
 * Check rate limit using database persistence
 */
export async function checkRateLimitPersistent(
  req: NextApiRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, identifier: customIdentifier, endpoint } = config;
  const identifier = getClientIdentifier(req, customIdentifier);
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Count requests in the time window
    const count = await prisma.rateLimitLog.count({
      where: {
        identifier,
        endpoint: endpoint || undefined,
        timestamp: {
          gte: windowStart,
        },
      },
    });

    // Clean up old rate limit logs (older than 24 hours) periodically
    // Only run cleanup 1% of the time to avoid overhead
    if (Math.random() < 0.01) {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      await prisma.rateLimitLog.deleteMany({
        where: {
          timestamp: {
            lt: oneDayAgo,
          },
        },
      });
    }

    if (count >= maxRequests) {
      // Find the oldest log in the window to calculate reset time
      const oldestLog = await prisma.rateLimitLog.findFirst({
        where: {
          identifier,
          endpoint: endpoint || undefined,
          timestamp: {
            gte: windowStart,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      const resetAt = oldestLog
        ? new Date(oldestLog.timestamp.getTime() + windowMs)
        : new Date(now.getTime() + windowMs);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Log this request
    await prisma.rateLimitLog.create({
      data: {
        identifier,
        endpoint,
        timestamp: now,
      },
    });

    return {
      allowed: true,
      remaining: maxRequests - count - 1,
      resetAt: new Date(now.getTime() + windowMs),
    };
  } catch (error) {
    logger.error('Rate limit check failed', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }
}

/**
 * Middleware wrapper for persistent rate limiting
 */
export async function rateLimitMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig
): Promise<boolean> {
  const result = await checkRateLimitPersistent(req, config);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

  if (!result.allowed) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
    });
    return false;
  }

  return true;
}

/**
 * Preset configurations for common use cases
 */
export const RATE_LIMIT_PRESETS = {
  // Very strict for expensive operations
  STRICT: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  // Default for most API endpoints
  NORMAL: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  // Lenient for read operations
  LENIENT: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // For auth endpoints
  AUTH: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
} as const;
