const fs = require('fs');
const path = require('path');

const componentsToFix = [
  'components/WalletConnectionHandler.tsx',
  'components/TokenScannerContent.tsx',
  'components/SuperTokenScorerContent.tsx',
  'components/SkeletonLoader.tsx',
  'components/PageTransition.tsx',
  'components/NavigationButtons.tsx',
  'components/LiveActivityFeed.tsx',
  'components/LeaderboardContent.tsx',
  'components/LeaderboardClient.tsx',
  'components/LanguageSelector.tsx',
  'components/DocumentationContent.tsx',
  'components/DailyCheckIn.tsx',
  'components/BadgesDisplay.tsx',
  'components/AnimatedToast.tsx',
  'components/AchievementPopup.tsx',
];

let fixedCount = 0;
let skippedCount = 0;

componentsToFix.forEach((file) => {
  const filePath = path.join(
    'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1',
    file
  );

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Not found: ${file}`);
      skippedCount++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has export default
    if (content.includes('export default')) {
      console.log(`✅ Already has default: ${file}`);
      skippedCount++;
      return;
    }

    // Match: export function ComponentName or export const ComponentName
    const match = content.match(/^export (function|const) (\w+)/m);

    if (match) {
      const componentName = match[2];

      // Add export default at the end
      if (!content.trim().endsWith(';')) {
        content += '\n';
      }
      content += `\nexport default ${componentName};\n`;

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${file} (added default for ${componentName})`);
      fixedCount++;
    } else {
      console.log(`⚠️ No export found: ${file}`);
      skippedCount++;
    }
  } catch (error) {
    console.log(`❌ Error with ${file}: ${error.message}`);
    skippedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Fixed: ${fixedCount}`);
console.log(`⚠️ Skipped: ${skippedCount}`);
console.log(`📦 Total: ${componentsToFix.length}`);
