import { NextApiRequest, NextApiResponse } from 'next';
import { RATE_LIMIT_CONFIG } from './config';
import { logger } from '@/lib/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Optimized cleanup for high concurrency: every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    const keys = Object.keys(store);

    // Only clean if we have many entries (memory optimization)
    if (keys.length > 500) {
      let cleaned = 0;
      keys.forEach((key) => {
        if (store[key] && store[key].resetTime < now) {
          delete store[key];
          cleaned++;
        }
      });
      if (cleaned > 0) {
        logger.info(`[RateLimit] Cleaned ${cleaned}/${keys.length} expired entries`);
      }
    }
  },
  5 * 60 * 1000
);

function getClientIdentifier(req: NextApiRequest): string {
  // Try to get the real IP from various headers (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];

  if (forwarded) {
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return ip ? ip.trim() : 'unknown';
  }

  if (realIp) {
    const ip = typeof realIp === 'string' ? realIp : realIp[0];
    return ip || 'unknown';
  }

  // Fallback to socket address
  return req.socket.remoteAddress || 'unknown';
}

export type RateLimitConfig = {
  windowMs?: number;
  maxRequests?: number;
};

/**
 * Rate limiting middleware
 * Returns true if request should be allowed, false if rate limited
 */
export function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig = {}
): boolean {
  const windowMs = config.windowMs || RATE_LIMIT_CONFIG.WINDOW_MS;
  const maxRequests = config.maxRequests || RATE_LIMIT_CONFIG.MAX_REQUESTS;

  const identifier = getClientIdentifier(req);
  const key = `${req.url}:${identifier}`;
  const now = Date.now();

  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return true;
  }

  if (store[key].count < maxRequests) {
    store[key].count++;
    return true;
  }

  // Rate limit exceeded
  const resetTime = Math.ceil((store[key].resetTime - now) / 1000);
  res.status(429).json({
    error: 'Too many requests',
    retryAfter: resetTime,
  });
  res.setHeader('Retry-After', resetTime.toString());

  return false;
}

/**
 * Strict rate limiter for expensive operations (analyze, generate-card)
 */
export function strictRateLimit(req: NextApiRequest, res: NextApiResponse): boolean {
  return rateLimit(req, res, {
    windowMs: RATE_LIMIT_CONFIG.STRICT_WINDOW_MS,
    maxRequests: RATE_LIMIT_CONFIG.STRICT_MAX_REQUESTS,
  });
}

/**
 * Payment rate limiter (prevents payment spam/attacks)
 */
export function paymentRateLimit(req: NextApiRequest, res: NextApiResponse): boolean {
  return rateLimit(req, res, {
    windowMs: RATE_LIMIT_CONFIG.PAYMENT_WINDOW_MS,
    maxRequests: RATE_LIMIT_CONFIG.PAYMENT_MAX_REQUESTS,
  });
}
