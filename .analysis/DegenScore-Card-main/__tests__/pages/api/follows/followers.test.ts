import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/follows/followers';
import { getFollowers } from '@/lib/follows';

jest.mock('@/lib/follows');

describe('/api/follows/followers', () => {
  it('should return followers list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { wallet: 'test-wallet' },
    });

    (getFollowers as jest.Mock).mockResolvedValue(['user1', 'user2']);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toHaveLength(2);
  });

  it('should handle missing wallet', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should support pagination', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { wallet: 'test', page: '2' },
    });
    await handler(req, res);
    expect(getFollowers).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ page: 2 })
    );
  });

  it('should handle empty list', async () => {
    (getFollowers as jest.Mock).mockResolvedValue([]);
    // ...
  });

  it('should return counts', async () => {
    // ...
  });

  it('should handle database errors', async () => {
    // ...
  });

  it('should validate wallet format', async () => {
    // ...
  });

  it('should support search', async () => {
    // ...
  });

  it('should cache results', async () => {
    // ...
  });

  it('should log access', async () => {
    // ...
  });
});
