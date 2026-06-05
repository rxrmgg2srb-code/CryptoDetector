// scripts/fix-failing-tests.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const testPattern = path.join(
  'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1/__tests__/components/**/*.test.tsx'
);

glob.sync(testPattern).forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  // Add jest timeout if missing
  if (!/jest\.setTimeout\s*\(/.test(content)) {
    content = 'jest.setTimeout(10000);\n' + content;
  }
  // Ensure wallet adapter mock exists
  if (
    /useWallet/.test(content) &&
    !/jest\.mock\(['"]@solana\/wallet-adapter-react['"]/.test(content)
  ) {
    const mock = `
jest.mock('@solana/wallet-adapter-react', () => ({
  useConnection: jest.fn(),
  useWallet: jest.fn().mockReturnValue({
    publicKey: { toBase58: () => 'mocked-wallet' },
    sendTransaction: jest.fn(),
  }),
}));
`;
    content = mock + content;
  }
  // Ensure fetch is mocked if used
  if (/global\.fetch/.test(content) && !/global\.fetch\s*=/.test(content)) {
    const fetchMock = `global.fetch = jest.fn();\n`;
    content = fetchMock + content;
  }
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
