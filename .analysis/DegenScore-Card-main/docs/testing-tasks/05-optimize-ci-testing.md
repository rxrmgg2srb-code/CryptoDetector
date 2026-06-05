# Task 05: Optimize CI/CD Testing Pipeline

## Overview

Upgrade and optimize the CI/CD testing pipeline to handle the expanded test suite efficiently. Implement parallel test execution, intelligent caching, test result reporting, and quality gates to ensure fast feedback while maintaining high reliability standards.

## Description

Transform the CI/CD pipeline from a basic test runner into a sophisticated, multi-stage testing infrastructure that can handle 1000+ tests across multiple domains in under 15 minutes. Implement matrix builds, dependency caching, test sharding, and automated quality enforcement to create a world-class continuous integration experience.

## Technical Details

### Part 1: GitHub Actions Workflow Upgrade

Update `.github/workflows/test.yml` with optimized configuration:

#### Current State

- Single test job runs all tests sequentially
- No caching strategy
- Long execution time (20+ minutes)
- Limited parallelization
- No test result reporting

#### Target State

- Matrix-based parallel execution
- Aggressive caching (npm, Prisma, Playwright)
- Test sharding by domain
- Rich test reports and artifacts
- Quality gates with failure prevention

### Part 2: Test Matrix Strategy

Create parallel test jobs organized by domain:

```yaml
name: Comprehensive Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  POSTGRES_VERSION: '15'

jobs:
  # Job 1: Components & Hooks Tests
  test-frontend:
    name: Frontend Tests (Components & Hooks)
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run frontend tests
        run: npm run test:frontend -- --shard=${{ matrix.shard }}/3

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: frontend

  # Job 2: API & Lib Module Tests
  test-backend:
    name: Backend Tests (API & Lib)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: |
          npx prisma generate
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db

      - name: Run backend tests
        run: npm run test:backend
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: backend

  # Job 3: Workers & Background Jobs
  test-workers:
    name: Workers & Queue Tests
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run worker tests
        run: npm run test:workers
        env:
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: workers

  # Job 4: Smart Contract Tests
  test-programs:
    name: Smart Contract Tests (Anchor)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          profile: minimal

      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH

      - name: Install Anchor
        run: |
          cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

      - name: Cache Solana
        uses: actions/cache@v3
        with:
          path: ~/.cache/solana
          key: ${{ runner.os }}-solana-${{ hashFiles('**/Cargo.lock') }}

      - name: Run Anchor tests
        run: npm run test:anchor

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: anchor-test-results
          path: programs/tests/results/

  # Job 5: E2E Tests
  test-e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Cache Playwright
        uses: actions/cache@v3
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e -- --project=${{ matrix.browser }}

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 7

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-videos-${{ matrix.browser }}
          path: test-results/
          retention-days: 7

  # Job 6: Test Audit & Quality Gate
  test-audit:
    name: Test Audit & Coverage Gate
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend, test-workers, test-programs, test-e2e]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run test audit
        run: npm run test:audit

      - name: Check coverage threshold
        run: |
          COVERAGE=$(jq '.summary.coveragePercentage' reports/testing/audit-*.json | tail -1)
          if (( $(echo "$COVERAGE < 85" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below 85% threshold"
            exit 1
          else
            echo "✅ Coverage $COVERAGE% meets threshold"
          fi

      - name: Run flaky test detection
        run: npm run test:flaky -- --ci

      - name: Upload audit reports
        uses: actions/upload-artifact@v3
        with:
          name: test-audit-reports
          path: reports/testing/

  # Job 7: Success Rate Gate
  quality-gate:
    name: Quality Gate (95% Success Rate)
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend, test-workers, test-programs, test-e2e]
    if: always()
    steps:
      - name: Check test results
        run: |
          # Calculate overall success rate
          TOTAL_JOBS=5
          SUCCESSFUL_JOBS=${{ 
            (needs.test-frontend.result == 'success' && 1 || 0) +
            (needs.test-backend.result == 'success' && 1 || 0) +
            (needs.test-workers.result == 'success' && 1 || 0) +
            (needs.test-programs.result == 'success' && 1 || 0) +
            (needs.test-e2e.result == 'success' && 1 || 0)
          }}

          SUCCESS_RATE=$((SUCCESSFUL_JOBS * 100 / TOTAL_JOBS))

          echo "Success Rate: $SUCCESS_RATE%"

          if [ $SUCCESS_RATE -lt 95 ]; then
            echo "❌ Success rate $SUCCESS_RATE% is below 95% threshold"
            exit 1
          else
            echo "✅ Success rate $SUCCESS_RATE% meets threshold"
          fi
```

### Part 3: NPM Script Organization

