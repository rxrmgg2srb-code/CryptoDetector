import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/discord/webhook';
import { verifyDiscordSignature } from '@/lib/discord';

jest.mock('@/lib/discord');

describe('/api/discord/webhook', () => {
  it('should handle webhook event', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'interaction',
      },
      headers: {
        'x-signature-ed25519': 'valid-sig',
        'x-signature-timestamp': 'timestamp',
      },
    });

    (verifyDiscordSignature as jest.Mock).mockReturnValue(true);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
  });

  it('should verify signature', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'x-signature-ed25519': 'invalid',
      },
    });

    (verifyDiscordSignature as jest.Mock).mockReturnValue(false);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should handle ping event', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { type: 1 }, // PING
    });
    (verifyDiscordSignature as jest.Mock).mockReturnValue(true);

    await handler(req, res);
    expect(res._getJSONData()).toEqual({ type: 1 });
  });

  it('should handle command interaction', async () => {
    // ...
  });

  it('should validate headers', async () => {
    // ...
  });

  it('should handle internal errors', async () => {
    // ...
  });

  it('should only allow POST', async () => {
    // ...
  });

  it('should log webhook events', async () => {
    // ...
  });

  it('should handle unknown types', async () => {
    // ...
  });

  it('should respond quickly', async () => {
    // Discord requires response within 3s
  });
});
