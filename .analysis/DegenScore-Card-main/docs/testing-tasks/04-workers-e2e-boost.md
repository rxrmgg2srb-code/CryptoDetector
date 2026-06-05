# Task 04: Workers & E2E Testing Boost

## Overview

Expand test coverage for background workers (BullMQ), smart contract programs (Anchor/Rust), and end-to-end user workflows (Playwright). Add ~300 new tests covering job processing, blockchain interactions, and critical user journeys to ensure system reliability under production conditions.

## Description

Build comprehensive testing infrastructure for asynchronous job processing, smart contract operations, and full-stack user flows. This task ensures that background workers handle edge cases correctly, smart contracts behave as expected, and users can complete critical workflows without issues.

## Technical Details

### Part 1: BullMQ Worker Tests (~100 tests)

#### Target: `workers/card-generation.ts`

Create `__tests__/workers/card-generation.test.ts` with comprehensive unit tests:

1. **Job Processing Tests** (~30 tests)

   ```typescript
   describe('CardGenerationWorker', () => {
     it('should process valid card generation job', async () => {
       const job = createMockJob({ userId: 'user-1', cardType: 'degen' });
       await worker.process(job);
       expect(job.updateProgress).toHaveBeenCalledWith(100);
     });

     it('should handle missing user data gracefully', async () => {
       const job = createMockJob({ userId: 'invalid' });
       await expect(worker.process(job)).rejects.toThrow('User not found');
     });

     it('should retry on transient failures', async () => {
       // Test retry logic
     });
   });
   ```

2. **Image Generation Tests** (~25 tests)
   - Canvas rendering with mock data
   - Text positioning and formatting
   - Image composition and layering
   - Badge and achievement rendering
   - QR code generation
   - Error handling for invalid data

3. **Caching Tests** (~15 tests)
   - Cache hit/miss scenarios
   - Cache invalidation on data update
   - Redis integration with mock
   - TTL management
   - Cache warming strategies

4. **Storage Integration Tests** (~15 tests)
   - Cloudflare R2 upload
   - S3-compatible operations
   - File naming and organization
   - Public URL generation
   - Error handling for storage failures

5. **Job Queue Tests** (~15 tests)
   - Job creation and scheduling
   - Priority handling
   - Concurrency limits
   - Dead letter queue
   - Job cleanup after completion

#### Additional Worker Tests

Create tests for other workers (if they exist or plan to):

- Email notification worker
- Webhook delivery worker
- Analytics aggregation worker
- Leaderboard update worker

### Part 2: Smart Contract / Program Tests (~50 tests)

#### Target: Anchor Programs in `programs/`

1. **Token Program Tests** (~20 tests)
   - Token initialization
   - Minting operations
   - Transfer logic
   - Burn mechanisms
   - Authority checks
   - PDA (Program Derived Address) derivation

2. **NFT Program Tests** (~15 tests)
   - NFT minting
   - Metadata updates
   - Ownership transfers
   - Royalty enforcement
   - Collection management

3. **Staking Program Tests** (~15 tests)
   - Stake deposit
   - Reward calculation
   - Withdrawal logic
   - Lock period enforcement
   - Emergency unstake

#### Test Setup

Create `programs/tests/` directory with Anchor test framework:

```typescript
// programs/tests/token.test.ts
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';

describe('Token Program', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it('initializes token mint', async () => {
    const program = anchor.workspace.Token as Program;
    // Test implementation
  });

  it('enforces authority for minting', async () => {
    // Test unauthorized minting attempt
  });
});
```

#### Integration with CI

- Set up Solana localnet in CI
- Run Anchor tests in isolated environment
- Generate coverage reports for Rust code
- Smoke tests for deployment readiness

### Part 3: E2E Testing Expansion (~150 tests)

#### Expand Playwright Test Coverage

Current E2E coverage is minimal. Add comprehensive user journey tests:

1. **Wallet Connection Flow** (~20 tests)
   - Connect Phantom wallet
   - Connect Solflare wallet
   - Wallet disconnection
   - Multi-wallet switching
   - Error handling for locked wallet
   - Network switching (mainnet/devnet)

2. **Trading Analytics Journey** (~25 tests)
   - Enter wallet address
   - View DegenScore calculation
   - Explore trade history
   - Filter by date range
   - Export analytics report
   - Share results on social media

3. **AI Coach Interaction** (~20 tests)
   - Start conversation
   - Ask trading questions
   - Receive recommendations
   - View historical advice
   - Error handling for API failures
   - Rate limiting behavior

4. **Whale Radar Features** (~20 tests)
   - Search for whale wallet
   - Start tracking whale
   - Receive real-time alerts
   - View whale activity feed
   - Stop tracking
   - Alert preferences

5. **Card Generation & Gallery** (~15 tests)
   - Generate new card
   - View card in gallery
   - Share card on social
   - Download card image
   - Regenerate card with new data
   - Delete card

6. **Gamification Features** (~20 tests)
   - View challenges dashboard
   - Complete a challenge
   - Earn badges
   - Track streaks
   - View leaderboard
   - Claim rewards

