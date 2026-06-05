import type { NextApiRequest, NextApiResponse } from 'next';
import { redeemFlashSale } from '../../../lib/flashSales';
import { verifySessionToken } from '../../../lib/walletAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { saleId, token } = req.body;

    if (!saleId || !token) {
      return res.status(400).json({ error: 'Missing saleId or token' });
    }

    // Verify user authentication
    const authResult = verifySessionToken(token);
    if (!authResult.valid || !authResult.wallet) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await redeemFlashSale(saleId, authResult.wallet);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json({
      success: true,
      finalPrice: result.finalPrice,
      message: 'Flash sale redeemed successfully!',
    });
  } catch (error) {
    console.error('Error redeeming flash sale:', error);
    res.status(500).json({
      error: 'Failed to redeem flash sale',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
