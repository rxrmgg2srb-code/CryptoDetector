// scripts/fix-jsx-mocks.js - Remove JSX from mocks to avoid syntax errors
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const React = require('react');

const testPattern = path.join(__dirname, '../__tests__/**/*.test.{ts,tsx}');

let fixedCount = 0;

glob.sync(testPattern).forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Replace JSX in jest.mock calls with React.createElement or simple strings
  // Pattern: () => <Component>...</Component>
  const jsxMockPattern = /\(\)\s*=>\s*<([a-zA-Z]+)([^>]*)>(.*?)<\/\1>/g;
  if (jsxMockPattern.test(content)) {
    content = content.replace(jsxMockPattern, (match, tag, attrs, children) => {
      // Remove the JSX and replace with a simple div string
      return `() => 'MockedComponent'`;
    });
    modified = true;
  }

  // Pattern: ({ children }) => <div>{children}</div>
  const childrenJsxPattern =
    /\(\{\s*children[^}]*\}\)\s*=>\s*<([a-zA-Z]+)([^>]*)>\{children\}<\/\1>/g;
  if (childrenJsxPattern.test(content)) {
    content = content.replace(childrenJsxPattern, '({ children }) => children');
    modified = true;
  }

  // Pattern: ({ children, ...props }) => <a href={href}>{children}</a>
  const propsJsxPattern =
    /\(\{\s*children[^}]*,\s*([a-zA-Z]+)[^}]*\}\)\s*=>\s*<[a-zA-Z]+[^>]*>\{children\}<\/[a-zA-Z]+>/g;
  if (propsJsxPattern.test(content)) {
    content = content.replace(propsJsxPattern, '({ children }) => children');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log('Fixed JSX mocks in:', path.relative(process.cwd(), file));
  }
});

console.log(`\nTotal files fixed: ${fixedCount}`);
