import { NextApiRequest, NextApiResponse } from 'next';
import * as jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

/**
 * Middleware to verify JWT sent in Authorization header.
 * Returns the decoded payload if valid, otherwise sends 401.
 */
export function verifyJwt(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing Authorization header');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];

  // ✅ SECURITY: Use JWT_SECRET (server-only), not NEXT_PUBLIC_JWT_SECRET
  const secretFromEnv = process.env.JWT_SECRET;

  // ✅ SECURITY: No fallback secret - fail fast if not configured
  if (!secretFromEnv || secretFromEnv.length < 32) {
    logger.error('JWT_SECRET not configured or too short (min 32 chars)');
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    // ✅ SECURITY: Verify with proper typing, no fallback
    // @ts-expect-error - TypeScript can't narrow process.env types with noUncheckedIndexedAccess enabled,
    // but we've validated secret exists and has correct length above
    const payload = jwt.verify(token, secretFromEnv, {
      algorithms: ['HS256'],
      issuer: 'degenscore-card',
    }) as { walletAddress?: string; wallet?: string };

    // Extract wallet address (support both 'wallet' and 'walletAddress' for compatibility)
    const walletAddress = payload.walletAddress || payload.wallet;

    if (!walletAddress) {
      logger.warn('JWT payload missing wallet address');
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    // Attach wallet address to request for downstream handlers
    (req as NextApiRequest & { walletAddress: string }).walletAddress = walletAddress;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logger.warn('JWT expired', { error: err.message });
      res.status(401).json({ error: 'Session expired' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT signature', { error: err.message });
      res.status(401).json({ error: 'Invalid token' });
    } else {
      logger.warn('JWT verification failed', err as Error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
}
