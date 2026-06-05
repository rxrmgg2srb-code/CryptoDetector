import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { logger } from './logger';

/**
 * Job Queue configuration using BullMQ and Upstash Redis
 * Enables async image generation and other background tasks
 */

// Create Redis connection
const connection = new Redis(process.env.UPSTASH_REDIS_REST_URL || '', {
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
  tls: {},
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
});

connection.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

connection.on('connect', () => {
  logger.info('Redis connected successfully');
});

/**
 * Card Generation Queue
 */
export interface CardGenerationJobData {
  walletAddress: string;
  requestId: string; // Unique ID to track the request
  isPremium: boolean;
}

export const cardGenerationQueue = new Queue<CardGenerationJobData>('card-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 1000,
    },
  },
});

/**
 * Score History Queue (for cron job)
 */
export interface ScoreHistoryJobData {
  type: 'record-scores' | 'cleanup-old-scores';
}

export const scoreHistoryQueue = new Queue<ScoreHistoryJobData>('score-history', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

/**
 * Notification Queue
 */
export interface NotificationJobData {
  type: 'new-follower' | 'trade-alert' | 'milestone' | 'challenge';
  walletAddress: string;
  data: any;
}

export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
  },
});

/**
 * Helper to add card generation job
 */
export async function enqueueCardGeneration(
  walletAddress: string,
  isPremium: boolean = false
): Promise<string> {
  const requestId = `${walletAddress}-${Date.now()}`;

  await cardGenerationQueue.add(
    'generate-card',
    {
      walletAddress,
      requestId,
      isPremium,
    },
    {
      jobId: requestId,
      priority: isPremium ? 1 : 5, // Premium users get higher priority
    }
  );

  logger.info('Card generation job enqueued:', { walletAddress, requestId, isPremium });

  return requestId;
}

/**
 * Helper to check job status
 */
export async function getJobStatus(jobId: string) {
  const job = await cardGenerationQueue.getJob(jobId);

  if (!job) {
    return { status: 'not-found', progress: 0 };
  }

  const state = await job.getState();
  const progress = (job.progress as number) || 0;

  return {
    status: state,
    progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  };
}

/**
 * Helper to enqueue notification
 */
export async function enqueueNotification(
  type: NotificationJobData['type'],
  walletAddress: string,
  data: any
): Promise<void> {
  await notificationQueue.add(
    type,
    {
      type,
      walletAddress,
      data,
    },
    {
      priority: type === 'challenge' ? 1 : 5,
    }
  );

  logger.info('Notification job enqueued:', { type, walletAddress });
}

/**
 * Queue metrics
 */
export async function getQueueMetrics() {
  const [cardWaiting, cardActive, cardCompleted, cardFailed] = await Promise.all([
    cardGenerationQueue.getWaitingCount(),
    cardGenerationQueue.getActiveCount(),
    cardGenerationQueue.getCompletedCount(),
    cardGenerationQueue.getFailedCount(),
  ]);

  return {
    cardGeneration: {
      waiting: cardWaiting,
      active: cardActive,
      completed: cardCompleted,
      failed: cardFailed,
    },
  };
}

// Export connection for workers
export { connection };
