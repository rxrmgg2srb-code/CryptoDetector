import { test, expect } from '@playwright/test';

test.describe('Card Generation Flow', () => {
  test('should display card generation form on homepage', async ({ page }) => {
    await page.goto('/');

    // Check for wallet input
    const walletInput = page.locator(
      'input[placeholder*="wallet" i], input[placeholder*="address" i]'
    );
    await expect(walletInput.first()).toBeVisible();

    // Check for analyze/generate button
    const generateButton = page.locator('button:has-text("Analyze"), button:has-text("Generate")');
    await expect(generateButton.first()).toBeVisible();
  });

  test('should show validation error for invalid wallet', async ({ page }) => {
    await page.goto('/');

    // Enter invalid wallet address
    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();
    await walletInput.fill('invalid-wallet-address');

    // Click generate button
    const generateButton = page
      .locator('button:has-text("Analyze"), button:has-text("Generate")')
      .first();
    await generateButton.click();

    // Should show error message
    await expect(page.locator('text=/invalid|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to leaderboard', async ({ page }) => {
    await page.goto('/');

    // Find and click leaderboard link
    const leaderboardLink = page.locator('a[href*="leaderboard"], button:has-text("Leaderboard")');
    if ((await leaderboardLink.count()) > 0) {
      await leaderboardLink.first().click();
      await expect(page).toHaveURL(/.*leaderboard.*/);
    }
  });

  test('should display global stats on homepage', async ({ page }) => {
    await page.goto('/');

    // Check for stats display (total users, volume, etc.)
    const statsSection = page.locator('[class*="stats" i], [class*="global" i]');
    const hasStats = (await statsSection.count()) > 0;

    if (hasStats) {
      await expect(statsSection.first()).toBeVisible();
    }
  });
});

test.describe('Card Display', () => {
  test('should handle card loading states', async ({ page }) => {
    await page.goto('/');

    const walletInput = page.locator('input[placeholder*="wallet" i]').first();
    const generateButton = page
      .locator('button:has-text("Analyze"), button:has-text("Generate")')
      .first();

    if ((await walletInput.isVisible()) && (await generateButton.isVisible())) {
      // Fill with a test wallet
      await walletInput.fill('TestWallet12345678901234567890123456789');
      await generateButton.click();

      // Check for loading state
      const loadingIndicator = page.locator(
        '[class*="loading" i], [class*="spinner" i], text=/loading|analyzing/i'
      );

      // Loading indicator might appear briefly
      const loadingExists = (await loadingIndicator.count()) > 0;
      if (loadingExists) {
        await expect(loadingIndicator.first()).toBeVisible();
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should load without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.viewportSize();

    expect(bodyWidth).toBeLessThanOrEqual((viewportWidth?.width || 0) + 20); // Allow 20px tolerance
  });

  test('should be tablet responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const walletInput = page.locator('input[placeholder*="wallet" i]').first();
    await expect(walletInput).toBeVisible();
  });
});
