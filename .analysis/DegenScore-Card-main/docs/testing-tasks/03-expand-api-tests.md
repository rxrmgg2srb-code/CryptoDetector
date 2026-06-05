# Task 03: Expand Backend API Test Coverage

## Overview

Drive backend test coverage to production-grade levels by adding 400+ deterministic tests across all API routes and library modules. Focus on business-critical paths including trading analytics, token security analysis, whale tracking, AI coaching, and payment processing.

## Description

Create comprehensive test coverage for the backend API layer (`pages/api/**`) and supporting library modules (`lib/**`). Implement reusable fixtures, robust mocking strategies for external services, and integration tests that verify end-to-end functionality without relying on live services.

## Technical Details

### Test Coverage Targets

| Domain      | Current | Target | New Tests      |
| ----------- | ------- | ------ | -------------- |
| API Routes  | ~30%    | 85%+   | ~150 tests     |
| Lib Modules | ~25%    | 90%+   | ~200 tests     |
| Integration | ~10%    | 70%+   | ~50 tests      |
| **Total**   | -       | -      | **~400 tests** |

### API Routes to Test

1. **Trading Analytics** (`pages/api/analytics/*`)
   - `/api/analytics/trades` - Trade history analysis
   - `/api/analytics/performance` - Portfolio performance metrics
   - `/api/analytics/degen-score` - DegenScore calculation
   - `/api/analytics/leaderboard` - Leaderboard rankings
   - Tests: Request validation, calculation accuracy, caching, rate limiting

2. **Token Security** (`pages/api/token-security/*`)
   - `/api/token-security/analyze` - Token analysis endpoint
   - `/api/token-security/report` - Security report generation
   - Tests: Helius API integration, risk scoring, report formatting

3. **Whale Tracking** (`pages/api/whale/*`)
   - `/api/whale/track` - Start tracking a whale
   - `/api/whale/alerts` - Whale movement alerts
   - `/api/whale/activity` - Whale activity feed
   - Tests: Real-time updates, alert triggering, activity aggregation

4. **AI Coach** (`pages/api/ai/*`)
   - `/api/ai/analyze` - Trading analysis
   - `/api/ai/recommendations` - AI-powered recommendations
   - `/api/ai/chat` - Chat interface
   - Tests: OpenAI integration, prompt engineering, response formatting

5. **Card Generation** (`pages/api/cards/*`)
   - `/api/cards/generate` - NFT card generation
   - `/api/cards/render` - Card image rendering
   - Tests: Queue integration, image generation, caching

6. **Gamification** (`pages/api/gamification/*`)
   - `/api/gamification/challenges` - Challenge management
   - `/api/gamification/streaks` - Streak tracking
   - `/api/gamification/badges` - Badge awards
   - `/api/gamification/referrals` - Referral system
   - Tests: State management, reward calculation, fraud detection

7. **Payments** (`pages/api/payments/*`)
   - `/api/payments/initiate` - Payment initialization
   - `/api/payments/webhook` - Payment webhooks
   - Tests: Transaction validation, webhook verification, error handling

### Library Modules to Test

1. **metricsEngine.ts**
   - Trade analysis algorithms
   - Performance calculations
   - DegenScore formula
   - Portfolio aggregation
   - Tests: ~40 unit tests for core algorithms

2. **aiCoach.ts**
   - OpenAI integration
   - Prompt generation
   - Response parsing
   - Context management
   - Tests: ~30 tests with mocked OpenAI responses

3. **tokenSecurityAnalyzer.ts**
   - Token metadata analysis
   - Liquidity checks
   - Holder distribution analysis
   - Risk scoring algorithm
   - Tests: ~35 tests with mocked Helius API

4. **whaleTracker.ts**
   - Whale identification
   - Transaction monitoring
   - Alert generation
   - Activity aggregation
   - Tests: ~30 tests with mocked blockchain data

5. **cache.ts / redis.ts**
   - Cache operations (get, set, delete)
   - TTL management
   - Cache invalidation strategies
   - Tests: ~25 tests with mocked Redis

6. **queue.ts / BullMQ integration**
   - Job creation
   - Job processing
   - Retry logic
   - Error handling
   - Tests: ~20 tests with mocked BullMQ

7. **realtime.ts / Pusher integration**
   - Channel management
   - Event publishing
   - Subscription handling
   - Tests: ~20 tests with mocked Pusher

8. **referrals.ts**
   - Referral code generation
   - Reward calculation
   - Fraud detection
   - Tests: ~15 tests

9. **streaks.ts**
   - Streak tracking
   - Milestone detection
   - Reward triggering
   - Tests: ~15 tests

### Reusable Fixtures

Create comprehensive fixtures in `__tests__/fixtures/`:

1. **`api.fixtures.ts`**

   ```typescript
   export const mockApiRequest = (overrides = {}) => ({
     method: 'GET',
     headers: { 'content-type': 'application/json' },
     query: {},
     body: {},
     ...overrides,
   });

   export const mockApiResponse = () => ({
     status: jest.fn().mockReturnThis(),
     json: jest.fn().mockReturnThis(),
     send: jest.fn().mockReturnThis(),
   });
   ```

2. **`blockchain.fixtures.ts`**

   ```typescript
   export const mockTransaction = {
     /* ... */
   };
   export const mockWallet = {
     /* ... */
   };
   export const mockTokenMetadata = {
     /* ... */
   };
   ```

3. **`prisma.fixtures.ts`**

   ```typescript
   export const mockUser = {
     /* ... */
   };
   export const mockChallenge = {
     /* ... */
   };
   export const mockBadge = {
     /* ... */
   };
   ```