Update `package.json` with organized test scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",

    "test:frontend": "jest --testPathPattern='(components|hooks)'",
    "test:backend": "jest --testPathPattern='(pages/api|lib)'",
    "test:workers": "jest --testPathPattern='workers'",
    "test:anchor": "cd programs && anchor test",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",

    "test:audit": "ts-node scripts/testing/audit.ts",
    "test:audit:report": "ts-node scripts/testing/audit.ts --format=html",
    "test:flaky": "jest --testPathPattern='(useWhaleRadar|UrgencyTimer|realtime)' --runInBand --verbose",

    "test:ci": "npm run test:frontend && npm run test:backend && npm run test:workers",
    "test:all": "npm run test:ci && npm run test:anchor && npm run test:e2e"
  }
}
```

### Part 4: Caching Strategy

Implement aggressive caching to reduce CI time:

1. **NPM Dependencies Cache**
   - Key: `package-lock.json` hash
   - Saves: `node_modules/`
   - Expected speedup: 2-3 minutes

2. **Prisma Client Cache**
   - Key: `prisma/schema.prisma` hash
   - Saves: `node_modules/.prisma/`
   - Expected speedup: 30-60 seconds

3. **Playwright Browsers Cache**
   - Key: `package-lock.json` hash
   - Saves: `~/.cache/ms-playwright`
   - Expected speedup: 1-2 minutes

4. **Build Cache (Next.js)**
   - Key: Source files hash
   - Saves: `.next/cache`
   - Expected speedup: 1-2 minutes

5. **Solana/Rust Cache**
   - Key: `Cargo.lock` hash
   - Saves: `~/.cache/solana`, `target/`
   - Expected speedup: 3-5 minutes

### Part 5: Test Result Reporting

Implement rich test reporting:

1. **Codecov Integration**
   - Upload coverage from each job
   - Track coverage trends over time
   - PR comments with coverage diff
   - Fail on coverage regression

2. **Test Report Dashboard**
   - HTML reports for each test suite
   - Historical trend visualization
   - Flaky test detection
   - Performance metrics

3. **PR Status Checks**
   - ✅ All tests passed
   - 📊 Coverage: 87.3% (+2.1%)
   - ⚡ Runtime: 12m 34s (-3m 12s)
   - 🎯 Flaky tests: 0

4. **Slack Notifications** (optional)
   - Notify on CI failures
   - Daily coverage reports
   - Flaky test alerts

### Part 6: Quality Gates

Enforce quality standards automatically:

1. **Coverage Threshold**: 85%
   - Fail if overall coverage drops below 85%
   - Per-domain thresholds:
     - Components: 80%
     - Hooks: 85%
     - API routes: 90%
     - Lib modules: 95%
     - Workers: 85%

2. **Success Rate**: 95%
   - Require 95% of test jobs to pass
   - Allow 1 job failure out of 20
   - Track success rate over time

3. **Performance Budget**
   - Total CI time: <15 minutes
   - Frontend tests: <5 minutes
   - Backend tests: <5 minutes
   - E2E tests: <10 minutes
   - Fail if exceeded by >20%

4. **Zero Flaky Tests**
   - Run flaky test suite 5 times
   - All must pass consistently
   - Block merge if flaky tests detected

### Part 7: Developer Experience

Improve local testing experience:

1. **Pre-commit Hook**

   ```bash
   # .husky/pre-commit
   npm run test:changed
   ```

2. **Pre-push Hook**

   ```bash
   # .husky/pre-push
   npm run test:frontend
   npm run test:backend
   ```

3. **Watch Mode**
   - Smart test re-running
   - Only run affected tests
   - Fast feedback loop

4. **Test Documentation**
   - README for each test domain
   - How to run specific tests
   - Troubleshooting guide
   - Best practices

## Acceptance Criteria

### Workflow Configuration

- [ ] `.github/workflows/test.yml` updated with matrix strategy
- [ ] 5 parallel test jobs configured:
  - [ ] Frontend tests (components & hooks)
  - [ ] Backend tests (API & lib)
  - [ ] Worker tests
  - [ ] Smart contract tests (Anchor)
  - [ ] E2E tests (Playwright)
- [ ] Each job runs independently
- [ ] Node.js 20 used across all jobs

### Caching Implementation

- [ ] NPM dependencies cached
- [ ] Prisma client cached
- [ ] Playwright browsers cached
- [ ] Next.js build cache configured
- [ ] Solana/Rust toolchain cached
- [ ] Cache hit rate >80% in CI

### Test Scripts

- [ ] NPM scripts organized by domain
- [ ] `test:audit` command working
- [ ] `test:flaky` command working
- [ ] `test:ci` runs all unit/integration tests
- [ ] `test:all` runs complete suite

### Quality Gates

- [ ] Coverage threshold enforced (85%)
- [ ] Success rate gate implemented (95%)
- [ ] Per-domain coverage thresholds set
- [ ] Performance budget monitored
- [ ] Flaky test detection automated

### Reporting & Artifacts

- [ ] Codecov integration configured
- [ ] Coverage uploaded from all jobs
- [ ] Test artifacts stored on failure
- [ ] HTML reports generated
- [ ] PR status checks enabled
- [ ] Test results visible in GitHub UI

### Performance

- [ ] Total CI time <15 minutes
- [ ] Frontend tests <5 minutes
- [ ] Backend tests <5 minutes
- [ ] Worker tests <3 minutes
- [ ] Smart contract tests <5 minutes
- [ ] E2E tests <10 minutes per browser
- [ ] Parallel execution reduces time by 60%+

### Documentation

- [ ] CI/CD pipeline documented
- [ ] Troubleshooting guide created
- [ ] Cache strategy explained
- [ ] Quality gates documented
- [ ] Developer workflow guide updated

### Developer Experience

- [ ] Pre-commit hooks configured
- [ ] Pre-push hooks configured
- [ ] Local test commands work
- [ ] Watch mode optimized
- [ ] Test failure debugging easy

## Dependencies

- Task 01: `test:audit` script must exist
- Task 02: `test:flaky` script must exist
- Task 03: Backend tests must be comprehensive
- Task 04: Worker and E2E tests must be ready

## Estimated Effort

- **Time**: 8-10 hours
- **Complexity**: Medium-High
- **Priority**: High (enables fast feedback and reliable CI)

## Success Metrics

- CI pipeline runs in under 15 minutes (down from 20+)
- Test success rate >95% (up from ~85%)
- Developer feedback loop <5 minutes for unit tests
- Zero flaky tests in CI
- Coverage visible and trending upward
- PRs blocked on quality gate failures
- Developer satisfaction with testing experience improved
- Production deployments happen with confidence
