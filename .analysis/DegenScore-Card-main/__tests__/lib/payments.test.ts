import { recordPayment, processStripeWebhook } from '@/lib/payments';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  payment: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe('lib/payments', () => {
  describe('recordPayment', () => {
    it('should record payment', async () => {
      (prisma.payment.create as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await recordPayment({ amount: 100, wallet: 'test' });
      expect(result.id).toBe(1);
    });
  });

  describe('processStripeWebhook', () => {
    it('should process success event', async () => {
      const event = { type: 'payment_intent.succeeded', data: { object: { id: 'pi_1' } } };
      const result = await processStripeWebhook(event);
      expect(result.processed).toBe(true);
    });
  });
});
