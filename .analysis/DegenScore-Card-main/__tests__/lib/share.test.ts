import { generateShareText } from '@/lib/share';

describe('lib/share', () => {
  describe('generateShareText', () => {
    it('should generate text with score', () => {
      const text = generateShareText({ score: 90, rank: 'Whale' });
      expect(text).toContain('90');
      expect(text).toContain('Whale');
    });

    it('should include hashtags', () => {
      const text = generateShareText({ score: 90 });
      expect(text).toContain('#DegenScore');
    });
  });
});