4. **`external-services.fixtures.ts`**
   ```typescript
   export const mockHeliusResponse = {
     /* ... */
   };
   export const mockOpenAIResponse = {
     /* ... */
   };
   export const mockCloudflareR2Response = {
     /* ... */
   };
   ```

### Mocking Strategies

1. **Redis Mock**

   ```typescript
   // __mocks__/redis.ts
   const store = new Map();
   export const redis = {
     get: jest.fn((key) => Promise.resolve(store.get(key))),
     set: jest.fn((key, val) => {
       store.set(key, val);
       return Promise.resolve('OK');
     }),
     del: jest.fn((key) => {
       store.delete(key);
       return Promise.resolve(1);
     }),
   };
   ```

2. **Pusher Mock**

   ```typescript
   // __mocks__/pusher.ts
   export const Pusher = jest.fn().mockImplementation(() => ({
     trigger: jest.fn().mockResolvedValue({}),
     triggerBatch: jest.fn().mockResolvedValue({}),
   }));
   ```

3. **OpenAI Mock**

   ```typescript
   // __mocks__/openai.ts
   export const openai = {
     chat: {
       completions: {
         create: jest.fn().mockResolvedValue({
           choices: [{ message: { content: 'Mocked response' } }],
         }),
       },
     },
   };
   ```

4. **Helius RPC Mock**

   ```typescript
   // __mocks__/helius.ts
   export const helius = {
     getTransaction: jest.fn().mockResolvedValue(mockTransaction),
     getTokenMetadata: jest.fn().mockResolvedValue(mockTokenMetadata),
   };
   ```

5. **Cloudflare R2 Mock**
   ```typescript
   // __mocks__/r2.ts
   export const r2Client = {
     putObject: jest.fn().mockResolvedValue({ ETag: 'mock-etag' }),
     getObject: jest.fn().mockResolvedValue({ Body: Buffer.from('data') }),
   };
   ```

### Test Patterns

1. **API Route Testing Pattern**

   ```typescript
   describe('POST /api/analytics/trades', () => {
     it('should return 400 for missing wallet address', async () => {
       const { req, res } = createMocks({ method: 'POST', body: {} });
       await handler(req, res);
       expect(res._getStatusCode()).toBe(400);
     });

     it('should analyze trades successfully', async () => {
       // Mock Prisma, Redis, external APIs
       const { req, res } = createMocks({
         method: 'POST',
         body: { wallet: 'mock-wallet' },
       });
       await handler(req, res);
       expect(res._getStatusCode()).toBe(200);
       expect(res._getJSONData()).toMatchObject({ trades: expect.any(Array) });
     });
   });
   ```

2. **Library Module Testing Pattern**

   ```typescript
   describe('metricsEngine.calculateDegenScore', () => {
     it('should calculate score for active trader', () => {
       const trades = [
         /* mock trades */
       ];
       const score = calculateDegenScore(trades);
       expect(score).toBeGreaterThan(700);
     });

     it('should penalize high-loss trades', () => {
       const trades = [
         /* losing trades */
       ];
       const score = calculateDegenScore(trades);
       expect(score).toBeLessThan(500);
     });
   });
   ```

## Acceptance Criteria

- [ ] 400+ new backend tests created and passing
- [ ] API route coverage:
  - [ ] Trading analytics: 20+ tests
  - [ ] Token security: 15+ tests
  - [ ] Whale tracking: 15+ tests
  - [ ] AI coach: 20+ tests
  - [ ] Card generation: 10+ tests
  - [ ] Gamification: 30+ tests
  - [ ] Payments: 10+ tests
- [ ] Library module coverage:
  - [ ] `metricsEngine.ts`: 40+ tests
  - [ ] `aiCoach.ts`: 30+ tests
  - [ ] `tokenSecurityAnalyzer.ts`: 35+ tests
  - [ ] `whaleTracker.ts`: 30+ tests
  - [ ] `cache.ts`: 25+ tests
  - [ ] `queue.ts`: 20+ tests
  - [ ] `realtime.ts`: 20+ tests
  - [ ] `referrals.ts`: 15+ tests
  - [ ] `streaks.ts`: 15+ tests
- [ ] Reusable fixtures created in `__tests__/fixtures/`:
  - [ ] `api.fixtures.ts`
  - [ ] `blockchain.fixtures.ts`
  - [ ] `prisma.fixtures.ts`
  - [ ] `external-services.fixtures.ts`
- [ ] Comprehensive mocks for:
  - [ ] Redis (in-memory mock)
  - [ ] Pusher (event capture)
  - [ ] OpenAI (response mocking)
  - [ ] Helius RPC (blockchain data)
  - [ ] Cloudflare R2 (storage operations)
- [ ] All tests are deterministic (no random failures)
- [ ] All tests run in isolation (no shared state)
- [ ] Test suite runs in under 5 minutes
- [ ] Code coverage reports show:
  - [ ] API routes: >85% coverage
  - [ ] Lib modules: >90% coverage
- [ ] Documentation updated in test files with clear descriptions

## Dependencies

- Task 01: Use audit report to prioritize which modules to test first
- Task 02: Apply stable testing patterns from flaky test fixes

## Estimated Effort

- **Time**: 16-20 hours
- **Complexity**: High
- **Priority**: Critical (core business logic)

## Success Metrics

- Backend code coverage increases from ~28% to >85%
- Critical business logic (DegenScore, token analysis, whale tracking) has 100% test coverage
- All API endpoints have happy path and error path tests
- Zero untested critical paths identified in production monitoring
- Deployment confidence score increases
