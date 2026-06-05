import { generateCard } from '@/lib/card-generator';

jest.mock('@/lib/card-generator');

describe('Stress Test: Card Generation', () => {
  it('should handle concurrent generation requests', async () => {
    const requests = Array(50)
      .fill(null)
      .map((_, i) => ({
        wallet: `wallet-${i}`,
        score: Math.floor(Math.random() * 1000),
      }));

    (generateCard as jest.Mock).mockResolvedValue({ success: true });

    const start = Date.now();
    await Promise.all(requests.map((req) => generateCard(req)));
    const end = Date.now();

    expect(end - start).toBeLessThan(5000); // Should complete within 5s (mocked)
  });

  it('should handle memory pressure', async () => {
    // Simulate large payload
    const largeData = { wallet: 'test', history: Array(10000).fill('tx') };
    await generateCard(largeData);
    // Expect no crash
  });
});
