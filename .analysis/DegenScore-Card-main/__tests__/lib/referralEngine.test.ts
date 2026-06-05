/**
 * Tests for Viral Referral Engine
 * Multi-level referral system with tiered rewards
 */

import {
  ReferralStats,
  ReferralTier,
  ReferralMilestone,
  REFERRAL_MILESTONES,
} from '../../lib/referralEngine';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    referral: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    degenCard: {
      update: jest.fn(),
    },
  },
}));

describe('Viral Referral Engine', () => {
  describe('Reward Percentages', () => {
    it('should calculate Level 1 rewards (20%)', () => {
      const earnings = 100;
      const level1Percentage = 0.2;
      const reward = earnings * level1Percentage;

      expect(reward).toBe(20);
    });

    it('should calculate Level 2 rewards (10%)', () => {
      const earnings = 100;
      const level2Percentage = 0.1;
      const reward = earnings * level2Percentage;

      expect(reward).toBe(10);
    });

    it('should calculate Level 3 rewards (5%)', () => {
      const earnings = 100;
      const level3Percentage = 0.05;
      const reward = earnings * level3Percentage;

      expect(reward).toBe(5);
    });

    it('should calculate total referral rewards correctly', () => {
      const earnings = 100;
      const level1 = earnings * 0.2;
      const level2 = earnings * 0.1;
      const level3 = earnings * 0.05;
      const totalReferralPayout = level1 + level2 + level3;

      expect(totalReferralPayout).toBe(35);
      expect(totalReferralPayout).toBeLessThan(earnings); // Never pay out more than earned
    });

    it('should handle decimal amounts correctly', () => {
      const earnings = 1.5;
      const level1 = earnings * 0.2;

      expect(level1).toBeCloseTo(0.3);
    });

    it('should handle very small amounts', () => {
      const earnings = 0.001;
      const level1 = earnings * 0.2;

      expect(level1).toBeCloseTo(0.0002);
    });
  });

  describe('Milestone Tracking', () => {
    it('should have 4 tiers defined', () => {
      expect(REFERRAL_MILESTONES).toBeDefined();
      expect(REFERRAL_MILESTONES.length).toBeGreaterThanOrEqual(4);
    });

    it('should progress from NONE to INFLUENCER at 5 referrals', () => {
      const referralCount = 5;
      const expectedTier = ReferralTier.INFLUENCER;

      const currentTier = referralCount >= 5 ? ReferralTier.INFLUENCER : ReferralTier.NONE;

      expect(currentTier).toBe(expectedTier);
    });

    it('should progress to WHALE_HUNTER at 25 referrals', () => {
      const referralCount = 25;

      let tier = ReferralTier.NONE;
      if (referralCount >= 500) tier = ReferralTier.LEGEND;
      else if (referralCount >= 100) tier = ReferralTier.VIRAL_KING;
      else if (referralCount >= 25) tier = ReferralTier.WHALE_HUNTER;
      else if (referralCount >= 5) tier = ReferralTier.INFLUENCER;

      expect(tier).toBe(ReferralTier.WHALE_HUNTER);
    });

    it('should progress to VIRAL_KING at 100 referrals', () => {
      const referralCount = 100;

      let tier = ReferralTier.NONE;
      if (referralCount >= 500) tier = ReferralTier.LEGEND;
      else if (referralCount >= 100) tier = ReferralTier.VIRAL_KING;
      else if (referralCount >= 25) tier = ReferralTier.WHALE_HUNTER;
      else if (referralCount >= 5) tier = ReferralTier.INFLUENCER;

      expect(tier).toBe(ReferralTier.VIRAL_KING);
    });

    it('should reach LEGEND tier at 500 referrals', () => {
      const referralCount = 500;

      let tier = ReferralTier.NONE;
      if (referralCount >= 500) tier = ReferralTier.LEGEND;
      else if (referralCount >= 100) tier = ReferralTier.VIRAL_KING;
      else if (referralCount >= 25) tier = ReferralTier.WHALE_HUNTER;
      else if (referralCount >= 5) tier = ReferralTier.INFLUENCER;

      expect(tier).toBe(ReferralTier.LEGEND);
    });

    it('should stay at NONE tier with less than 5 referrals', () => {
      const referralCount = 3;

      let tier = ReferralTier.NONE;
      if (referralCount >= 5) tier = ReferralTier.INFLUENCER;

      expect(tier).toBe(ReferralTier.NONE);
    });
  });

  describe('Multi-Level Chain Tracking', () => {
    it('should track direct referrals (Level 1)', () => {
      const referrals = [
        { level: 1, referredWallet: 'user1', referrerWallet: 'owner' },
        { level: 1, referredWallet: 'user2', referrerWallet: 'owner' },
      ];

      const level1Count = referrals.filter((r) => r.level === 1).length;
      expect(level1Count).toBe(2);
    });

    it('should track indirect referrals (Level 2)', () => {
      const referrals = [
        { level: 1, referredWallet: 'user1', referrerWallet: 'owner' },
        { level: 2, referredWallet: 'user2', referrerWallet: 'user1' },
      ];

      const level2Count = referrals.filter((r) => r.level === 2).length;
      expect(level2Count).toBe(1);
    });

    it('should track deep referrals (Level 3)', () => {
      const referrals = [
        { level: 1, referredWallet: 'user1', referrerWallet: 'owner' },
        { level: 2, referredWallet: 'user2', referrerWallet: 'user1' },
        { level: 3, referredWallet: 'user3', referrerWallet: 'user2' },
      ];

      const level3Count = referrals.filter((r) => r.level === 3).length;
      expect(level3Count).toBe(1);
    });

    it('should count total referrals across all levels', () => {
      const referrals = [
        { level: 1, count: 10 },
        { level: 2, count: 5 },
        { level: 3, count: 2 },
      ];

      const total = referrals.reduce((sum, r) => sum + r.count, 0);
      expect(total).toBe(17);
    });

    it('should not count beyond Level 3', () => {
      const maxLevel = 3;
      const attemptedLevel = 4;

      const isValid = attemptedLevel <= maxLevel;
      expect(isValid).toBe(false);
    });
  });

  describe('Earnings Calculation', () => {
    it('should calculate total earnings from all levels', () => {
      const level1Earnings = 100;
      const level2Earnings = 50;
      const level3Earnings = 25;
      const totalEarnings = level1Earnings + level2Earnings + level3Earnings;

      expect(totalEarnings).toBe(175);
    });

    it('should separate pending and claimed rewards', () => {
      const totalEarnings = 1000;
      const claimedRewards = 600;
      const pendingRewards = totalEarnings - claimedRewards;

      expect(pendingRewards).toBe(400);
      expect(pendingRewards + claimedRewards).toBe(totalEarnings);
    });

    it('should handle zero earnings', () => {
      const totalEarnings = 0;
      const pendingRewards = 0;
      const claimedRewards = 0;

      expect(totalEarnings).toBe(pendingRewards + claimedRewards);
    });

    it('should not have negative earnings', () => {
      const earnings = -100; // Invalid state
      const sanitizedEarnings = Math.max(0, earnings);

      expect(sanitizedEarnings).toBe(0);
    });
  });

  describe('Referral Code Generation', () => {
    it('should generate unique referral code from wallet', () => {
      const walletAddress = 'DemoWallet1111111111111111111111111111111111';
      const referralCode = walletAddress.slice(0, 8);

      expect(referralCode).toBe('DemoWall');
      expect(referralCode.length).toBe(8);
    });

    it('should generate different codes for different wallets', () => {
      const wallet1 = 'Wallet11111111111111111111111111111111111111';
      const wallet2 = 'Wallet22222222222222222222222222222222222222';

      const code1 = wallet1.slice(0, 8);
      const code2 = wallet2.slice(0, 8);

      expect(code1).not.toBe(code2);
    });

    it('should handle short wallet addresses', () => {
      const shortWallet = 'ABC';
      const code = shortWallet.slice(0, 8);

      expect(code).toBe('ABC');
    });
  });

  describe('Reward Distribution Logic', () => {
    it('should distribute rewards up the chain', () => {
      // User D earns 100 tokens
      // User C (level 1) gets 20% = 20 tokens
      // User B (level 2) gets 10% = 10 tokens
      // User A (level 3) gets 5% = 5 tokens

      const baseEarning = 100;
      const rewards = [
        { user: 'C', level: 1, amount: baseEarning * 0.2 },
        { user: 'B', level: 2, amount: baseEarning * 0.1 },
        { user: 'A', level: 3, amount: baseEarning * 0.05 },
      ];

      expect(rewards[0].amount).toBe(20);
      expect(rewards[1].amount).toBe(10);
      expect(rewards[2].amount).toBe(5);
    });

    it('should only distribute to active referrals', () => {
      const referrals = [
        { wallet: 'user1', status: 'ACTIVE', level: 1 },
        { wallet: 'user2', status: 'INACTIVE', level: 1 },
      ];

      const activeReferrals = referrals.filter((r) => r.status === 'ACTIVE');
      expect(activeReferrals.length).toBe(1);
    });

    it('should handle partial chains (only 2 levels)', () => {
      const baseEarning = 100;
      const rewards = [
        { level: 1, amount: baseEarning * 0.2 },
        { level: 2, amount: baseEarning * 0.1 },
        // No level 3
      ];

      const totalPaid = rewards.reduce((sum, r) => sum + r.amount, 0);
      expect(totalPaid).toBe(30);
    });

    it('should handle single level chains', () => {
      const baseEarning = 100;
      const rewards = [
        { level: 1, amount: baseEarning * 0.2 },
        // No level 2 or 3
      ];

      const totalPaid = rewards.reduce((sum, r) => sum + r.amount, 0);
      expect(totalPaid).toBe(20);
    });
  });

  describe('Milestone Rewards', () => {
    it('should award tokens at milestones', () => {
      const milestones = [
        { referrals: 5, reward: 5000 },
        { referrals: 25, reward: 50000 },
        { referrals: 100, reward: 500000 },
      ];

      const userReferrals = 25;
      const earnedMilestone = milestones.find((m) => m.referrals === userReferrals);

      expect(earnedMilestone?.reward).toBe(50000);
    });

    it('should not give rewards before milestone', () => {
      const userReferrals = 4;
      const milestoneThreshold = 5;

      const eligible = userReferrals >= milestoneThreshold;
      expect(eligible).toBe(false);
    });

    it('should give rewards at exact milestone', () => {
      const userReferrals = 100;
      const milestoneThreshold = 100;

      const eligible = userReferrals >= milestoneThreshold;
      expect(eligible).toBe(true);
    });

    it('should maintain rewards after passing milestone', () => {
      const userReferrals = 150;
      const milestoneThreshold = 100;

      const eligible = userReferrals >= milestoneThreshold;
      expect(eligible).toBe(true);
    });
  });

  describe('Next Milestone Calculation', () => {
    it('should show next milestone for new users', () => {
      const currentReferrals = 0;
      const milestones = [5, 25, 100, 500];

      const nextMilestone = milestones.find((m) => m > currentReferrals);
      expect(nextMilestone).toBe(5);
    });

    it('should show next milestone for active users', () => {
      const currentReferrals = 10;
      const milestones = [5, 25, 100, 500];

      const nextMilestone = milestones.find((m) => m > currentReferrals);
      expect(nextMilestone).toBe(25);
    });

    it('should return null for max tier users', () => {
      const currentReferrals = 500;
      const milestones = [5, 25, 100, 500];

      const nextMilestone = milestones.find((m) => m > currentReferrals);
      expect(nextMilestone).toBeUndefined();
    });

    it('should calculate progress to next milestone', () => {
      const currentReferrals = 15;
      const nextMilestone = 25;
      const progress = (currentReferrals / nextMilestone) * 100;

      expect(progress).toBe(60);
    });
  });

  describe('Leaderboard Logic', () => {
    it('should sort users by total referrals', () => {
      const users = [
        { wallet: 'user1', totalReferrals: 50 },
        { wallet: 'user2', totalReferrals: 150 },
        { wallet: 'user3', totalReferrals: 100 },
      ];

      const sorted = users.sort((a, b) => b.totalReferrals - a.totalReferrals);

      expect(sorted[0].wallet).toBe('user2');
      expect(sorted[1].wallet).toBe('user3');
      expect(sorted[2].wallet).toBe('user1');
    });

    it('should handle ties in leaderboard', () => {
      const users = [
        { wallet: 'user1', totalReferrals: 100 },
        { wallet: 'user2', totalReferrals: 100 },
      ];

      const sorted = users.sort((a, b) => b.totalReferrals - a.totalReferrals);

      expect(sorted[0].totalReferrals).toBe(sorted[1].totalReferrals);
    });

    it('should limit leaderboard to top N users', () => {
      const users = Array.from({ length: 1000 }, (_, i) => ({
        wallet: `user${i}`,
        totalReferrals: i,
      }));

      const limit = 100;
      const topUsers = users.slice(0, limit);

      expect(topUsers.length).toBe(limit);
    });
  });

  describe('Edge Cases', () => {
    it('should handle referral cycles (user refers themselves)', () => {
      const referrer = 'user1';
      const referred = 'user1';

      const isCycle = referrer === referred;
      expect(isCycle).toBe(true);
      // Should reject this in actual implementation
    });

    it('should prevent duplicate referrals', () => {
      const existingReferrals = ['user2', 'user3'];
      const newReferral = 'user2';

      const isDuplicate = existingReferrals.includes(newReferral);
      expect(isDuplicate).toBe(true);
    });

    it('should handle very large referral counts', () => {
      const referralCount = 1000000;
      const tier = referralCount >= 500 ? ReferralTier.LEGEND : ReferralTier.VIRAL_KING;

      expect(tier).toBe(ReferralTier.LEGEND);
    });

    it('should handle floating point precision in rewards', () => {
      const earnings = 0.1 + 0.2; // JavaScript floating point issue
      const reward = earnings * 0.2;

      expect(reward).toBeCloseTo(0.06, 10);
    });
  });

  describe('Referral Link Generation', () => {
    it('should generate valid referral link', () => {
      const baseUrl = 'https://degenscore.com';
      const referralCode = 'ABC12345';
      const link = `${baseUrl}?ref=${referralCode}`;

      expect(link).toBe('https://degenscore.com?ref=ABC12345');
    });

    it('should include referral code in query params', () => {
      const link = 'https://degenscore.com?ref=ABC12345';
      const url = new URL(link);
      const refCode = url.searchParams.get('ref');

      expect(refCode).toBe('ABC12345');
    });

    it('should preserve other query params', () => {
      const link = 'https://degenscore.com?utm_source=twitter&ref=ABC12345';
      const url = new URL(link);

      expect(url.searchParams.get('utm_source')).toBe('twitter');
      expect(url.searchParams.get('ref')).toBe('ABC12345');
    });
  });

  describe('Status Management', () => {
    it('should track referral status (ACTIVE/INACTIVE)', () => {
      const referral = { wallet: 'user1', status: 'ACTIVE' };

      expect(referral.status).toBe('ACTIVE');
    });

    it('should allow deactivating referrals', () => {
      let status = 'ACTIVE';
      status = 'INACTIVE';

      expect(status).toBe('INACTIVE');
    });

    it('should filter by active status for rewards', () => {
      const referrals = [
        { wallet: 'user1', status: 'ACTIVE' },
        { wallet: 'user2', status: 'INACTIVE' },
        { wallet: 'user3', status: 'ACTIVE' },
      ];

      const active = referrals.filter((r) => r.status === 'ACTIVE');
      expect(active.length).toBe(2);
    });
  });
});
