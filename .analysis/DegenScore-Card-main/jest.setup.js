// jest.setup.js – Global test setup
require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

// Polyfills for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill TransformStream for Playwright/E2E compatibility
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor() {
      this.readable = {};
      this.writable = {};
    }
  };
}

// Mock environment variables
process.env.NEXT_PUBLIC_SOLANA_NETWORK = 'devnet';
process.env.NEXT_PUBLIC_RPC_ENDPOINT = 'https://api.devnet.solana.com';
process.env.JWT_SECRET = 'test-secret-key-minimum-48-chars-for-security-compliance';
process.env.NEXT_PUBLIC_MAX_PREMIUM_SLOTS = '1000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock fetch (node-fetch) globally
jest.mock('node-fetch');
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    locale: 'en',
    locales: ['en', 'es'],
    defaultLocale: 'en',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock framer-motion using React.createElement
const React = require('react');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

// Simple shallow mock for Prisma models
const mockModel = () => ({
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

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: mockModel(),
    wallet: mockModel(),
    score: mockModel(),
    badge: mockModel(),
    degenCard: mockModel(),
    payment: mockModel(),
    globalStats: mockModel(),
    hotTrade: mockModel(),
    subscription: mockModel(),
    promoCode: mockModel(),
    promoRedemption: mockModel(),
    weeklyChallenge: mockModel(),
    referral: mockModel(),
    rateLimitLog: mockModel(),
    activityLog: mockModel(),
    scoreHistory: mockModel(),
    userFollows: mockModel(),
    notificationPreferences: mockModel(),
    tokenAnalysis: mockModel(),
    flashSale: mockModel(),
    flashSaleRedemption: mockModel(),
    userStreak: mockModel(),
    dailyChallenge: mockModel(),
    dailyChallengeCompletion: mockModel(),
    tradingDuel: mockModel(),
    virtualTrade: mockModel(),
    userAnalytics: mockModel(),
    achievement: mockModel(),
    achievementUnlock: mockModel(),
    aICoachAnalysis: mockModel(),
    whaleWallet: mockModel(),
    whaleAlert: mockModel(),
    telegramUser: mockModel(),
    whaleFollower: mockModel(),
    superTokenAnalysis: mockModel(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((cb) => cb(this)),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  })),
}));

// Mock Next.js head and link components
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }) => React.createElement(React.Fragment, null, children),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => React.createElement('a', { href }, children),
}));

// Optional: silence console errors in tests
// const originalError = console.error;
// console.error = jest.fn();
