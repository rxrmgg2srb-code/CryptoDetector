// scripts/fix-all-jsx-in-tests.js - Remove ALL JSX from test files
const fs = require('fs');
const path = require('path');
const glob = require('glob');

let fixedCount = 0;

const testFiles = glob.sync(
  'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1/__tests__/**/*.test.{ts,tsx}'
);

console.log(`Found ${testFiles.length} test files to process...`);

testFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Add React import if missing and JSX is present
  if (content.match(/<[a-zA-Z]/) && !content.includes('import React')) {
    content = "import React from 'react';\n" + content;
    modified = true;
  }

  // Replace JSX in mocks with React.createElement
  // Pattern 1: () => <button>Text</button>
  content = content.replace(
    /\(\)\s*=>\s*<([a-zA-Z]+[0-9]*)([^>]*)>(.*?)<\/\1>/g,
    (match, tag, attrs, children) => {
      if (attrs.trim()) {
        return `() => React.createElement('${tag}', ${attrs.trim()}, '${children}')`;
      }
      return `() => React.createElement('${tag}', {}, '${children}')`;
    }
  );

  // Pattern 2: ({ children, ...props }) => <div {...props}>{children}</div>
  content = content.replace(
    /\(\{\s*children,?\s*\.\.\.props\s*}(?::\s*any)?\)\s*=>\s*<([a-zA-Z]+[0-9]*)\s*\{\.\.\.props\}>\{children\}<\/\1>/g,
    (match, tag) => `({ children, ...props }) => React.createElement('${tag}', props, children)`
  );

  // Pattern 3: ({ children }) => <>{children}</>
  content = content.replace(
    /\(\{\s*children\s*}(?::\s*any)?\)\s*=>\s*<>\{children\}<\/>/g,
    '({ children }) => React.createElement(React.Fragment, null, children)'
  );

  // Pattern 4: () => <div />
  content = content.replace(
    /\(\)\s*=>\s*<([a-zA-Z]+[0-9]*)\s*\/>/g,
    (match, tag) => `() => React.createElement('${tag}')`
  );

  // Pattern 5: ({ children, href }) => <a href={href}>{children}</a>
  content = content.replace(
    /\(\{\s*children,\s*([a-zA-Z]+)\s*}(?::\s*any)?\)\s*=>\s*<a\s+href=\{\1\}>\{children\}<\/a>/g,
    "({ children, href }) => React.createElement('a', { href }, children)"
  );

  if (content !== fs.readFileSync(file, 'utf8')) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\n✓ Total files fixed: ${fixedCount}`);
console.log(`✓ Total files processed: ${testFiles.length}`);
