import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/health';

describe('Stress Test: API Load', () => {
  it('should handle high request volume', async () => {
    const requests = Array(100).fill(null);

    const results = await Promise.all(
      requests.map(async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req, res);
        return res._getStatusCode();
      })
    );

    const successCount = results.filter((s) => s === 200).length;
    expect(successCount).toBe(100);
  });
});
