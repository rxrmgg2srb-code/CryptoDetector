// scripts/generate_all_tests.js
const fs = require('fs');
const path = require('path');

const componentsDir = path.resolve(__dirname, '../components');
const testsRoot = path.resolve(__dirname, '../__tests__/components');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getRelativeImport(filePath) {
  // Convert absolute component path to import path relative to project root
  const rel = path.relative(path.resolve(__dirname, '..'), filePath);
  return rel.replace(/\\/g, '/');
}

function createTestFile(componentPath) {
  const relPath = path.relative(componentsDir, componentPath);
  const testFilePath = path.join(testsRoot, relPath).replace(/\.tsx?$/, '.test.tsx');
  ensureDir(path.dirname(testFilePath));
  const importPath = getRelativeImport(componentPath);
  const componentName = path.basename(componentPath, path.extname(componentPath));
  const content = `import { render } from '@testing-library/react';\nimport ${componentName} from '@/${importPath}';\n\ndescribe('${componentName}', () => {\n  it('renders without crashing', () => {\n    const { container } = render(<${componentName} />);\n    expect(container).toBeInTheDocument();\n  });\n});\n`;
  fs.writeFileSync(testFilePath, content, 'utf8');
  console.log('Created test:', testFilePath);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip __tests__ directories to avoid recursion
      if (entry.name === '__tests__') continue;
      walk(fullPath);
    } else if (entry.isFile()) {
      if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.tsx')) {
        createTestFile(fullPath);
      }
    }
  }
}

walk(componentsDir);
