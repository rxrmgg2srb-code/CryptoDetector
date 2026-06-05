import { test, expect } from '@playwright/test';

/**
 * Example E2E Test for DegenScore
 *
 * This demonstrates basic E2E testing patterns. Expand this to cover
 * critical user journeys like:
 * - Wallet connection
 * - Score generation
 * - NFT minting
 * - Payment flow
 */

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loaded
    await expect(page).toHaveTitle(/DegenScore/i);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');

    // Check for key elements (adjust selectors based on actual markup)
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should have CTA button', async ({ page }) => {
    await page.goto('/');

    // Check for call-to-action button
    const ctaButton = page.getByRole('button', { name: /get.*score|connect.*wallet/i });
    await expect(ctaButton).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to different pages', async ({ page }) => {
    await page.goto('/');

    // Test navigation (adjust based on actual routes)
    // Example:
    // await page.click('text=Leaderboard');
    // await expect(page).toHaveURL(/.*leaderboard/);
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');

    // Test mobile menu if present
    await page.setViewportSize({ width: 375, height: 667 });
    // await page.click('[aria-label="Menu"]');
    // ... test mobile navigation
  });
});

test.describe('Wallet Connection (Example)', () => {
  test('should show connect wallet button when not connected', async ({ page }) => {
    await page.goto('/');

    const connectButton = page.getByRole('button', { name: /connect.*wallet/i });
    await expect(connectButton).toBeVisible();
  });

  // Note: Actual wallet testing requires mocking Phantom/Backpack
  // See: https://playwright.dev/docs/mock-browser-apis

  test.skip('should open wallet selector modal', async ({ page }) => {
    await page.goto('/');

    const connectButton = page.getByRole('button', { name: /connect.*wallet/i });
    await connectButton.click();

    // Check if modal opened (adjust selector)
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have no automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    // Install axe-playwright for automated accessibility testing
    // await injectAxe(page);
    // const violations = await checkA11y(page);
    // expect(violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Expect page to load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be usable on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that content is visible on mobile
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should handle touch events', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Test touch interactions (swipes, taps)
    // await page.tap('selector');
  });
});

/**
 * Testing Tips for E2E:
 *
 * 1. Test critical user journeys end-to-end
 * 2. Test across multiple browsers (Chrome, Firefox, Safari)
 * 3. Test on mobile and desktop viewports
 * 4. Mock blockchain interactions (wallet, transactions)
 * 5. Test error states (network failures, rejected transactions)
 * 6. Use data-testid attributes for stable selectors
 * 7. Test accessibility with axe-playwright
 * 8. Measure performance with Lighthouse
 *
 * Example user journey test:
 *
 * test('user can generate and mint DegenScore card', async ({ page }) => {
 *   // 1. Visit homepage
 *   await page.goto('/');
 *
 *   // 2. Connect wallet (mocked)
 *   await page.click('[data-testid="connect-wallet"]');
 *   await page.click('[data-testid="phantom-wallet"]');
 *
 *   // 3. Enter wallet address
 *   await page.fill('[data-testid="wallet-input"]', 'MOCK_WALLET_ADDRESS');
 *   await page.click('[data-testid="analyze-wallet"]');
 *
 *   // 4. Wait for analysis
 *   await page.waitForSelector('[data-testid="score-result"]');
 *
 *   // 5. Mint NFT
 *   await page.click('[data-testid="mint-nft"]');
 *
 *   // 6. Verify success
 *   await expect(page.getByText(/successfully minted/i)).toBeVisible();
 * });
 */
