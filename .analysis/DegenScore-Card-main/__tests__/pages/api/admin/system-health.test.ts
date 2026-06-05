import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/admin/system-health';

describe('/api/admin/system-health', () => {
  it('should return system metrics', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toHaveProperty('cpu');
  });
});
