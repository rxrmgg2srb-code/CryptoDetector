import { verifyJwt } from '@/lib/middleware/verifyJwt';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Wrap an API handler with JWT verification.
 * The original handler receives the request with `req.walletAddress` populated.
 */
export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    verifyJwt(req, res, async () => {
      await handler(req, res);
    });
  };
}
