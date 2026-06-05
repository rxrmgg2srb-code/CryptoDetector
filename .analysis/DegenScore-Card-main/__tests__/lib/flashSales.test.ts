import { getActiveFlashSales, redeemFlashSale } from '@/lib/flashSales';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  flashSale: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

describe('lib/flashSales', () => {
  describe('getActiveFlashSales', () => {
    it('should return active sales', async () => {
      (prisma.flashSale.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
      const result = await getActiveFlashSales();
      expect(result).toHaveLength(1);
    });
  });

  describe('redeemFlashSale', () => {
    it('should redeem sale', async () => {
      (prisma.flashSale.findUnique as jest.Mock).mockResolvedValue({ stock: 10 });
      (prisma.flashSale.update as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await redeemFlashSale('sale-1', 'wallet');
      expect(result.success).toBe(true);
    });

    it('should fail if out of stock', async () => {
      (prisma.flashSale.findUnique as jest.Mock).mockResolvedValue({ stock: 0 });
      await expect(redeemFlashSale('sale-1', 'wallet')).rejects.toThrow();
    });
  });
});
