import { clamp, randomRange } from '@/lib/utils/number';

describe('lib/utils/number', () => {
  it('should clamp values', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it('should generate random number in range', () => {
    const num = randomRange(1, 10);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(10);
  });
});
