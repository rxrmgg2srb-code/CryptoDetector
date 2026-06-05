// scripts/batch-fix-tests.js - Fix common test issues
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common mock data templates
const mockScoreBarProps = `{
  score: 75,
  maxScore: 100,
  label: 'Test Score'
}`;

const mockTradingPatternsProps = `{
  patterns: {
    volumeSpikes: [],
    priceSwings: [],
    suspiciousActivity: false,
    overallRisk: 'LOW'
  }
}`;

const mockCardGenerationProgressProps = `{
  currentStep: 1,
  totalSteps: 3,
  message: 'Processing...'
}`;

const mockSuperTokenResult = `{
  tokenAddress: 'test-address',
  tokenSymbol: 'TEST',
  tokenName: 'Test Token',
  superScore: 75,
  globalRiskLevel: 'MEDIUM' as const,
  recommendation: 'Test recommendation',
  analysisTimeMs: 100,
  analyzedAt: new Date().toISOString(),
  categories: {
    security: { score: 80, weight: 30, findings: [] },
    fundamentals: { score: 70, weight: 25, findings: [] },
    technicalAnalysis: { score: 75, weight: 20, findings: [] },
    sentiment: { score: 70, weight: 15, findings: [] },
    innovation: { score: 80, weight: 10, findings: [] }
  },
  redFlags: [],
  greenFlags: []
}`;

const fixes = [
  {
    pattern: /__tests__\/components\/TokenSecurityScanner\/Shared\/ScoreBar\.test\.tsx$/,
    fix: (content) => {
      if (content.includes('render(<ScoreBar />)')) {
        return content.replace(
          /render\(<ScoreBar \/>\)/g,
          `render(<ScoreBar ${mockScoreBarProps} />)`
        );
      }
      return content;
    },
  },
  {
    pattern:
      /__tests__\/components\/TokenSecurityScanner\/ReportCards\/TradingPatternsCard\.test\.tsx$/,
    fix: (content) => {
      if (content.includes('render(<TradingPatternsCard />)')) {
        return content.replace(
          /render\(<TradingPatternsCard \/>\)/g,
          `render(<TradingPatternsCard ${mockTradingPatternsProps} />)`
        );
      }
      return content;
    },
  },
  {
    pattern: /__tests__\/components\/DegenCard\/CardGenerationProgress\.test\.tsx$/,
    fix: (content) => {
      if (content.includes('render(<CardGenerationProgress />)')) {
        return content.replace(
          /render\(<CardGenerationProgress \/>\)/g,
          `render(<CardGenerationProgress ${mockCardGenerationProgressProps} />)`
        );
      }
      return content;
    },
  },
];

let fixedCount = 0;

glob
  .sync(
    'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1/__tests__/**/*.test.{ts,tsx}'
  )
  .forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    fixes.forEach(({ pattern, fix }) => {
      if (pattern.test(file)) {
        const newContent = fix(content);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    });

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      console.log('Fixed:', path.relative(process.cwd(), file));
    }
  });

console.log(`\nTotal files fixed: ${fixedCount}`);
