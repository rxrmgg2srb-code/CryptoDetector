// Global type definitions

interface Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    signTransaction: (transaction: any) => Promise<any>;
    signAllTransactions: (transactions: any[]) => Promise<any[]>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback: (...args: any[]) => void) => void;
    request: (args: { method: string; params?: any }) => Promise<any>;
    publicKey?: { toString: () => string };
  };
}

// Canvas Confetti type declaration
declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface ConfettiFunction {
    (options?: Options): Promise<null> | null;
    reset(): void;
  }

  const confetti: ConfettiFunction;
  export default confetti;
}

declare module 'jsonwebtoken' {
  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string | Buffer,
    options?: any
  ): string;
  export function verify(token: string, secretOrPublicKey: string | Buffer, options?: any): any;
  export function decode(token: string, options?: any): any;
  export class TokenExpiredError extends Error {
    expiredAt: Date;
  }
  export class JsonWebTokenError extends Error {
    inner: Error;
  }
}
