// scripts/add-hook-mocks.js - Add missing hook mocks to tests
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const hookMocks = {
  useWallet: {
    mock: `
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(() => ({
    publicKey: { toBase58: () => 'mock-wallet' },
    connected: true,
    sendTransaction: jest.fn(),
  })),
  useConnection: jest.fn(() => ({
    connection: { 
      getBalance: jest.fn(),
      getLatestBlockhash: jest.fn(),
      confirmTransaction: jest.fn(),
    },
  })),
}));`,
    testPattern: /useWallet/,
    mockPattern: /jest\.mock\(['"]@solana\/wallet-adapter-react['"]/,
  },
  useRouter: {
    mock: `
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/',
    push: jest.fn(),
    query: {},
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));`,
    testPattern: /useRouter/,
    mockPattern: /jest\.mock\(['"]next\/router['"]/,
  },
  useTokenAnalysis: {
    mock: `
jest.mock('@/hooks/useTokenAnalysis', () => ({
  useTokenAnalysis: jest.fn(() => ({
    analyze: jest.fn(),
    loading: false,
    result: null,
    error: null,
  })),
}));`,
    testPattern: /useTokenAnalysis/,
    mockPattern: /jest\.mock\(['"]@\/hooks\/useTokenAnalysis['"]/,
  },
  useTokenSecurity: {
    mock: `
jest.mock('@/hooks/useTokenSecurity', () => ({
  useTokenSecurity: jest.fn(() => ({
    scan: jest.fn(),
    loading: false,
    report: null,
    error: null,
  })),
}));`,
    testPattern: /useTokenSecurity/,
    mockPattern: /jest\.mock\(['"]@\/hooks\/useTokenSecurity['"]/,
  },
};

let fixedCount = 0;

const testFiles = glob.sync(
  'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1/__tests__/**/*.test.{ts,tsx}'
);

console.log(`Processing ${testFiles.length} test files for hook mocks...`);

testFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  for (const [hookName, { mock, testPattern, mockPattern }] of Object.entries(hookMocks)) {
    // If the test uses the hook but doesn't mock it
    if (testPattern.test(content) && !mockPattern.test(content)) {
      // Add the mock after the imports
      const importEnd = content.lastIndexOf('import ');
      if (importEnd !== -1) {
        const lineEnd = content.indexOf('\n', importEnd);
        content = content.slice(0, lineEnd + 1) + mock + '\n' + content.slice(lineEnd + 1);
        modified = true;
        console.log(`  + Added ${hookName} mock`);
      }
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
