import type { NextApiRequest, NextApiResponse } from 'next';
import { getActiveFlashSales } from '../../../lib/flashSales';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const activeSales = await getActiveFlashSales();

    res.status(200).json({
      success: true,
      sales: activeSales,
      count: activeSales.length,
    });
  } catch (error) {
    console.error('Error fetching active flash sales:', error);
    res.status(500).json({
      error: 'Failed to fetch flash sales',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
