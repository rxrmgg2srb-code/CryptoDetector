#!/usr/bin/env node

/**
 * 🔧 Script to replace console.log with structured logger
 *
 * CVE-DEGEN-009 Fix: Remove console.log from production code
 *
 * Strategy:
 * - Replace console.log → logger.info
 * - Replace console.warn → logger.warn
 * - Replace console.error → logger.error
 * - Replace console.debug → logger.debug
 * - Add import { logger } from '@/lib/logger' if not present
 * - Skip: scripts/, __tests__/, .archive/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to process
const INCLUDE_DIRS = ['pages/api', 'lib', 'components'];
const EXCLUDE_PATTERNS = ['.archive', '__tests__', 'node_modules', '.next'];

// Get all files with console.log
function getFilesWithConsoleLog() {
  const files = [];

  INCLUDE_DIRS.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) return;

    scanDirectory(dirPath, files);
  });

  return files;
}

function scanDirectory(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some((pattern) => fullPath.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/console\.(log|warn|error|debug|info)/.test(content)) {
        files.push(fullPath);
      }
    }
  }
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if logger is already imported
  const hasLoggerImport = /import.*logger.*from.*['"].*logger['"]/.test(content);

  // Replace console calls
  const replacements = [
    { from: /console\.log\(/g, to: 'logger.info(' },
    { from: /console\.warn\(/g, to: 'logger.warn(' },
    { from: /console\.error\(/g, to: 'logger.error(' },
    { from: /console\.debug\(/g, to: 'logger.debug(' },
    { from: /console\.info\(/g, to: 'logger.info(' },
  ];

  for (const { from, to } of replacements) {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  }

  // Add logger import if needed
  if (modified && !hasLoggerImport) {
    // Find the last import statement
    const importRegex = /^import\s+.*$/gm;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;

      content =
        content.slice(0, insertPosition) +
        "\nimport { logger } from '@/lib/logger';" +
        content.slice(insertPosition);
    } else {
      // No imports found, add at the top
      content = "import { logger } from '@/lib/logger';\n\n" + content;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main execution
console.log('🔍 Scanning for console.log statements...\n');

const files = getFilesWithConsoleLog();
console.log(`Found ${files.length} files with console statements\n`);

let fixedCount = 0;

for (const file of files) {
  const relativePath = path.relative(process.cwd(), file);

  if (fixFile(file)) {
    console.log(`✅ Fixed: ${relativePath}`);
    fixedCount++;
  } else {
    console.log(`⏭️  Skipped: ${relativePath}`);
  }
}

console.log(`\n✨ Complete! Fixed ${fixedCount} files`);
console.log('\n📝 Next steps:');
console.log('1. Review changes with: git diff');
console.log('2. Run tests: npm test');
console.log(
  '3. Commit changes: git add . && git commit -m "fix: replace console.log with structured logger (CVE-DEGEN-009)"'
);
