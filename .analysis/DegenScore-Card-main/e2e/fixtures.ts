import { Page, BrowserContext } from '@playwright/test';

/**
 * E2E Test Fixtures and Seeds
 * Provides pre-configured test data and mock responses for consistent testing
 */

export const fixtures = {
  // Mock wallet addresses for testing
  testWallets: {
    whale1: 'So11111111111111111111111111111111111111112',
    whale2: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
    regularTrader: 'Es9vMFrzaCERmJfqV3CA6Ad8K4e6BW1kt67rR7AwtTs',
    newUser: '4k3Dyjzvzp8eMZWUUbX8HRk1Jmutm5LvMeL3z8zKX39',
    premiumUser: '9B5X4b3KZt9R1qEb8fN7qWp2aZ3vM8kL5pQ6tJ9sX',
    inactiveTrader: '7aB9cD2eF4gH6iJ8kL0mN2pQ4rS6tU8vW0xY2zC',
  },

  // Mock user profiles
  userProfiles: {
    whale1: {
      displayName: 'Whale1',
      degenScore: 95,
      totalTrades: 5000,
      totalVolume: 50000000,
      profitLoss: 5000000,
      winRate: 75,
      badges: ['Early Adopter', 'Top Performer', 'Legend'],
      isPremium: true,
      twitter: 'whale_trader',
      telegram: 'whaletrader',
    },
    regularTrader: {
      displayName: 'RegularTrader',
      degenScore: 65,
      totalTrades: 150,
      totalVolume: 500000,
      profitLoss: 25000,
      winRate: 55,
      badges: ['Silver Badge'],
      isPremium: false,
      twitter: null,
      telegram: 'regulartrader',
    },
    premiumUser: {
      displayName: 'PremiumMember',
      degenScore: 85,
      totalTrades: 500,
      totalVolume: 5000000,
      profitLoss: 500000,
      winRate: 70,
      badges: ['Premium', 'Verified'],
      isPremium: true,
      twitter: 'premium_user',
      telegram: 'premiumuser',
    },
  },

  // Mock trading data
  trades: [
    {
      id: 'trade-1',
      wallet: 'So11111111111111111111111111111111111111112',
      type: 'BUY',
      tokenSymbol: 'USDC',
      amount: 1000,
      price: 1.0,
      timestamp: new Date().getTime() - 3600000,
      pnl: 50,
    },
    {
      id: 'trade-2',
      wallet: 'So11111111111111111111111111111111111111112',
      type: 'SELL',
      tokenSymbol: 'USDT',
      amount: 500,
      price: 0.99,
      timestamp: new Date().getTime() - 7200000,
      pnl: -25,
    },
    {
      id: 'trade-3',
      wallet: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
      type: 'BUY',
      tokenSymbol: 'RAYDIUM',
      amount: 100,
      price: 5.0,
      timestamp: new Date().getTime() - 14400000,
      pnl: 150,
    },
  ],

  // Mock tokens
  tokens: [
    {
      mint: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      price: 1.0,
      marketCap: 35000000000,
    },
    {
      mint: 'Es9vMFrzaCERmJfqV3CA6Ad8K4e6BW1kt67rR7AwtTs',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 6,
      price: 0.99,
      marketCap: 30000000000,
    },
    {
      mint: '4k3Dyjzvzp8eMZWUUbX8HRk1Jmutm5LvMeL3z8zKX39',
      symbol: 'RAYDIUM',
      name: 'Raydium',
      decimals: 6,
      price: 5.0,
      marketCap: 250000000,
    },
  ],

  // Mock badges
  badges: [
    {
      key: 'early_adopter',
      name: 'Early Adopter',
      description: 'First users of DegenScore',
      rarity: 'RARE',
      icon: '🚀',
    },
    {
      key: 'top_performer',
      name: 'Top Performer',
      description: 'Score over 80',
      rarity: 'LEGENDARY',
      icon: '👑',
    },
    {
      key: 'silver_badge',
      name: 'Silver Badge',
      description: 'Score 60-70',
      rarity: 'UNCOMMON',
      icon: '⭐',
    },
  ],

  // Mock referral data
  referrals: [
    {
      referrer: 'So11111111111111111111111111111111111111112',
      referred: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
      timestamp: new Date().getTime() - 86400000,
      earned: 100,
      status: 'completed',
    },
    {
      referrer: 'So11111111111111111111111111111111111111112',
      referred: 'Es9vMFrzaCERmJfqV3CA6Ad8K4e6BW1kt67rR7AwtTs',
      timestamp: new Date().getTime() - 172800000,
      earned: 100,
      status: 'completed',
    },
  ],

  // Mock leaderboard data
  leaderboard: [
    {
      rank: 1,
      wallet: 'So11111111111111111111111111111111111111112',
      displayName: 'Whale1',
      score: 95,
      volume: 50000000,
    },
    {
      rank: 2,
      wallet: '9B5X4b3KZt9R1qEb8fN7qWp2aZ3vM8kL5pQ6tJ9sX',
      displayName: 'PremiumMember',
      score: 85,
      volume: 5000000,
    },
    {
      rank: 3,
      wallet: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
      displayName: 'RegularTrader',
      score: 65,
      volume: 500000,
    },
  ],

  // Mock challenges
  challenges: [
    {
      id: 'challenge-1',
      title: '100 Trades in a Week',
      description: 'Execute 100 trades within 7 days',
      reward: 5000,
      startDate: new Date().getTime(),
      endDate: new Date().getTime() + 604800000,
      progress: 45,
      target: 100,
    },
    {
      id: 'challenge-2',
      title: 'Win Rate Challenge',
      description: 'Achieve 70% win rate',
      reward: 10000,
      startDate: new Date().getTime(),
      endDate: new Date().getTime() + 604800000,
      progress: 65,
      target: 70,
    },
  ],

  // Mock premium features
  premiumFeatures: [
    {
      name: 'Advanced Analytics',
      included: true,
      description: 'Detailed trading insights',
    },
    {
      name: 'Whale Radar',
      included: true,
      description: 'Track whale wallets in real-time',
    },
    {
      name: 'AI Coach',
      included: true,
      description: 'AI-powered trading recommendations',
    },
  ],

  // Mock notifications
  notifications: [
    {
      id: 'notif-1',
      type: 'trade_alert',
      title: 'Large Trade Detected',
      message: 'Whale wallet made a 10 SOL purchase',
      timestamp: new Date().getTime(),
      read: false,
    },
    {
      id: 'notif-2',
      type: 'milestone',
      title: 'New Badge Earned',
      message: 'You earned the "Top Performer" badge!',
      timestamp: new Date().getTime() - 3600000,
      read: false,
    },
  ],

  // Mock pricing plans
  pricingPlans: [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      features: ['Score Generation', 'Card Creation', 'Leaderboard Access'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      period: 'month',
      features: ['Everything in Basic', 'Whale Radar', 'Advanced Analytics', 'Priority Support'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 29.99,
      period: 'month',
      features: ['Everything in Pro', 'AI Coach', 'Custom Alerts', 'API Access'],
    },
  ],

  // Mock wallet transaction history
  transactionHistory: [
    {
      signature: 'sig-1',
      type: 'TRADE',
      amount: 1000,
      timestamp: new Date().getTime() - 3600000,
      status: 'success',
    },
    {
      signature: 'sig-2',
      type: 'TRANSFER',
      amount: 5000,
      timestamp: new Date().getTime() - 7200000,
      status: 'success',
    },
    {
      signature: 'sig-3',
      type: 'TRADE',
      amount: 500,
      timestamp: new Date().getTime() - 14400000,
      status: 'success',
    },
  ],
};

/**
 * Setup mock data for a test session
 */
export async function seedTestData(page: Page) {
  // Store test data in localStorage for mock API to use
  await page.evaluate((data) => {
    localStorage.setItem('__test_fixtures__', JSON.stringify(data));
  }, fixtures);
}

/**
 * Clear test data after test
 */
export async function clearTestData(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('__test_fixtures__');
  });
}

/**
 * Get a specific fixture by path
 */
export function getFixture(path: string) {
  const parts = path.split('.');
  let current: any = fixtures;

  for (const part of parts) {
    current = current[part];
    if (current === undefined) return undefined;
  }

  return current;
}

/**
 * Generate mock card image data
 */
export async function generateMockCardData(walletAddress: string) {
  return {
    walletAddress,
    degenScore: Math.floor(Math.random() * 100),
    totalTrades: Math.floor(Math.random() * 1000),
    totalVolume: Math.floor(Math.random() * 10000000),
    profitLoss: Math.floor((Math.random() - 0.5) * 1000000),
    winRate: Math.floor(Math.random() * 100),
    badges: ['Early Adopter'],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate mock referral link
 */
export function generateMockReferralLink(userId: string): string {
  return `https://degenscore.com/?ref=${userId}`;
}

/**
 * Generate mock leaderboard ranking
 */
export function generateMockLeaderboardEntry(rank: number, score: number) {
  return {
    rank,
    displayName: `Trader${rank}`,
    score,
    volume: score * 100000,
    badges: rank <= 3 ? ['Top Performer'] : [],
  };
}
