import { Worker, Job } from 'bullmq';
import { connection, CardGenerationJobData } from '../lib/queue';
import { logger } from '../lib/logger';
import { generateCardImage } from '../lib/cardGenerator';
import { prisma } from '../lib/prisma';
import { cacheSet } from '../lib/cache';

/**
 * Worker for processing card generation jobs
 * This runs as a separate process to handle image generation async
 *
 * To start the worker:
 * - Development: npx ts-node workers/card-generation.ts
 * - Production: Add to Render/Vercel background worker service
 */

const worker = new Worker<CardGenerationJobData>(
  'card-generation',
  async (job: Job<CardGenerationJobData>) => {
    const { walletAddress, requestId, isPremium } = job.data;

    logger.info('Processing card generation job:', { walletAddress, requestId, isPremium });

    try {
      // Update progress
      await job.updateProgress(10);

      // Fetch card data from database
      const card = await prisma.degenCard.findUnique({
        where: { walletAddress },
        include: {
          badges: {
            select: {
              name: true,
              rarity: true,
              icon: true,
            },
          },
        },
      });

      if (!card) {
        throw new Error('Card not found in database');
      }

      await job.updateProgress(30);

      // Generate card image
      logger.info('Generating card image...', { walletAddress });
      const imageBuffer = await generateCardImage(card);

      if (!imageBuffer) {
        throw new Error('Failed to generate card image');
      }

      await job.updateProgress(70);

      // ✅ R2 DESHABILITADO - Solo cachear la imagen
      logger.info('✅ R2 disabled - caching image in memory');
      const cacheKey = `card:${walletAddress}`;
      const base64Buffer = imageBuffer.toString('base64');
      await cacheSet(cacheKey, base64Buffer, { ttl: 86400 }); // 24 hours
      logger.info('✅ Card image cached:', { walletAddress });

      await job.updateProgress(90);

      const imageUrl: string | null = null;

      await job.updateProgress(100);

      logger.info('Card generation completed:', { walletAddress, requestId });

      // Return the result
      return {
        walletAddress,
        requestId,
        imageUrl,
        cached: !imageUrl,
        completedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Card generation job failed:', {
        walletAddress,
        requestId,
        error: error.message,
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 jobs concurrently
  }
);

worker.on('completed', (job) => {
  logger.info('Card generation job completed:', {
    jobId: job.id,
    walletAddress: job.data.walletAddress,
  });
});

worker.on('failed', (job, err) => {
  logger.error('Card generation job failed:', {
    jobId: job?.id,
    walletAddress: job?.data.walletAddress,
    error: err.message,
  });
});

worker.on('error', (err) => {
  logger.error('Worker error', err instanceof Error ? err : undefined, {
    error: String(err),
  });
});

logger.info('Card generation worker started');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
