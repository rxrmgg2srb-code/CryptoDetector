import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as jwt from 'jsonwebtoken';

// Mock @solana/web3.js BEFORE import
jest.mock('@solana/web3.js', () => ({
  PublicKey: class {
    constructor(key) {
      this.key = key;
    }
    toBytes() {
      return new Uint8Array([]);
    }
    toString() {
      return this.key;
    }
  },
}));

import {
  generateAuthChallenge,
  verifyWalletSignature,
  isAuthChallengeValid,
  verifyAuthentication,
  generateSessionToken,
  verifySessionToken,
} from '@/lib/walletAuth';

// Mock dependencies
jest.mock('tweetnacl', () => ({
  sign: {
    detached: {
      verify: jest.fn(),
    },
  },
}));

jest.mock('bs58', () => ({
  decode: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  TokenExpiredError: class extends Error {},
  JsonWebTokenError: class extends Error {},
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('Wallet Authentication Security 🔐', () => {
  const mockWallet = 'So11111111111111111111111111111111111111112';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'super-secret-key-that-is-at-least-32-chars-long';
  });

  describe('generateAuthChallenge', () => {
    it('should generate a valid challenge structure', () => {
      const challenge = generateAuthChallenge(mockWallet);

      expect(challenge).toHaveProperty('message');
      expect(challenge).toHaveProperty('timestamp');
      expect(challenge).toHaveProperty('nonce');
      expect(challenge.message).toContain(mockWallet);
      expect(challenge.message).toContain(challenge.nonce);
    });
  });

  describe('verifyWalletSignature', () => {
    it('should return true for valid signature', () => {
      (bs58.decode as jest.Mock).mockReturnValue(new Uint8Array([1, 2, 3]));
      (nacl.sign.detached.verify as jest.Mock).mockReturnValue(true);

      const isValid = verifyWalletSignature('signature', 'message', mockWallet);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid signature', () => {
      (bs58.decode as jest.Mock).mockReturnValue(new Uint8Array([1, 2, 3]));
      (nacl.sign.detached.verify as jest.Mock).mockReturnValue(false);

      const isValid = verifyWalletSignature('signature', 'message', mockWallet);
      expect(isValid).toBe(false);
    });

    it('should handle errors gracefully', () => {
      (bs58.decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid base58');
      });

      const isValid = verifyWalletSignature('bad-sig', 'message', mockWallet);
      expect(isValid).toBe(false);
    });
  });

  describe('isAuthChallengeValid', () => {
    it('should accept recent timestamp', () => {
      const now = Date.now();
      expect(isAuthChallengeValid(now)).toBe(true);
      expect(isAuthChallengeValid(now - 1000)).toBe(true); // 1 sec ago
    });

    it('should reject old timestamp', () => {
      const old = Date.now() - 6 * 60 * 1000; // 6 mins ago
      expect(isAuthChallengeValid(old)).toBe(false);
    });

    it('should reject future timestamp', () => {
      const future = Date.now() + 10000;
      expect(isAuthChallengeValid(future)).toBe(false);
    });
  });

  describe('verifyAuthentication', () => {
    it('should verify valid authentication response', () => {
      const response = {
        publicKey: mockWallet,
        signature: 'sig',
        message: `Wallet: ${mockWallet}`,
        timestamp: Date.now(),
      };

      (bs58.decode as jest.Mock).mockReturnValue(new Uint8Array([]));
      (nacl.sign.detached.verify as jest.Mock).mockReturnValue(true);

      const result = verifyAuthentication(response);
      expect(result.valid).toBe(true);
    });

    it('should fail if timestamp expired', () => {
      const response = {
        publicKey: mockWallet,
        signature: 'sig',
        message: 'msg',
        timestamp: Date.now() - 10 * 60 * 1000, // 10 mins ago
      };

      const result = verifyAuthentication(response);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should fail if message does not contain wallet', () => {
      const response = {
        publicKey: mockWallet,
        signature: 'sig',
        message: 'Wrong wallet address here',
        timestamp: Date.now(),
      };

      (nacl.sign.detached.verify as jest.Mock).mockReturnValue(true);

      const result = verifyAuthentication(response);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not match');
    });
  });

  describe('JWT Session Management', () => {
    it('should generate valid JWT', () => {
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const token = generateSessionToken(mockWallet);
      expect(token).toBe('mock-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ wallet: mockWallet }),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should throw if secret is missing or short', () => {
      process.env.JWT_SECRET = 'short';
      expect(() => generateSessionToken(mockWallet)).toThrow();
    });

    it('should verify valid JWT', () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        wallet: mockWallet,
        sub: mockWallet,
      });

      const result = verifySessionToken('valid-token');
      expect(result.valid).toBe(true);
      expect(result.wallet).toBe(mockWallet);
    });

    it('should handle expired token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('expired', new Date());
      });

      const result = verifySessionToken('expired-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Session expired');
    });

    it('should handle invalid signature', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid');
      });

      const result = verifySessionToken('bad-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token signature');
    });
  });
});
