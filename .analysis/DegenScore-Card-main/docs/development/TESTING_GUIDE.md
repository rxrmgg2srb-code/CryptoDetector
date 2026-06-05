# Testing Guide

Comprehensive guide to testing in the DegenScore project.

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)

## 🎯 Overview

DegenScore uses a multi-layered testing strategy:

1. **Unit Tests** - Test individual functions and utilities
2. **Component Tests** - Test React components in isolation
3. **Integration Tests** - Test API routes and services
4. **E2E Tests** - Test complete user journeys

**Current Coverage Goal**: 50% (lines/statements), 40% (branches/functions)

## 🛠️ Testing Stack

### Jest + Testing Library (Unit & Integration)

- **Jest**: Test runner and assertion library
- **@testing-library/react**: Component testing utilities
- **@testing-library/jest-dom**: Custom matchers
- **node-mocks-http**: Mock Next.js API requests

### Playwright (E2E)

- **@playwright/test**: E2E testing framework
- **Cross-browser**: Chrome, Firefox, Safari
- **Mobile testing**: iOS and Android viewports

## 🏃 Running Tests

### Unit & Integration Tests

```bash
# Run all tests with coverage
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Unit tests only (lib/)
npm run test:unit

# Integration tests only (pages/api)
npm run test:integration

# Component tests only
npm run test:components

# Coverage report (opens in browser)
npm test && open coverage/lcov-report/index.html
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (visual debugger)
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/wallet-connection.spec.ts

# Run specific browser
npx playwright test --project=chromium
```

### Run Everything

```bash
# Format, lint, type-check, and test
npm run validate

# All unit/integration + E2E tests
npm run test:all
```

## ✍️ Writing Tests

### Unit Tests (lib/)

Test pure functions and utilities.

**Location**: `__tests__/lib/[filename].test.ts`

**Example**:

```typescript
// __tests__/lib/calculateScore.test.ts
import { calculateScore } from '@/lib/calculateScore';

describe('calculateScore', () => {
  it('should return 0 for empty trades', () => {
    expect(calculateScore([])).toBe(0);
  });

  it('should calculate correct score for profitable trades', () => {
    const trades = [
      { type: 'buy', amount: 100, price: 1 },
      { type: 'sell', amount: 100, price: 2 },
    ];
    expect(calculateScore(trades)).toBeGreaterThan(50);
  });
});
```

### Component Tests (components/)

Test React components in isolation.

**Location**: `__tests__/components/[ComponentName].test.tsx`

**Example**:

```typescript
// __tests__/components/ScoreCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ScoreCard } from '@/components/ScoreCard';

describe('ScoreCard', () => {
  it('should render score value', () => {
    render(<ScoreCard score={85} />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should show high tier badge for score > 80', () => {
    render(<ScoreCard score={85} />);
    expect(screen.getByText(/degen lord/i)).toBeInTheDocument();
  });
});
```

### API Integration Tests (pages/api/)

Test Next.js API routes.

**Location**: `__tests__/api/[route].test.ts`

**Example**:

```typescript
// __tests__/api/score.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/score/[wallet]';

describe('/api/score/[wallet]', () => {
  it('should return score for valid wallet', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { wallet: '7xKXtg2CW...' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('score');
  });

  it('should return 400 for invalid wallet', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { wallet: 'invalid' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
```

### E2E Tests (e2e/)

Test complete user journeys.

**Location**: `e2e/[feature].spec.ts`

**Example**:

```typescript
// e2e/score-generation.spec.ts
import { test, expect } from '@playwright/test';

test('user can generate DegenScore', async ({ page }) => {
  // 1. Visit homepage
  await page.goto('/');

  // 2. Connect wallet (mocked)
  await page.click('[data-testid="connect-wallet"]');

  // 3. Enter wallet address
  await page.fill('[data-testid="wallet-input"]', 'MOCK_WALLET');
  await page.click('[data-testid="analyze"]');

  // 4. Wait for score
  await expect(page.locator('[data-testid="score"]')).toBeVisible();
});
```

## 📊 Coverage Requirements

Coverage thresholds are enforced in CI:

```json
{
  "branches": 40,
  "functions": 40,
  "lines": 50,
  "statements": 50
}
```

**View Coverage**:

```bash
npm test
# Coverage summary printed to console
# HTML report: coverage/lcov-report/index.html
```

**Coverage is collected from**:

- `lib/**/*.{js,ts}`
- `pages/api/**/*.{js,ts}`
- `components/**/*.{js,jsx,ts,tsx}`

**Excluded from coverage**:

- `*.d.ts` (type definitions)
- `node_modules/`
- `.next/` (build output)

