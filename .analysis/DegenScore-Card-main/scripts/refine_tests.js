/**
 * 🛠️ TEST REFINER
 * Automatically fixes common issues in generated tests
 */

const fs = require('fs');
const path = require('path');

const refineTests = () => {
  const testsDir = path.join(__dirname, '..', '__tests__');

  // Recursive function to find test files
  const findTestFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(findTestFiles(fullPath));
      } else if (file.endsWith('.test.tsx')) {
        results.push(fullPath);
      }
    });
    return results;
  };

  const testFiles = findTestFiles(testsDir);
  let fixedCount = 0;

  testFiles.forEach((filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix 1: Provide default props for common components
    if (content.includes('TradingPatternsCard') && content.includes('data={{}}')) {
      const mockData = `data={{
        score: 10,
        bundle_bots: 5,
        wash_trading: false,
        snipers: 2
      }}`;
      content = content.replace('data={{}}', mockData);
      modified = true;
    }

    // Fix 2: Fix CardGenerationProgress props
    if (content.includes('CardGenerationProgress') && content.includes('data={{}}')) {
      content = content.replace('data={{}}', 'steps={[]} currentStep={0}');
      modified = true;
    }

    // Fix 3: Fix ScoreBar props
    if (content.includes('ScoreBar') && content.includes('data={{}}')) {
      content = content.replace('data={{}}', 'label="Test" score={5} max={10}');
      modified = true;
    }

    // Fix 4: Generic data prop replacement for empty objects
    // This is a heuristic - if a test fails due to undefined properties,
    // we often need to provide a fuller mock object.
    // For now, we'll handle specific known failures.

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      fixedCount++;
    }
  });

  console.log(`\n🎉 Refined ${fixedCount} test files`);
};

refineTests();
