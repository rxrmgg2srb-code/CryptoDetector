import type { NextApiRequest, NextApiResponse } from 'next';
import { getJobStatus } from '../../lib/queue';
import { logger } from '../../lib/logger';

/**
 * API endpoint to check card generation job status
 * Used for polling when card is being generated in background
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    logger.debug('Checking job status:', { jobId });

    const status = await getJobStatus(jobId);

    if (status.status === 'not-found') {
      return res.status(404).json({
        error: 'Job not found',
        message: 'This job does not exist or has expired',
      });
    }

    // Map job states to user-friendly messages
    const messages = {
      waiting: 'Esperando en cola...',
      active: 'Generando tu card...',
      completed: '¡Card generada exitosamente!',
      failed: 'Error al generar la card',
      delayed: 'Card en espera...',
      paused: 'Generación pausada',
    };

    res.status(200).json({
      jobId,
      status: status.status,
      progress: status.progress,
      message: messages[status.status as keyof typeof messages] || 'Procesando...',
      result: status.returnvalue,
      error: status.failedReason,
    });
  } catch (error: any) {
    logger.error('Error checking job status:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to check job status';

    res.status(500).json({ error: errorMessage });
  }
}
