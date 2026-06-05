import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from './logger';

/**
 * Simple CSRF protection via Origin/Referer header validation
 * This prevents cross-site request forgery by ensuring requests come from the same origin
 */
export function validateOrigin(req: NextApiRequest, res: NextApiResponse): boolean {
  // Skip validation for GET/HEAD/OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
    return true;
  }

  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;

  // Allow requests from the same host
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);

  // In development, also allow localhost
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://127.0.0.1:3000');
  }

  if (!origin) {
    logger.warn('⚠️ Request missing Origin/Referer header', {
      method: req.method,
      path: req.url,
      userAgent: req.headers['user-agent'],
    });
    res.status(403).json({
      error: 'Forbidden',
      details: 'Request must include Origin or Referer header',
    });
    return false;
  }

  const isAllowed = allowedOrigins.some((allowed) => {
    if (!allowed) {
      return false;
    }
    return origin.startsWith(allowed);
  });

  if (!isAllowed) {
    logger.warn('⚠️ CSRF attempt detected - Invalid origin', {
      origin,
      host,
      method: req.method,
      path: req.url,
    });
    res.status(403).json({
      error: 'Forbidden',
      details: 'Invalid request origin',
    });
    return false;
  }

  return true;
}

/**
 * Middleware to apply CSRF protection to API routes
 * Usage: Add at the beginning of your API handler
 */
export function withCsrfProtection(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!validateOrigin(req, res)) {
      return; // Response already sent by validateOrigin
    }

    return handler(req, res);
  };
}
