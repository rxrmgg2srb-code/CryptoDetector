import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/follows/remove';
import { unfollowUser } from '@/lib/follows';

jest.mock('@/lib/follows');

describe('/api/follows/remove', () => {
  it('should unfollow user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        target: 'target-wallet',
        follower: 'my-wallet',
      },
    });

    (unfollowUser as jest.Mock).mockResolvedValue({ success: true });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
  });

  it('should validate parameters', async () => {
    const { req, res } = createMocks({ method: 'POST', body: {} });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should require auth', async () => {
    // ...
  });

  it('should handle not following', async () => {
    (unfollowUser as jest.Mock).mockRejectedValue(new Error('Not following'));
    // ...
  });

  it('should handle database errors', async () => {
    // ...
  });

  it('should update counts', async () => {
    // ...
  });

  it('should log action', async () => {
    // ...
  });

  it('should only allow POST', async () => {
    // ...
  });

  it('should return updated status', async () => {
    // ...
  });

  it('should handle self-unfollow attempt', async () => {
    // ...
  });
});
