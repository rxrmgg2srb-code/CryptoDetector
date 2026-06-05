import { formatDate, timeAgo } from '@/lib/utils/date';

describe('lib/utils/date', () => {
  it('should format date', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('Jan 1, 2024');
  });

  it('should return relative time', () => {
    const now = new Date();
    expect(timeAgo(now)).toBe('just now');
  });
});
