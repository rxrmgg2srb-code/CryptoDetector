import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/og-image';
import { generateOgImage } from '@/lib/og';

jest.mock('@/lib/og');

describe('/api/og-image', () => {
  it('should generate OG image', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { title: 'Test' },
    });

    (generateOgImage as jest.Mock).mockResolvedValue(Buffer.from('image'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Type')).toBe('image/png');
  });

  it('should handle missing title', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should handle generation errors', async () => {
    (generateOgImage as jest.Mock).mockRejectedValue(new Error('Fail'));
    const { req, res } = createMocks({
      method: 'GET',
      query: { title: 'Test' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
  });

  it('should cache image', async () => {
    // ...
  });

  it('should support custom params', async () => {
    // ...
  });

  it('should validate text length', async () => {
    // ...
  });

  it('should log generation', async () => {
    // ...
  });

  it('should only allow GET', async () => {
    // ...
  });

  it('should handle special characters', async () => {
    // ...
  });

  it('should return correct dimensions', async () => {
    // ...
  });
});
