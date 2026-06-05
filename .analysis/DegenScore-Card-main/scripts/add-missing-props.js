// scripts/add-missing-props.js - Add required props to component tests
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of components to their required props
const componentPropsMap = {
  ScoreBar: `score={75} maxScore={100} label="Test Score"`,
  TradingPatternsCard: `patterns={{ volumeSpikes: [], priceSwings: [], suspiciousActivity: false, overallRisk: 'LOW' }}`,
  CardGenerationProgress: `currentStep={1} totalSteps={3} message="Processing..."`,
  RedFlagsCard: `redFlags={{ flags: [] }}`,
  LiquidityCard: `liquidity={{ locked: true, amount: 1000000 }}`,
  HolderDistributionCard: `distribution={{ concentration: 'LOW', topHolders: [] }}`,
  AuthorityCard: `authority={{ mintDisabled: true, freezeDisabled: true }}`,
  MetricCard: `title="Test Metric" value={75} description="Test description"`,
  ScoreCard: `score={75} label="Test Score"`,
  InputSection: `onAnalyze={() => {}} loading={false}`,
  DetailedMetrics: `metrics={{ security: 80, fundamentals: 70, technical: 75 }}`,
  ExternalData: `data={{ price: 1.5, volume24h: 1000000 }}`,
  FlagSection: `flags={[]} title="Test Flags"`,
  Header: `title="Test Header"`,
  MetricRow: `label="Test" value={75}`,
  ScoreBreakdown: `categories={{ security: { score: 80, weight: 30 } }}`,
};

let fixedCount = 0;

const testFiles = glob.sync(
  'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1/__tests__/**/*.test.{ts,tsx}'
);

console.log(`Processing ${testFiles.length} test files...`);

testFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  for (const [componentName, props] of Object.entries(componentPropsMap)) {
    // Pattern: render(<ComponentName />)
    const emptyPropsPattern = new RegExp(`render\\(<${componentName}\\s*\/>\\)`, 'g');
    if (emptyPropsPattern.test(content)) {
      content = content.replace(emptyPropsPattern, `render(<${componentName} ${props} />)`);
      modified = true;
    }

    // Pattern: render(<ComponentName  />)  // with extra spaces
    const extraSpacesPattern = new RegExp(`render\\(<${componentName}\\s+\/>\\)`, 'g');
    if (extraSpacesPattern.test(content)) {
      content = content.replace(extraSpacesPattern, `render(<${componentName} ${props} />)`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\n✓ Total files fixed: ${fixedCount}`);
console.log(`✓ Total files processed: ${testFiles.length}`);
