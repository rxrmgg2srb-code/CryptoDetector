import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/streaks/status';
import { getStreakStatus } from '@/lib/streaks';

jest.mock('@/lib/streaks');

describe('/api/streaks/status', () => {
  it('should return streak status', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { wallet: 'test-wallet' },
    });

    (getStreakStatus as jest.Mock).mockResolvedValue({ current: 5, max: 10 });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ current: 5, max: 10 });
  });

  it('should handle missing wallet', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should handle errors', async () => {
    // ...
  });

  it('should return check-in status', async () => {
    // ...
  });

  it('should return next reward', async () => {
    // ...
  });

  it('should log access', async () => {
    // ...
  });

  it('should only allow GET', async () => {
    // ...
  });

  it('should validate wallet', async () => {
    // ...
  });

  it('should return history', async () => {
    // ...
  });

  it('should handle new user', async () => {
    // ...
  });
});
