import { formatCurrency, formatNumber } from '@/lib/utils/format';

describe('lib/utils/format', () => {
  it('should format currency', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('should format large numbers', () => {
    expect(formatNumber(1000000)).toBe('1M');
  });
});
