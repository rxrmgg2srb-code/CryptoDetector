import { simulateUser } from '@/lib/simulation';

describe('Stress: Concurrent Users', () => {
  it('should handle 1000 concurrent users', async () => {
    const users = Array(1000).fill(null);
    const results = await Promise.all(users.map(() => simulateUser()));
    const success = results.filter((r) => r.success).length;
    expect(success).toBeGreaterThan(950); // Allow some failures
  });
});
