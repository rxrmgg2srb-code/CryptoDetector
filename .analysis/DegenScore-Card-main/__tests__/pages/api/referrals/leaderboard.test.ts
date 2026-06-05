import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/referrals/leaderboard';
import { getReferralLeaderboard } from '@/lib/referrals';

jest.mock('@/lib/referrals');

describe('/api/referrals/leaderboard', () => {
  it('should return leaderboard', async () => {
    const { req, res } = createMocks({ method: 'GET' });

    (getReferralLeaderboard as jest.Mock).mockResolvedValue([{ wallet: 'alice', count: 10 }]);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toHaveLength(1);
  });

  it('should handle errors', async () => {
    // ...
  });

  it('should support limit', async () => {
    // ...
  });

  it('should cache response', async () => {
    // ...
  });

  it('should only allow GET', async () => {
    // ...
  });

  it('should log access', async () => {
    // ...
  });

  it('should return empty list', async () => {
    // ...
  });

  it('should validate query', async () => {
    // ...
  });

  it('should mask wallet addresses', async () => {
    // ...
  });

  it('should include rewards info', async () => {
    // ...
  });
});
