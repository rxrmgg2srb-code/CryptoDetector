import { getAvailableSlots } from '@/lib/scarcity';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  scarcitySlot: {
    count: jest.fn(),
  },
}));

describe('lib/scarcity', () => {
  describe('getAvailableSlots', () => {
    it('should return available slots', async () => {
      (prisma.scarcitySlot.count as jest.Mock).mockResolvedValue(5);
      const result = await getAvailableSlots();
      expect(result.slots).toBeDefined();
    });
  });
});
