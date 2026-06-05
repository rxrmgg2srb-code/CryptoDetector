import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import { cacheSet } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';

/**
 * POST /api/nonce
 * Generates a random nonce (32‑byte hex string) and stores it in Redis for 5 minutes.
 * The client must sign this nonce with its wallet and send the signature together with the payload.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const nonce = randomBytes(32).toString('hex');
  const key = `nonce:${nonce}`;
  try {
    // Store a placeholder value; we only need existence and TTL.
    await cacheSet(key, '1', { ttl: 300 }); // 5 minutes
    logger.info('Nonce generated', { nonce });
    return res.status(200).json({ nonce });
  } catch (err) {
    logger.error('Failed to store nonce', err as Error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
