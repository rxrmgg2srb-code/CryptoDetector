import { uploadFile, downloadFile, deleteFile, listFiles, getSignedUrl } from '@/lib/storage';

jest.mock('@aws-sdk/client-s3');
jest.mock('@/lib/logger');

describe('storage', () => {
  const testFile = Buffer.from('test content');
  const testKey = 'test/file.png';

  it('should upload file to S3', async () => {
    const result = await uploadFile(testKey, testFile, 'image/png');
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('key');
  });

  it('should download file from S3', async () => {
    const data = await downloadFile(testKey);
    expect(Buffer.isBuffer(data)).toBe(true);
  });

  it('should delete file from S3', async () => {
    await expect(deleteFile(testKey)).resolves.not.toThrow();
  });

  it('should list files in bucket', async () => {
    const files = await listFiles({ prefix: 'test/' });
    expect(Array.isArray(files)).toBe(true);
  });

  it('should generate signed URL', async () => {
    const url = await getSignedUrl(testKey, { expiresIn: 3600 });
    expect(url).toContain('https://');
    expect(url).toContain(testKey);
  });

  it('should handle large files', async () => {
    const large = Buffer.alloc(10 * 1024 * 1024); // 10MB
    await expect(uploadFile('large.bin', large)).resolves.toBeDefined();
  });

  it('should validate file types', async () => {
    await expect(uploadFile('test.exe', testFile, 'application/exe')).rejects.toThrow();
  });

  it('should handle concurrent uploads', async () => {
    const uploads = Array(10)
      .fill(null)
      .map((_, i) => uploadFile(`test-${i}.png`, testFile, 'image/png'));
    await expect(Promise.all(uploads)).resolves.toHaveLength(10);
  });

  it('should compress images before upload', async () => {
    const result = await uploadFile('image.png', testFile, 'image/png', { compress: true });
    expect(result).toHaveProperty('compressed');
  });

  it('should handle S3 errors gracefully', async () => {
    (s3Client.send as jest.Mock).mockRejectedValue(new Error('S3 error'));
    await expect(uploadFile(testKey, testFile)).rejects.toThrow();
  });
});
