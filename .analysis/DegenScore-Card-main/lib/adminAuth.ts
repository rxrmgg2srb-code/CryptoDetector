import type { NextApiRequest } from 'next';
import { verifySessionToken } from './walletAuth';

/**
 * Admin authentication result
 */
export interface AdminAuthResult {
  authorized: boolean;
  error?: string;
  wallet?: string;
}

/**
 * Verify admin authentication
 * Requires JWT session token + wallet must be in ADMIN_WALLETS env var
 */
export function verifyAdminAuth(req: NextApiRequest): AdminAuthResult {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify JWT token
  const tokenVerification = verifySessionToken(token);
  if (!tokenVerification.valid || !tokenVerification.wallet) {
    return { authorized: false, error: tokenVerification.error || 'Invalid session' };
  }

  // Check if wallet is in admin list
  const adminWallets = process.env.ADMIN_WALLETS?.split(',').map((w) => w.trim()) || [];
  if (adminWallets.length === 0) {
    return { authorized: false, error: 'No admin wallets configured' };
  }

  if (!adminWallets.includes(tokenVerification.wallet)) {
    return {
      authorized: false,
      error: 'Wallet not authorized for admin operations',
      wallet: tokenVerification.wallet,
    };
  }

  return { authorized: true, wallet: tokenVerification.wallet };
}

/**
 * Check if a wallet address is an admin
 */
export function isAdminWallet(walletAddress: string): boolean {
  const adminWallets = process.env.ADMIN_WALLETS?.split(',').map((w) => w.trim()) || [];
  return adminWallets.includes(walletAddress);
}
