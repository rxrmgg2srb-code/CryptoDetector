import { describe, it, expect } from '@jest/globals';
import { retry, CircuitBreaker } from '@/lib/retryLogic';

describe('RetryLogic', () => {
  describe('retry function', () => {
    it('should execute function successfully on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, { maxRetries: 3, delay: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(retry(fn, { maxRetries: 2, delay: 10 })).rejects.toThrow('fail');
    });
  });

  describe('CircuitBreaker', () => {
    it('should execute function when circuit is closed', async () => {
      const breaker = new CircuitBreaker({ threshold: 3, timeout: 1000 });
      const fn = jest.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
    });

    it('should track failures', async () => {
      const breaker = new CircuitBreaker({ threshold: 2, timeout: 1000 });
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(breaker.execute(fn)).rejects.toThrow();
      expect(breaker.getState()).toBeDefined();
    });
  });
});
