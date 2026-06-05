import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Define mocks globally so we can access them inside tests
const mockCreate = jest.fn();
const mockPrisma = {
  degenCard: {
    findUnique: jest.fn(),
  },
  hotTrade: {
    findMany: jest.fn(),
  },
  aICoachAnalysis: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
};

describe('AI Coach System 🤖', () => {
  const mockWallet = 'So11111111111111111111111111111111111111112';
  let analyzeTraderWithAI: any;
  let getLatestAnalysis: any;
  let needsNewAnalysis: any;

  beforeEach(() => {
    jest.resetModules(); // CRITICAL: Reset modules to reload env vars
    jest.clearAllMocks();

    // Set env var BEFORE requiring the module
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.AI_DAILY_BUDGET = '10';

    // Mock OpenAI
    jest.mock('openai', () => {
      return jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));
    });

    // Mock Prisma
    jest.mock('@/lib/prisma', () => ({
      prisma: mockPrisma,
    }));

    // Mock Logger
    jest.mock('@/lib/logger', () => ({
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
    }));

    // Mock Redis - Handle dynamic import structure
    jest.mock('@/lib/cache/redis', () => {
      return {
        __esModule: true,
        cacheGet: jest.fn().mockResolvedValue('0'),
        default: {
          set: jest.fn(),
        },
      };
    });

    // Require the module AFTER setting env vars and mocks
    // We use require() because import is static and hoisted
    const aiCoach = require('@/lib/aiCoach');
    analyzeTraderWithAI = aiCoach.analyzeTraderWithAI;
    getLatestAnalysis = aiCoach.getLatestAnalysis;
    needsNewAnalysis = aiCoach.needsNewAnalysis;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('analyzeTraderWithAI', () => {
    it('should perform AI analysis successfully', async () => {
      // 1. Mock Card
      mockPrisma.degenCard.findUnique.mockResolvedValue({
        degenScore: 85,
        totalTrades: 100,
        winRate: 60,
        totalVolume: 5000,
        profitLoss: 1000,
        avgHoldTime: 24,
        badges: [{ name: 'Whale' }],
      });

      // 2. Mock Trades
      mockPrisma.hotTrade.findMany.mockResolvedValue([
        {
          action: 'buy',
          tokenSymbol: 'BONK',
          solAmount: 10,
          timestamp: new Date(),
        },
      ]);

      // 3. Mock OpenAI Response
      const mockAnalysis = {
        overallScore: 88,
        riskProfile: 'aggressive',
        emotionalTrading: 20,
        strengths: ['Discipline'],
        weaknesses: ['FOMO'],
        recommendations: ['Hold longer'],
        patterns: ['Morning trader'],
        predictedROI: 15,
        confidenceScore: 0.9,
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAnalysis),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
        },
      });

      const result = await analyzeTraderWithAI(mockWallet);

      expect(result.overallScore).toBe(88);
      expect(result.riskProfile).toBe('aggressive');
      expect(mockPrisma.aICoachAnalysis.create).toHaveBeenCalled();
    });

    it('should throw error if card not found', async () => {
      mockPrisma.degenCard.findUnique.mockResolvedValue(null);
      await expect(analyzeTraderWithAI(mockWallet)).rejects.toThrow('Card not found');
    });
  });

  describe('getLatestAnalysis', () => {
    it('should return parsed analysis', async () => {
      mockPrisma.aICoachAnalysis.findFirst.mockResolvedValue({
        overallScore: 90,
        riskProfile: 'degen',
        emotionalTrading: 80,
        strengths: '["YOLO"]',
        weaknesses: '["No Stop Loss"]',
        recommendations: '["Stop it"]',
        patterns: '["Rekt"]',
        predictedROI: -50,
        confidenceScore: 0.95,
      });

      const result = await getLatestAnalysis(mockWallet);

      expect(result?.riskProfile).toBe('degen');
      expect(result?.strengths).toContain('YOLO');
    });

    it('should return null if no analysis found', async () => {
      mockPrisma.aICoachAnalysis.findFirst.mockResolvedValue(null);
      const result = await getLatestAnalysis(mockWallet);
      expect(result).toBeNull();
    });
  });

  describe('needsNewAnalysis', () => {
    it('should return true if never analyzed', async () => {
      mockPrisma.aICoachAnalysis.findFirst.mockResolvedValue(null);
      const result = await needsNewAnalysis(mockWallet);
      expect(result).toBe(true);
    });

    it('should return false if analyzed recently (Free User)', async () => {
      mockPrisma.aICoachAnalysis.findFirst.mockResolvedValue({
        analyzedAt: new Date(), // Just now
      });
      mockPrisma.degenCard.findUnique.mockResolvedValue({ isPaid: false });

      const result = await needsNewAnalysis(mockWallet);
      expect(result).toBe(false);
    });

    it('should return true if cooldown passed (Premium User)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1.1); // 26 hours ago

      mockPrisma.aICoachAnalysis.findFirst.mockResolvedValue({
        analyzedAt: yesterday,
      });
      mockPrisma.degenCard.findUnique.mockResolvedValue({ isPaid: true });

      const result = await needsNewAnalysis(mockWallet);
      expect(result).toBe(true);
    });
  });
});
