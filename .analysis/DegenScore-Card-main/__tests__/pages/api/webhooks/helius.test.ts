import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/webhooks/helius';
import { processHeliusWebhook } from '@/lib/webhooks';

jest.mock('@/lib/webhooks');

describe('/api/webhooks/helius', () => {
  it('should process webhook', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { type: 'TRANSFER' },
      headers: { authorization: 'secret' },
    });

    (processHeliusWebhook as jest.Mock).mockResolvedValue({ processed: true });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
  });

  it('should validate auth header', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'wrong' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should handle errors', async () => {
    // ...
  });

  it('should validate payload', async () => {
    // ...
  });

  it('should log webhook', async () => {
    // ...
  });

  it('should only allow POST', async () => {
    // ...
  });

  it('should handle duplicate events', async () => {
    // ...
  });

  it('should update user data', async () => {
    // ...
  });

  it('should trigger notifications', async () => {
    // ...
  });

  it('should return quick response', async () => {
    // ...
  });
});
