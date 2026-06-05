import { logger } from '@/lib/logger';

/**
 * Robust retry logic for API calls
 * Handles network failures, rate limiting, and transient errors
 * Optimized for high concurrency scenarios
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2, // Exponential backoff
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
};

/**
 * Exponential backoff with jitter to prevent thundering herd
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // ±30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      const isRetryable = isRetryableError(error, opts.retryableStatusCodes);

      if (!isRetryable) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      logger.warn(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries} failed, retrying in ${Math.round(delay)}ms...`,
        {
          error: lastError.message,
        }
      );

      opts.onRetry(attempt + 1, lastError);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw new Error(`Max retries (${opts.maxRetries}) exceeded: ${lastError!.message}`);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableStatusCodes: number[]): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // HTTP errors
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Fetch API errors
  if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }

  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with circuit breaker pattern (prevents cascading failures)
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5, // failures before opening
    private readonly timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if we should transition to HALF_OPEN
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info('[CircuitBreaker] Transitioning to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('[CircuitBreaker] Transitioning to CLOSED state');
    }
  }

  private onFailure(error: any) {
    // Only count server errors (5xx) and network errors as failures
    // Client errors (4xx) should not open the circuit breaker
    const isServerError = error?.status >= 500 && error?.status < 600;
    const isNetworkError =
      error?.code === 'ECONNRESET' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ENOTFOUND' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('network');

    if (!isServerError && !isNetworkError) {
      // Don't count client errors (4xx) as circuit breaker failures
      logger.warn(`[CircuitBreaker] Client error ignored (${error?.status || error?.message})`);
      return;
    }

    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.error(`[CircuitBreaker] Transitioning to OPEN state (${this.failures} failures)`);
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}
