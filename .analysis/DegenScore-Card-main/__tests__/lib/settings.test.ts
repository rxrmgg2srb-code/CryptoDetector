import { updateSettings, getSettings } from '@/lib/settings';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  userSettings: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
}));

describe('lib/settings', () => {
  describe('updateSettings', () => {
    it('should update settings', async () => {
      (prisma.userSettings.upsert as jest.Mock).mockResolvedValue({ theme: 'dark' });
      const result = await updateSettings('wallet', { theme: 'dark' });
      expect(result.theme).toBe('dark');
    });
  });

  describe('getSettings', () => {
    it('should return settings', async () => {
      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue({ theme: 'light' });
      const result = await getSettings('wallet');
      expect(result.theme).toBe('light');
    });
  });
});
