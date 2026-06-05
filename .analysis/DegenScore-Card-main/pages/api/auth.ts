import type { NextApiRequest, NextApiResponse } from 'next';
import { cacheGet, cacheDel } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import * as jwt from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * POST /api/auth
 * Body: { walletAddress: string, nonce: string, signature: string }
 * Verifies that the signature of the nonce matches the wallet address.
 * If valid, returns a JWT token (expires in 15 minutes).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { walletAddress, nonce, signature } = req.body as {
    walletAddress?: string;
    nonce?: string;
    signature?: string;
  };

  if (!walletAddress || !nonce || !signature) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Verify nonce exists in Redis (5‑min TTL)
  const stored = await cacheGet(`nonce:${nonce}`);
  if (!stored) {
    return res.status(400).json({ error: 'Invalid or expired nonce' });
  }
  // Remove nonce to prevent replay attacks
  await cacheDel(`nonce:${nonce}`);

  try {
    const publicKey = new PublicKey(walletAddress);
    const message = Buffer.from(nonce, 'hex');
    const sigBytes = bs58.decode(signature);
    const isValid = nacl.sign.detached.verify(message, sigBytes, publicKey.toBytes());
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } catch (err) {
    logger.error('Signature verification failed', err as Error);
    return res.status(500).json({ error: 'Server error during verification' });
  }

  const secret = process.env.NEXT_PUBLIC_JWT_SECRET;
  if (!secret) {
    logger.error('JWT secret not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const token = jwt.sign({ walletAddress }, secret || 'fallback_secret', { expiresIn: '15m' });
  logger.info('JWT issued for wallet', { walletAddress });
  return res.status(200).json({ token });
}
