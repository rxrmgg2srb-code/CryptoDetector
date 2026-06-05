import { enqueueJob, processQueue, getQueueStatus, clearQueue } from '@/lib/queue';

jest.mock('@/lib/redis');
jest.mock('@/lib/logger');

describe('queue', () => {
  beforeEach(async () => {
    await clearQueue('test-queue');
  });

  it('should enqueue job', async () => {
    const job = await enqueueJob('test-queue', { type: 'analyze', data: 'test' });
    expect(job).toHaveProperty('id');
    expect(job).toHaveProperty('status');
  });

  it('should process jobs in order', async () => {
    await enqueueJob('test-queue', { order: 1 });
    await enqueueJob('test-queue', { order: 2 });
    await enqueueJob('test-queue', { order: 3 });

    const processed = [];
    await processQueue('test-queue', async (job) => {
      processed.push(job.data.order);
    });

    expect(processed).toEqual([1, 2, 3]);
  });

  it('should handle job failures', async () => {
    await enqueueJob('test-queue', { shouldFail: true });

    await processQueue('test-queue', async (job) => {
      if (job.data.shouldFail) throw new Error('Job failed');
    });

    const status = await getQueueStatus('test-queue');
    expect(status.failed).toBeGreaterThan(0);
  });

  it('should retry failed jobs', async () => {
    let attempts = 0;
    await enqueueJob('test-queue', { data: 'retry' }, { maxRetries: 3 });

    await processQueue('test-queue', async () => {
      attempts++;
      if (attempts < 3) throw new Error('Not yet');
    });

    expect(attempts).toBe(3);
  });

  it('should get queue status', async () => {
    await enqueueJob('test-queue', { data: 'test' });
    const status = await getQueueStatus('test-queue');

    expect(status).toHaveProperty('waiting');
    expect(status).toHaveProperty('active');
    expect(status).toHaveProperty('completed');
  });

  it('should handle priority jobs', async () => {
    await enqueueJob('test-queue', { priority: 'low' }, { priority: 1 });
    await enqueueJob('test-queue', { priority: 'high' }, { priority: 10 });

    const processed = [];
    await processQueue('test-queue', async (job) => {
      processed.push(job.data.priority);
    });

    expect(processed[0]).toBe('high');
  });

  it('should support delayed jobs', async () => {
    jest.useFakeTimers();
    await enqueueJob('test-queue', { delayed: true }, { delay: 5000 });

    let processed = false;
    processQueue('test-queue', async () => {
      processed = true;
    });

    expect(processed).toBe(false);

    jest.advanceTimersByTime(6000);
    await processQueue('test-queue', async () => {
      processed = true;
    });

    expect(processed).toBe(true);
    jest.useRealTimers();
  });

  it('should handle concurrent processing', async () => {
    for (let i = 0; i < 100; i++) {
      await enqueueJob('test-queue', { index: i });
    }

    const results = [];
    await processQueue(
      'test-queue',
      async (job) => {
        results.push(job.data.index);
      },
      { concurrency: 10 }
    );

    expect(results).toHaveLength(100);
  });

  it('should clean completed jobs', async () => {
    await enqueueJob('test-queue', { data: 'test' });
    await processQueue('test-queue', async () => {});

    await cleanCompletedJobs('test-queue', { olderThan: 0 });

    const status = await getQueueStatus('test-queue');
    expect(status.completed).toBe(0);
  });

  it('should pause and resume queue', async () => {
    await pauseQueue('test-queue');
    await enqueueJob('test-queue', { data: 'paused' });

    let processed = await processQueue('test-queue', async () => {});
    expect(processed).toBe(0);

    await resumeQueue('test-queue');
    processed = await processQueue('test-queue', async () => {});
    expect(processed).toBeGreaterThan(0);
  });
});