7. **Token Security Scanner** (~15 tests)
   - Enter token address
   - View security analysis
   - Understand risk scores
   - Export security report
   - Compare multiple tokens
   - Set up alerts

8. **Referral System** (~10 tests)
   - Generate referral code
   - Share referral link
   - Track referral signups
   - View referral rewards
   - Withdraw earnings

9. **Hot Feed & Social** (~10 tests)
   - View hot feed
   - Filter by category
   - Like/comment on posts
   - Share content
   - Follow users

#### E2E Test Infrastructure

1. **Test Fixtures** (`e2e/fixtures/`)
   - Mock wallet provider
   - Test user accounts
   - Sample blockchain data
   - Seed data for consistent tests

2. **Page Objects** (`e2e/pages/`)

   ```typescript
   // e2e/pages/WalletConnectionPage.ts
   export class WalletConnectionPage {
     constructor(private page: Page) {}

     async connectPhantom() {
       await this.page.click('[data-testid="connect-phantom"]');
       // Handle wallet popup
     }

     async isConnected() {
       return await this.page.isVisible('[data-testid="wallet-connected"]');
     }
   }
   ```

3. **Test Helpers** (`e2e/helpers/`)
   - Authentication helpers
   - Wait utilities
   - Screenshot capture on failure
   - Network mocking
   - Database seeding

4. **Configuration**
   Update `playwright.config.ts`:
   ```typescript
   export default defineConfig({
     testDir: './e2e',
     fullyParallel: true,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: [['html'], ['junit', { outputFile: 'results.xml' }]],
     use: {
       baseURL: 'http://localhost:3000',
       screenshot: 'only-on-failure',
       video: 'retain-on-failure',
       trace: 'on-first-retry',
     },
     projects: [
       { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
       { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
       { name: 'webkit', use: { ...devices['Desktop Safari'] } },
       { name: 'mobile', use: { ...devices['iPhone 12'] } },
     ],
   });
   ```

### Part 4: Load & Stress Testing (~5 tests)

Optional but recommended:

1. **K6 Load Tests** (`k6/`)
   - API endpoint performance under load
   - Concurrent user simulation
   - Database query performance
   - Cache effectiveness
   - Rate limiting validation

## Acceptance Criteria

### BullMQ Worker Tests

- [ ] `__tests__/workers/card-generation.test.ts` created with 100+ tests
- [ ] Tests cover:
  - [ ] Job processing lifecycle
  - [ ] Image generation logic
  - [ ] Cache operations
  - [ ] Storage integration (R2/S3)
  - [ ] Queue management
  - [ ] Error handling and retries
- [ ] All worker tests pass consistently
- [ ] Worker tests run in under 3 minutes

### Smart Contract Tests

- [ ] Anchor test framework configured
- [ ] 50+ tests for programs:
  - [ ] Token program: 20+ tests
  - [ ] NFT program: 15+ tests
  - [ ] Staking program: 15+ tests
- [ ] Tests run against Solana localnet
- [ ] Coverage report generated for Rust code
- [ ] Smoke tests for deployment readiness

### E2E Tests (Playwright)

- [ ] 150+ new E2E tests covering:
  - [ ] Wallet connection: 20 tests
  - [ ] Trading analytics: 25 tests
  - [ ] AI Coach: 20 tests
  - [ ] Whale Radar: 20 tests
  - [ ] Card generation: 15 tests
  - [ ] Gamification: 20 tests
  - [ ] Token scanner: 15 tests
  - [ ] Referral system: 10 tests
  - [ ] Hot feed: 10 tests
- [ ] Page Object pattern implemented
- [ ] Test fixtures and helpers created
- [ ] Tests run on multiple browsers (Chrome, Firefox, Safari)
- [ ] Mobile viewport tests included
- [ ] Screenshots captured on failure
- [ ] Video recordings for failed tests

### Infrastructure

- [ ] NPM scripts added:
  ```json
  {
    "test:workers": "jest --testPathPattern='workers'",
    "test:anchor": "anchor test",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
  ```
- [ ] CI pipeline includes all test types
- [ ] Test artifacts stored (screenshots, videos, traces)
- [ ] Parallel execution configured
- [ ] Test reports published

### Quality Metrics

- [ ] All 300+ new tests pass consistently
- [ ] E2E test suite completes in under 15 minutes
- [ ] Worker tests complete in under 3 minutes
- [ ] Smart contract tests complete in under 5 minutes
- [ ] Zero flaky tests in new suites
- [ ] Documentation for running each test type

## Dependencies

- Task 01: Audit identifies critical E2E flows to test
- Task 02: Apply stable testing patterns to new tests
- Task 03: Integration with API tests for full coverage

## Estimated Effort

- **Time**: 20-24 hours
- **Complexity**: High
- **Priority**: High (critical for production readiness)

## Success Metrics

- 300+ new tests added (workers, smart contracts, E2E)
- E2E coverage for all critical user journeys
- Worker reliability under production load verified
- Smart contract security validated through comprehensive tests
- Production deployment confidence score reaches 95%+
- Zero critical bugs detected in production that could have been caught by E2E tests
