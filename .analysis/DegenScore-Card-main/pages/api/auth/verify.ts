import type { NextApiRequest, NextApiResponse } from 'next';
import {
  verifyAuthentication,
  generateSessionToken,
  WalletAuthResponse,
} from '../../../lib/walletAuth';
import { isValidSolanaAddress } from '../../../lib/validation';
import { rateLimit } from '../../../lib/rateLimit';
import { logger } from '../../../lib/logger';

/**
 * Verify wallet signature and issue session token
 * POST /api/auth/verify
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  if (!(await rateLimit(req, res))) {
    return;
  }

  try {
    const authResponse: WalletAuthResponse & { nonce?: string } = req.body;

    // Validate wallet address
    if (!authResponse.publicKey || !isValidSolanaAddress(authResponse.publicKey)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // ✅ SECURITY: Extract nonce from message for replay attack protection
    const nonceMatch = authResponse.message.match(/Nonce:\s*([a-z0-9]+)/i);
    const nonce = nonceMatch ? nonceMatch[1] : authResponse.nonce;

    if (!nonce) {
      return res.status(400).json({
        error: 'Missing nonce in authentication request',
      });
    }

    // ✅ SECURITY: Redact sensitive info in logs (show only first/last 4 chars)
    const redactedWallet = `${authResponse.publicKey.slice(0, 4)}...${authResponse.publicKey.slice(-4)}`;
    logger.debug('Verifying auth for:', { publicKey: redactedWallet });

    // ✅ SECURITY: Verify authentication with replay attack protection (now async)
    const verification = await verifyAuthentication({ ...authResponse, nonce });

    if (!verification.valid) {
      logger.warn('Authentication failed:', {
        error: verification.error,
        publicKey: redactedWallet,
      });
      // ✅ SECURITY: Generic error message to user
      return res.status(401).json({
        error: 'Authentication failed',
      });
    }

    // Generate session token
    const sessionToken = generateSessionToken(authResponse.publicKey);

    logger.info('Authentication successful for:', { publicKey: redactedWallet });

    res.status(200).json({
      success: true,
      sessionToken,
      wallet: authResponse.publicKey,
    });
  } catch (error: any) {
    logger.error('Error verifying authentication:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    // ✅ SECURITY: Generic error message (no details leaked)
    res.status(500).json({ error: 'Authentication failed' });
  }
}
