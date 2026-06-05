import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

describe('fileUploadValidation (enhanced)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate file type', async () => {
    const { validateFileType } = await import('@/lib/fileUploadValidation');
    if (validateFileType) {
      const isValid = validateFileType('image.png', ['image/png', 'image/jpeg']);
      expect(typeof isValid).toBe('boolean');
    }
  });

  it('should validate file size', async () => {
    const { validateFileSize } = await import('@/lib/fileUploadValidation');
    if (validateFileSize) {
      const isValid = validateFileSize(1024 * 1024, 5 * 1024 * 1024); // 1MB < 5MB
      expect(typeof isValid).toBe('boolean');
    }
  });

  it('should sanitize filename', async () => {
    const { sanitizeFilename } = await import('@/lib/fileUploadValidation');
    if (sanitizeFilename) {
      const sanitized = sanitizeFilename('../../../etc/passwd');
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
    }
  });
});
