// scripts/smart-fix-props.js - Analyze component files and add required props
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common prop patterns and their default values
const propDefaults = {
  isOpen: 'true',
  onClose: '() => {}',
  onOpen: '() => {}',
  onClick: '() => {}',
  onChange: '() => {}',
  onSubmit: '() => {}',
  onAnalyze: '() => {}',
  onPaymentSuccess: '() => {}',
  onFollow: '() => {}',
  onUnfollow: '() => {}',
  url: '"https://test.com"',
  href: '"#"',
  title: '"Test Title"',
  message: '"Test Message"',
  walletAddress: '"test-wallet"',
  loading: 'false',
  disabled: 'false',
  isAuthenticated: 'true',
  currentStep: '1',
  totalSteps: '3',
  userId: '"test-user"',
  tokenAddress: '"test-token"',
};

function analyzeComponentProps(componentPath) {
  try {
    const content = fs.readFileSync(componentPath, 'utf8');

    // Extract interface/type definition
    const interfaceMatch = content.match(/interface\s+\w+Props\s*\{([^}]+)\}/);
    if (!interfaceMatch) return [];

    const propsText = interfaceMatch[1];
    const requiredProps = [];

    // Find required props (those without ? or = default)
    const propLines = propsText.split('\n');
    for (const line of propLines) {
      const match = line.match(/^\s*(\w+)\s*:/);
      if (match && !line.includes('?') && !line.includes('=')) {
        const propName = match[1];
        requiredProps.push(propName);
      }
    }

    return requiredProps;
  } catch (error) {
    return [];
  }
}

function generatePropsString(props) {
  return props
    .map((prop) => {
      const defaultValue = propDefaults[prop] || '{}';
      return `${prop}={${defaultValue}}`;
    })
    .join(' ');
}

let fixedCount = 0;

const testFiles = glob.sync(
  'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1/__tests__/**/*.test.tsx'
);

console.log(`Processing ${testFiles.length} test files...`);

testFiles.forEach((testFile) => {
  let content = fs.readFileSync(testFile, 'utf8');

  // Extract component imports
  const importMatch = content.match(
    /import\s+(\w+)\s+from\s+['"]@\/components\/(.*?)(?:\.tsx)?['"]/
  );
  if (!importMatch) return;

  const componentName = importMatch[1];
  const componentRelativePath = importMatch[2];
  const componentPath = path.join(
    'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1/components',
    componentRelativePath.endsWith('.tsx') ? componentRelativePath : componentRelativePath + '.tsx'
  );

  if (!fs.existsSync(componentPath)) return;

  // Analyze component for required props
  const requiredProps = analyzeComponentProps(componentPath);
  if (requiredProps.length === 0) return;

  // Check if test renders component without props
  const emptyRenderPattern = new RegExp(`render\\(<${componentName}\\s*\/>\\)`, 'g');
  if (emptyRenderPattern.test(content)) {
    const propsString = generatePropsString(requiredProps);
    content = content.replace(emptyRenderPattern, `render(<${componentName} ${propsString} />)`);

    fs.writeFileSync(testFile, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed: ${path.relative(process.cwd(), testFile)}`);
    console.log(`  Props added: ${requiredProps.join(', ')}`);
  }
});

console.log(`\n✓ Total files fixed: ${fixedCount}`);
console.log(`✓ Total files processed: ${testFiles.length}`);
