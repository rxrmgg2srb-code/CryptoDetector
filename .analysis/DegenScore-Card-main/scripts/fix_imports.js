const fs = require('fs');
const path = require('path');

const fixImports = () => {
  const testsDir = path.join(__dirname, '..', '__tests__');

  const findTests = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !file.startsWith('_')) {
        results = results.concat(findTests(fullPath));
      } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
        results.push(fullPath);
      }
    });
    return results;
  };

  const tests = findTests(testsDir);
  let fixedCount = 0;

  tests.forEach((filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix relative imports to aliases
    if (content.includes("'../lib/")) {
      content = content.replace(/'\.\.\/lib\//g, "'@/lib/");
      modified = true;
    }
    if (content.includes('"../lib/')) {
      content = content.replace(/"\.\.\/lib\//g, '"@/lib/');
      modified = true;
    }

    // Fix component imports
    if (content.includes("'../components/")) {
      content = content.replace(/'\.\.\/components\//g, "'@/components/");
      modified = true;
    }

    // Fix hooks imports
    if (content.includes("'../hooks/")) {
      content = content.replace(/'\.\.\/hooks\//g, "'@/hooks/");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      fixedCount++;
    }
  });

  console.log(`Fixed imports in ${fixedCount} files`);
};

fixImports();
