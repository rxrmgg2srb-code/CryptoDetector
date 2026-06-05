/**
 * Reusable testing helpers.
 * These utilities provide common mocks and async helpers for Jest tests.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// Async helpers
// ============================================================================

export const sleep = (ms = 0): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const flushAsyncOps = async (): Promise<void> => {
  await Promise.resolve();
  await sleep(0);
};

export const advanceTimers = async (ms = 0): Promise<void> => {
  if (typeof jest.advanceTimersByTime === 'function') {
    try {
      jest.advanceTimersByTime(ms);
      await flushAsyncOps();
      return;
    } catch {
      // Timers are not mocked, fall back to real timers
    }
  }

  await sleep(ms);
};

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export const createDeferred = <T = void>(): Deferred<T> => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

// ============================================================================
// Prisma helpers
// ============================================================================

const prismaModelNames = [
  'user',
  'wallet',
  'score',
  'badge',
  'degenCard',
  'payment',
  'globalStats',
  'hotTrade',
  'subscription',
  'promoCode',
  'promoRedemption',
  'weeklyChallenge',
  'referral',
  'rateLimitLog',
  'activityLog',
  'scoreHistory',
  'userFollows',
  'notificationPreferences',
  'tokenAnalysis',
  'flashSale',
  'flashSaleRedemption',
  'userStreak',
  'dailyChallenge',
  'dailyChallengeCompletion',
  'tradingDuel',
  'virtualTrade',
  'userAnalytics',
  'achievement',
  'achievementUnlock',
  'aICoachAnalysis',
  'whaleWallet',
  'whaleAlert',
  'telegramUser',
  'whaleFollower',
  'superTokenAnalysis',
] as const;

export type PrismaModelName = (typeof prismaModelNames)[number];

export const createMockPrismaModel = () => ({
  findUnique: jest.fn(),
  findMany: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

export const createMockPrismaClient = () => {
  const client: Record<string, ReturnType<typeof createMockPrismaModel>> & {
    $connect: jest.Mock<Promise<void>, []>;
    $disconnect: jest.Mock<Promise<void>, []>;
    $transaction: jest.Mock<Promise<unknown>, [unknown]>;
    $queryRaw: jest.Mock;
    $executeRaw: jest.Mock;
  } = {} as any;

  prismaModelNames.forEach((model) => {
    client[model] = createMockPrismaModel();
  });

  client.$connect = jest.fn().mockResolvedValue(undefined);
  client.$disconnect = jest.fn().mockResolvedValue(undefined);
  client.$queryRaw = jest.fn();
  client.$executeRaw = jest.fn();
  client.$transaction = jest.fn(async (arg: any) => {
    if (typeof arg === 'function') {
      return arg(client);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg;
  });

  return client;
};

// ============================================================================
// Redis helpers
// ============================================================================

export const createMockRedis = () => {
  const kv = new Map<string, unknown>();
  const sets = new Map<string, Set<string>>();

  return {
    get: jest.fn(async (key: string) => (kv.has(key) ? kv.get(key) : null)),
    set: jest.fn(async (key: string, value: unknown) => {
      kv.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (...keys: string[]) => {
      let removed = 0;
      keys.forEach((key) => {
        if (kv.delete(key) || sets.delete(key)) {
          removed += 1;
        }
      });
      return removed;
    }),
    incr: jest.fn(async (key: string) => {
      const next = Number(kv.get(key) ?? 0) + 1;
      kv.set(key, next);
      return next;
    }),
    expire: jest.fn(async () => true),
    sadd: jest.fn(async (key: string, member: string) => {
      const set = sets.get(key) ?? new Set<string>();
      const sizeBefore = set.size;
      set.add(member);
      sets.set(key, set);
      return set.size > sizeBefore ? 1 : 0;
    }),
    smembers: jest.fn(async (key: string) => {
      const set = sets.get(key);
      return set ? Array.from(set) : [];
    }),
    flushall: jest.fn(async () => {
      kv.clear();
      sets.clear();
      return 'OK';
    }),
  };
};

// ============================================================================
// Pusher helpers
// ============================================================================

export const createMockPusher = () => ({
  trigger: jest.fn().mockResolvedValue(true),
  triggerBatch: jest.fn().mockResolvedValue(true),
  channel: jest.fn(),
  authorizeChannel: jest.fn().mockResolvedValue({ auth: 'mock-auth' }),
  close: jest.fn(),
});

export const createMockPusherClient = () => {
  const channel = {
    bind: jest.fn(),
    unbind: jest.fn(),
    trigger: jest.fn(),
  };

  return {
    subscribe: jest.fn().mockReturnValue(channel),
    unsubscribe: jest.fn(),
    bind: jest.fn(),
    unbind: jest.fn(),
    disconnect: jest.fn(),
  };
};

// ============================================================================
// Test setup helpers
// ============================================================================

export const setupTestEnv = (): void => {
  if (typeof beforeEach === 'function') {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.clearAllTimers();
    });
  }

  if (typeof afterEach === 'function') {
    afterEach(() => {
      jest.clearAllMocks();
      jest.clearAllTimers();
      jest.restoreAllMocks();

      const fetchMock = globalThis.fetch as jest.Mock | undefined;
      fetchMock?.mockClear?.();
    });
  }
};

export type MockFetchResponseConfig = {
  status?: number;
  ok?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
  delay?: number;
};

export type MockFetchResponder =
  | MockFetchResponseConfig
  | ((
      input: RequestInfo | URL,
      init?: RequestInit
    ) => MockFetchResponseConfig | Promise<MockFetchResponseConfig>);

const buildFetchResponse = (config: MockFetchResponseConfig = {}): Response => {
  const { status = 200, headers = {}, ok } = config;
  const body =
    config.body === undefined
      ? ''
      : typeof config.body === 'string'
        ? config.body
        : JSON.stringify(config.body);

  const response = new Response(body, { status, headers });

  if (typeof ok === 'boolean') {
    Object.defineProperty(response, 'ok', {
      value: ok,
      configurable: true,
    });
  }

  return response;
};

export const mockFetch = (
  responses: MockFetchResponder | MockFetchResponder[]
): jest.MockedFunction<typeof fetch> => {
  const queue = Array.isArray(responses) ? [...responses] : [responses];

  const fetchMock = jest.fn(async (...args: Parameters<typeof fetch>) => {
    const responder = queue.length > 1 ? queue.shift()! : queue.length === 1 ? queue[0] : undefined;

    let config: MockFetchResponseConfig | undefined;

    if (typeof responder === 'function') {
      config = await responder(...args);
    } else {
      config = responder;
    }

    const normalized = config ?? {};

    if (normalized.delay) {
      await sleep(normalized.delay);
    }

    return buildFetchResponse(normalized);
  }) as jest.MockedFunction<typeof fetch>;

  globalThis.fetch = fetchMock;

  return fetchMock;
};

export const mockConsole = (
  methods: Array<'log' | 'warn' | 'error' | 'info' | 'debug'> = ['log', 'warn', 'error']
): Record<string, jest.SpyInstance> => {
  return methods.reduce<Record<string, jest.SpyInstance>>((acc, method) => {
    acc[method] = jest.spyOn(console, method).mockImplementation(() => undefined);
    return acc;
  }, {});
};

// ============================================================================
// Wallet / Solana helpers
// ============================================================================

export interface MockTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  meta: {
    err: null | Record<string, unknown>;
    fee: number;
  };
  transaction: {
    message: {
      accountKeys: Array<{ pubkey: string }>;
      instructions: Array<{
        programId: string;
        accounts: number[];
        data: string;
      }>;
    };
  };
  serialize: jest.Mock<Uint8Array, []>;
  toString: () => string;
}

export const generateMockAddress = (): string => {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = '';
  for (let i = 0; i < 44; i += 1) {
    address += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return address;
};

export const generateMockSignature = (): string => {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let signature = '';
  for (let i = 0; i < 88; i += 1) {
    signature += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return signature;
};

export const createMockTransaction = (signature = generateMockSignature()): MockTransaction => {
  const encoder = new TextEncoder();

  return {
    signature,
    slot: Date.now(),
    blockTime: Math.floor(Date.now() / 1000),
    meta: {
      err: null,
      fee: 5000,
    },
    transaction: {
      message: {
        accountKeys: [{ pubkey: generateMockAddress() }, { pubkey: generateMockAddress() }],
        instructions: [
          {
            programId: 'system',
            accounts: [0, 1],
            data: 'mock-data',
          },
        ],
      },
    },
    serialize: jest.fn(() => encoder.encode(signature)),
    toString: () => signature,
  };
};

export interface MockWallet {
  publicKey: {
    toBase58: () => string;
    equals: (other?: { toBase58: () => string } | null) => boolean;
  };
  connected: boolean;
  connecting: boolean;
  connect: jest.Mock<Promise<void>, []>;
  disconnect: jest.Mock<Promise<void>, []>;
  signMessage: jest.Mock<Promise<Uint8Array>, [Uint8Array | string]>;
  signTransaction: jest.Mock<Promise<MockTransaction>, [MockTransaction?]>;
  signAllTransactions: jest.Mock<Promise<MockTransaction[]>, [MockTransaction[]?]>;
}

export const createMockWallet = (address = generateMockAddress()): MockWallet => {
  const publicKey = {
    toBase58: () => address,
    equals: (other?: { toBase58: () => string } | null) => other?.toBase58?.() === address,
  };

  return {
    publicKey,
    connected: true,
    connecting: false,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    signMessage: jest.fn(async (message: Uint8Array | string) => {
      if (typeof message === 'string') {
        return new TextEncoder().encode(message);
      }
      return message;
    }),
    signTransaction: jest.fn(async (tx?: MockTransaction) => tx ?? createMockTransaction()),
    signAllTransactions: jest.fn(async (txs?: MockTransaction[]) => txs ?? []),
  };
};

export const createMockTransactionSignature = () => generateMockSignature();

export const createMockConnection = () => ({
  getTransaction: jest.fn(),
  getParsedTransaction: jest.fn(),
  getBalance: jest.fn(),
  getAccountInfo: jest.fn(),
  getRecentBlockhash: jest.fn(),
  confirmTransaction: jest.fn(),
  sendTransaction: jest.fn(),
  sendRawTransaction: jest.fn(),
  getSignaturesForAddress: jest.fn(),
  getParsedTokenAccountsByOwner: jest.fn(),
});

// ============================================================================
// API helpers
// ============================================================================

export interface MockNextApiResponse {
  status: jest.Mock<MockNextApiResponse, [number]>;
  json: jest.Mock;
  setHeader: jest.Mock;
  end: jest.Mock;
}

export const createMockNextApiResponse = (
  overrides: Partial<MockNextApiResponse> = {}
): MockNextApiResponse => {
  const response: MockNextApiResponse = {
    status: jest.fn<MockNextApiResponse, [number]>(),
    json: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(),
  };

  response.status.mockReturnValue(response);

  if (Object.keys(overrides).length > 0) {
    Object.assign(response, overrides);
  }

  return response;
};

export interface MockApiContext {
  req: Partial<NextApiRequest>;
  res: MockNextApiResponse;
  json: jest.Mock;
  status: jest.Mock;
}

export const createMockApiContext = (
  overrides: {
    req?: Partial<NextApiRequest>;
    res?: Partial<MockNextApiResponse>;
  } = {}
): MockApiContext => {
  const req: Partial<NextApiRequest> = {
    method: 'GET',
    body: {},
    query: {},
    headers: {},
    cookies: {},
    ...overrides.req,
  };

  const res = createMockNextApiResponse(overrides.res);

  return { req, res, json: res.json, status: res.status };
};

export const createMockWalletContext = (wallet: MockWallet = createMockWallet()) => ({
  wallet,
  publicKey: wallet.publicKey,
  connected: wallet.connected,
  connecting: wallet.connecting,
  disconnecting: false,
  select: jest.fn(),
  connect: wallet.connect,
  disconnect: wallet.disconnect,
  sendTransaction: jest.fn(),
  signTransaction: wallet.signTransaction,
  signAllTransactions: wallet.signAllTransactions,
  signMessage: wallet.signMessage,
});

// ============================================================================
// Default export for convenience
// ============================================================================

export default {
  // async helpers
  sleep,
  flushAsyncOps,
  advanceTimers,
  createDeferred,

  // prisma
  createMockPrismaModel,
  createMockPrismaClient,

  // redis
  createMockRedis,

  // pusher
  createMockPusher,
  createMockPusherClient,

  // setup
  setupTestEnv,
  mockFetch,
  mockConsole,

  // solana / wallet
  generateMockAddress,
  generateMockSignature,
  createMockTransaction,
  createMockTransactionSignature,
  createMockWallet,
  createMockConnection,

  // api
  createMockNextApiResponse,
  createMockApiContext,
  createMockWalletContext,
};
