import type { NextApiRequest, NextApiResponse } from 'next';
import { checkDatabaseHealth, optimizeDatabaseTables } from '../../../lib/queryOptimization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple auth check (replace with proper admin auth)
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Health check
    const health = await checkDatabaseHealth();

    res.status(health.healthy ? 200 : 500).json({
      ...health,
      timestamp: new Date().toISOString(),
    });
  } else if (req.method === 'POST') {
    // Optimize tables
    const result = await optimizeDatabaseTables();

    res.status(result.success ? 200 : 500).json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
