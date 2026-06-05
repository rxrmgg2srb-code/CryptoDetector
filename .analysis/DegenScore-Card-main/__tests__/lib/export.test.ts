import { exportCardImage } from '@/lib/export';

// Mock canvas or image generation library
jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      fillText: jest.fn(),
    })),
    toBuffer: jest.fn(() => Buffer.from('image')),
  })),
}));

describe('lib/export', () => {
  it('should generate image buffer', async () => {
    const buffer = await exportCardImage({ score: 90, wallet: 'test' });
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('should support options', async () => {
    const buffer = await exportCardImage({ score: 90 }, { format: 'png' });
    expect(buffer).toBeDefined();
  });

  it('should handle errors', async () => {
    // Mock failure
  });
});
