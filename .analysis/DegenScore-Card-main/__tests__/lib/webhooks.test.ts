import { processHeliusWebhook } from '@/lib/webhooks';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  webhookEvent: {
    create: jest.fn(),
  },
}));

describe('lib/webhooks', () => {
  describe('processHeliusWebhook', () => {
    it('should process transfer event', async () => {
      const payload = [{ type: 'TRANSFER', signature: 'sig' }];
      const result = await processHeliusWebhook(payload);
      expect(result.processed).toBe(true);
    });

    it('should log event', async () => {
      const payload = [{ type: 'TRANSFER', signature: 'sig' }];
      await processHeliusWebhook(payload);
      expect(prisma.webhookEvent.create).toHaveBeenCalled();
    });

    it('should ignore unknown events', async () => {
      const payload = [{ type: 'UNKNOWN' }];
      const result = await processHeliusWebhook(payload);
      expect(result.processed).toBe(true);
    });
  });
});
