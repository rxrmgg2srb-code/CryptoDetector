import type { NextApiRequest, NextApiResponse } from 'next';

// App version from package.json
const APP_VERSION = process.env.npm_package_version || '0.2.0';

/**
 * Health check endpoint for Vercel, Render, and monitoring services
 * Returns 200 if the application is functioning correctly
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Accept GET and HEAD requests (Render uses HEAD for health checks)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For HEAD requests, return status 200 only
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  const startTime = Date.now();

  // Verify critical environment variables
  const checks = {
    nodeEnv: !!process.env.NODE_ENV,
    database: !!process.env.DATABASE_URL,
    helius: !!process.env.HELIUS_API_KEY,
    jwt: !!process.env.JWT_SECRET,
    redis: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  // Check Redis connectivity (optional, non-blocking)
  let redisStatus = 'unknown';
  if (checks.redis) {
    try {
      const { cacheGet } = await import('../../lib/cache/redis');
      await cacheGet('health-check-ping');
      redisStatus = 'connected';
    } catch {
      redisStatus = 'error';
    }
  } else {
    redisStatus = 'not_configured';
  }

  const allHealthy = Object.values(checks).filter((_, i) => i < 4).every(Boolean); // Core checks only
  const responseTime = Date.now() - startTime;

  // Memory usage info
  const memoryUsage = process.memoryUsage();
  const memoryMB = {
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
  };

  // Response
  const response = {
    status: allHealthy ? 'ok' : 'degraded',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    responseTimeMs: responseTime,
    memory: memoryMB,
    checks: {
      ...checks,
      redis: redisStatus,
    },
  };

  // Return 200 always (even if degraded) to prevent unnecessary restarts
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.status(200).json(response);
}

