import { retryOperation } from '@/lib/retryLogic';

describe('Edge Cases: Network Failures', () => {
  it('should retry on network timeout', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValue('Success');

    const result = await retryOperation(operation, 3);
    expect(result).toBe('Success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Timeout'));
    await expect(retryOperation(operation, 3)).rejects.toThrow('Timeout');
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
