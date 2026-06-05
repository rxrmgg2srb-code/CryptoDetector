import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/compare-cards';
import { compareCards } from '@/lib/compare';

jest.mock('@/lib/compare');

describe('/api/compare-cards', () => {
  it('should compare two cards', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardIds: ['1', '2'],
      },
    });

    (compareCards as jest.Mock).mockResolvedValue({ difference: 10, winner: '1' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toHaveProperty('winner');
  });

  it('should validate card count', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardIds: ['1'],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });

  it('should handle missing cards', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardIds: ['1', 'unknown'],
      },
    });

    (compareCards as jest.Mock).mockRejectedValue(new Error('Card not found'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
  });

  it('should compare multiple metrics', async () => {
    (compareCards as jest.Mock).mockResolvedValue({
      scoreDiff: 10,
      volumeDiff: 500,
      rankDiff: -5,
    });
    // ...
  });

  it('should handle max comparison limit', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardIds: ['1', '2', '3', '4', '5', '6'], // Too many
      },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should validate card IDs', async () => {
    // ...
  });

  it('should handle internal errors', async () => {
    // ...
  });

  it('should return detailed comparison', async () => {
    // ...
  });

  it('should log comparisons', async () => {
    // ...
  });

  it('should support different comparison modes', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        cardIds: ['1', '2'],
        mode: 'detailed',
      },
    });
    // ...
  });
});