## ✅ Best Practices

### General

1. **Test behavior, not implementation**
   - ❌ `expect(component.state.count).toBe(5)`
   - ✅ `expect(screen.getByText('5')).toBeInTheDocument()`

2. **Write descriptive test names**
   - ❌ `it('works', () => { ... })`
   - ✅ `it('should return 400 for invalid wallet address', () => { ... })`

3. **Follow AAA pattern** (Arrange, Act, Assert)

   ```typescript
   it('should calculate score correctly', () => {
     // Arrange
     const trades = [{ type: 'buy', amount: 100, price: 1 }];

     // Act
     const score = calculateScore(trades);

     // Assert
     expect(score).toBeGreaterThan(0);
   });
   ```

4. **One assertion per test** (when possible)
   - Makes failures easier to diagnose
   - Exceptions: related assertions (e.g., checking multiple fields in a response)

### Component Tests

1. **Use data-testid for complex selectors**

   ```tsx
   <button data-testid="mint-button">Mint NFT</button>
   ```

   ```typescript
   const button = screen.getByTestId('mint-button');
   ```

2. **Test accessibility**

   ```typescript
   expect(screen.getByRole('button', { name: /mint nft/i })).toBeInTheDocument();
   ```

3. **Mock external dependencies**

   ```typescript
   jest.mock('@/lib/solana', () => ({
     mintNFT: jest.fn().mockResolvedValue({ signature: 'abc123' }),
   }));
   ```

4. **Test loading states**
   ```typescript
   it('should show skeleton loader while loading', () => {
     render(<ScoreCard loading={true} />);
     expect(screen.getByTestId('skeleton')).toBeInTheDocument();
   });
   ```

### API Tests

1. **Test all HTTP methods**

   ```typescript
   describe('POST /api/score', () => { ... });
   describe('GET /api/score', () => { ... });
   ```

2. **Test error cases**
   - Invalid input (400)
   - Unauthorized (401)
   - Not found (404)
   - Server errors (500)

3. **Mock external services**

   ```typescript
   jest.mock('@/lib/database', () => ({
     prisma: { score: { findUnique: jest.fn() } },
   }));
   ```

4. **Test rate limiting**
   ```typescript
   it('should return 429 after rate limit exceeded', async () => {
     // Make 100 requests
     // Expect 429 on 101st request
   });
   ```

### E2E Tests

1. **Use stable selectors**
   - Prefer `data-testid` over CSS classes
   - Use role-based selectors: `getByRole('button')`

2. **Test critical paths only**
   - E2E tests are slow - focus on core user journeys
   - Leave detailed testing to unit/component tests

3. **Clean up after tests**

   ```typescript
   test.afterEach(async ({ page }) => {
     // Clear cookies, localStorage, etc.
     await page.context().clearCookies();
   });
   ```

4. **Handle async operations**
   ```typescript
   await page.waitForSelector('[data-testid="score-result"]', {
     timeout: 10000,
   });
   ```

## 🐛 Debugging Tests

### Jest

```bash
# Run specific test file
npm test -- calculateScore.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should calculate"

# Update snapshots
npm test -- -u

# Show console.log output
npm test -- --verbose
```

### Playwright

```bash
# Debug mode (step through with debugger)
npm run test:e2e:debug

# UI mode (visual test runner)
npm run test:e2e:ui

# Run headed (see browser)
npx playwright test --headed

# Slow down execution
npx playwright test --slow-mo=1000
```

## 🎨 Test Organization

```
DegenScore-Card/
├── __tests__/                # Jest tests
│   ├── lib/                  # Unit tests
│   │   ├── calculateScore.test.ts
│   │   └── metricsEngine.test.ts
│   ├── components/           # Component tests
│   │   ├── ScoreCard.test.tsx
│   │   └── ErrorBoundary.test.tsx
│   └── api/                  # Integration tests
│       ├── health.test.ts
│       └── score.test.ts
├── e2e/                      # Playwright E2E tests
│   ├── score-generation.spec.ts
│   ├── wallet-connection.spec.ts
│   └── nft-minting.spec.ts
├── jest.config.js            # Jest configuration
├── jest.setup.js             # Jest setup
└── playwright.config.ts      # Playwright configuration
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing Tests

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure coverage** doesn't drop below thresholds
3. **Add E2E tests** for new user-facing features
4. **Update this guide** if introducing new patterns

---

**Questions?** Ask in `#dev-chat` on [Discord](https://discord.gg/degenscore) or open a [GitHub Discussion](https://github.com/rxrmgg2srb-code/DegenScore-Card/discussions).
