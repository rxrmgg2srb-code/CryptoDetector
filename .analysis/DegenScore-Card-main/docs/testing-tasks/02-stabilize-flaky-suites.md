# Task 02: Stabilize Flaky Test Suites

## Overview

Harden and stabilize failure-prone test suites that exhibit intermittent failures due to timing issues, race conditions, async state updates, and improper mocking. Focus on high-value components and hooks that are critical to the application's functionality but currently have unreliable tests.

## Description

Identify and fix flaky tests across the test suite, with special attention to React hooks with async operations (`useWhaleRadar`, `useTokenAnalyzer`), UI components with timers (`UrgencyTimer`, countdown components), and realtime widgets (Pusher integration, live updates). Establish patterns and shared utilities that prevent flaky tests in the future.

## Technical Details

### Target Areas

1. **useWhaleRadar Hook Tests**
   - **Issues**: Race conditions in WebSocket mock, async state updates
   - **Fixes**:
     - Properly mock Pusher client with deterministic behavior
     - Use `waitFor` from Testing Library for async assertions
     - Mock `Date.now()` for consistent timestamp testing
     - Add proper cleanup in `afterEach`

2. **UrgencyTimer Component Tests**
   - **Issues**: Timer-based tests fail due to timing precision
   - **Fixes**:
     - Use `jest.useFakeTimers()` for deterministic time control
     - Replace `setTimeout` assertions with `jest.advanceTimersByTime()`
     - Mock system time for threshold calculations
     - Test edge cases (timer expiry, timezone handling)

3. **Realtime Widgets Tests**
   - **Issues**: Pusher connection state, message ordering, reconnection logic
   - **Fixes**:
     - Create comprehensive Pusher mock in `__tests__/helpers/pusher.mock.ts`
     - Simulate connection states (connecting, connected, disconnected)
     - Mock channel subscription/unsubscription
     - Test message queueing and deduplication

4. **API Integration Tests**
   - **Issues**: Network timing, external service dependencies
   - **Fixes**:
     - Mock all external APIs (Helius, OpenAI, Cloudflare R2)
     - Use `msw` (Mock Service Worker) for HTTP request interception
     - Add request timeouts and retry logic tests
     - Mock Redis with deterministic cache behavior

5. **Animation & Transition Tests**
   - **Issues**: Framer Motion animations causing timing issues
   - **Fixes**:
     - Mock `framer-motion` with instant transitions
     - Disable animations in test environment
     - Use `waitFor` for elements that appear after animation

### Shared Helpers

Create reusable test utilities in `__tests__/helpers/`:

1. **`react-testing.helpers.ts`**

   ```typescript
   export const waitForLoadingToFinish = async () => {
     await waitFor(() => {
       expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
     });
   };

   export const actAndWait = async (callback: () => void) => {
     await act(async () => {
       callback();
       await new Promise((resolve) => setTimeout(resolve, 0));
     });
   };
   ```

2. **`timer.helpers.ts`**

   ```typescript
   export const setupFakeTimers = () => {
     jest.useFakeTimers();
     return () => jest.useRealTimers();
   };

   export const advanceTime = (ms: number) => {
     act(() => {
       jest.advanceTimersByTime(ms);
     });
   };
   ```

3. **`pusher.mock.ts`**

   ```typescript
   export const createMockPusher = () => {
     const channels = new Map();
     return {
       subscribe: jest.fn((channelName) => {
         // Mock channel with deterministic behavior
       }),
       unsubscribe: jest.fn(),
       disconnect: jest.fn(),
     };
   };
   ```

4. **`async-state.helpers.ts`**
   ```typescript
   export const waitForStateUpdate = async (getValue: () => any, expected: any) => {
     await waitFor(
       () => {
         expect(getValue()).toBe(expected);
       },
       { timeout: 3000 }
     );
   };
   ```

### Test Updates

1. **Update Existing Suites**
   - Refactor `__tests__/hooks/useWhaleRadar.test.tsx`
   - Refactor `__tests__/components/UrgencyTimer.test.tsx`
   - Refactor `__tests__/components/realtime/*.test.tsx`
   - Add proper `act()` wrapping for all state updates
   - Replace `setTimeout` with `jest.advanceTimersByTime()`
   - Add comprehensive mocks for external dependencies

2. **Add Missing Tests**
   - Edge cases for timer boundaries
   - Network failure scenarios
   - Reconnection logic for realtime features
   - Race condition scenarios

### NPM Script

Add to `package.json`:

```json
{
  "scripts": {
    "test:flaky": "jest --testPathPattern='(useWhaleRadar|UrgencyTimer|realtime)' --runInBand --verbose",
    "test:flaky:watch": "npm run test:flaky -- --watch"
  }
}
```

### Best Practices Documentation

Create `docs/development/testing-best-practices.md`:

- When to use fake timers
- How to properly mock async operations
- Patterns for testing realtime features
- Common pitfalls and solutions
- Debugging flaky tests

## Acceptance Criteria

- [ ] All targeted test suites pass consistently (10 consecutive runs without failures)
- [ ] Shared helpers created in `__tests__/helpers/`:
  - [ ] `react-testing.helpers.ts`
  - [ ] `timer.helpers.ts`
  - [ ] `pusher.mock.ts`
  - [ ] `async-state.helpers.ts`
- [ ] Updated test files:
  - [ ] `__tests__/hooks/useWhaleRadar.test.tsx` - all tests stable
  - [ ] `__tests__/components/UrgencyTimer.test.tsx` - fake timers implemented
  - [ ] At least 5 realtime widget tests refactored
- [ ] All tests properly use:
  - [ ] `act()` for state updates
  - [ ] `jest.useFakeTimers()` for time-dependent tests
  - [ ] `waitFor()` for async assertions
  - [ ] Proper cleanup in `afterEach()`
- [ ] `npm run test:flaky` command executes successfully
- [ ] Script runs in under 2 minutes
- [ ] Zero test failures in CI/CD pipeline runs
- [ ] Documentation created:
  - [ ] `docs/development/testing-best-practices.md`
  - [ ] Inline comments explaining complex mock setups
- [ ] Test coverage maintained or improved (no coverage regression)

## Dependencies

- Task 01 (optional): Gap analysis can identify additional flaky tests

## Estimated Effort

- **Time**: 6-8 hours
- **Complexity**: Medium-High
- **Priority**: High (improves developer experience and CI reliability)

## Success Metrics

- Flaky test failure rate reduced from ~15% to <1%
- CI pipeline success rate improves to >95%
- Average test suite runtime reduced by 20% (due to fake timers)
- Developer confidence in test suite increases
- No more "just rerun the tests" incidents
