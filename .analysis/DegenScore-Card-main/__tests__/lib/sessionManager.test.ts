import { describe, it, expect, jest } from '@jest/globals';
jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

describe('sessionManager', () => {
  it('should export module', async () => {
    const module = await import('@/lib/sessionManager');
    expect(module).toBeDefined();
  });
});
