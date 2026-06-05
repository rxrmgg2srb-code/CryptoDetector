import { generateOgImage } from '@/lib/og';

// Mock canvas or similar
jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      fillText: jest.fn(),
    })),
    toBuffer: jest.fn(() => Buffer.from('image')),
  })),
}));

describe('lib/og', () => {
  it('should generate OG image buffer', async () => {
    const buffer = await generateOgImage({ title: 'Test' });
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('should support options', async () => {
    const buffer = await generateOgImage({ title: 'Test', description: 'Desc' });
    expect(buffer).toBeDefined();
  });
});
