import { verifyWallet, generateNonce } from '@/lib/auth';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

describe('lib/auth', () => {
  describe('generateNonce', () => {
    it('should generate a random string', () => {
      const nonce = generateNonce();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(10);
    });
  });

  describe('verifyWallet', () => {
    it('should verify valid signature', async () => {
      const keyPair = nacl.sign.keyPair();
      const message = 'Sign this message';
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, keyPair.secretKey);
      const signatureBase58 = bs58.encode(signature);
      const wallet = bs58.encode(keyPair.publicKey);

      const result = await verifyWallet({
        wallet,
        signature: signatureBase58,
        message,
      });

      expect(result.verified).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const result = await verifyWallet({
        wallet: 'wallet',
        signature: 'bad-sig',
        message: 'msg',
      });
      expect(result.verified).toBe(false);
    });

    it('should handle malformed inputs', async () => {
      const result = await verifyWallet({
        wallet: 'invalid',
        signature: 'invalid',
        message: 'msg',
      });
      expect(result.verified).toBe(false);
    });
  });
});
