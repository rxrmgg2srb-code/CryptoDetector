// scripts/fix-react-createelement-null.js - Fix React.createElement(null, ...) to use 'div'
const fs = require('fs');
const path = require('path');
const glob = require('glob');

let fixedCount = 0;

const testFiles = glob.sync(
  'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1/__tests__/**/*.test.{ts,tsx}'
);

console.log(`Processing ${testFiles.length} test files...`);

testFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;

  // Replace React.createElement(null, ...) with React.createElement('div', ...)
  content = content.replace(/React\.createElement\(null,/g, "React.createElement('div',");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\n✓ Total files fixed: ${fixedCount}`);
console.log(`✓ Total files processed: ${testFiles.length}`);
