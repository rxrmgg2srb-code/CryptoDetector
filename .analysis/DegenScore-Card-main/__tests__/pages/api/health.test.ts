import { describe, it, expect, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('API: /api/health', () => {
  let handler: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handler = (await import('@/pages/api/health')).default;
  });

  it('should return 200 OK for GET requests', async () => {
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toHaveProperty('status');
  });

  it('should return health status', async () => {
    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    const data = res._getJSONData();
    expect(data.status).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });
});
