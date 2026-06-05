import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/scarcity/slots';
import { getAvailableSlots } from '@/lib/scarcity';

jest.mock('@/lib/scarcity');

describe('/api/scarcity/slots', () => {
  it('should return available slots', async () => {
    const { req, res } = createMocks({ method: 'GET' });

    (getAvailableSlots as jest.Mock).mockResolvedValue({ slots: 5 });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ slots: 5 });
  });

  it('should handle errors', async () => {
    (getAvailableSlots as jest.Mock).mockRejectedValue(new Error('Fail'));
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
  });

  it('should support type filter', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { type: 'premium' },
    });
    await handler(req, res);
    expect(getAvailableSlots).toHaveBeenCalledWith('premium');
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

  it('should return next release time', async () => {
    // ...
  });

  it('should handle sold out', async () => {
    // ...
  });

  it('should validate query', async () => {
    // ...
  });

  it('should return pricing info', async () => {
    // ...
  });
});
