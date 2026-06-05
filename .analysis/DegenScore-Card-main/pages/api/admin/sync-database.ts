// Admin endpoint to sync database schema without migration files
import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyAdminAuth } from '../../../lib/adminAuth';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin authentication
  const auth = verifyAdminAuth(req);
  if (!auth.authorized) {
    logger.warn(`❌ Unauthorized admin access attempt${auth.wallet ? ` from ${auth.wallet}` : ''}`);
    return res.status(403).json({ error: auth.error || 'Forbidden' });
  }

  logger.info(`✅ Admin operation authorized for wallet: ${auth.wallet}`);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.info('🔄 Starting database sync...');

    // Execute prisma db push
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
      cwd: process.cwd(),
      timeout: 60000, // 60 seconds timeout
    });

    logger.info('✅ Database sync completed');
    logger.info('STDOUT:', { stdout });
    if (stderr) {
      logger.info('STDERR:', { stderr });
    }

    return res.status(200).json({
      success: true,
      message: 'Database synced successfully',
      output: stdout,
      stderr: stderr || null,
    });
  } catch (error: any) {
    logger.error('❌ Database sync failed:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    return res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout || null,
      stderr: error.stderr || null,
    });
  }
}
