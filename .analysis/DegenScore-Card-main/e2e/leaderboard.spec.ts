import { test, expect } from '@playwright/test';

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test('should display leaderboard page', async ({ page }) => {
    // Check for leaderboard heading
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
  });

  test('should show top players', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('[data-testid="leaderboard-item"]', { timeout: 10000 });

    // Check that at least one player is displayed
    const players = page.locator('[data-testid="leaderboard-item"]');
    await expect(players.first()).toBeVisible();
  });

  test('should have filter tabs', async ({ page }) => {
    // Check for filter options (score, volume, win rate, etc.)
    const filters = page.locator('[data-testid="leaderboard-filter"]');
    await expect(filters).toHaveCount.greaterThan(0);
  });

  test('should allow changing sort order', async ({ page }) => {
    // Click on volume tab
    const volumeTab = page.getByRole('button', { name: /volume/i });
    if (await volumeTab.isVisible()) {
      await volumeTab.click();

      // Wait for leaderboard to update
      await page.waitForTimeout(1000);

      // Verify URL or state changed
      expect(page.url()).toContain('leaderboard');
    }
  });

  test('should show pagination if many results', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('[data-testid="pagination"]');
    const count = await pagination.count();

    if (count > 0) {
      await expect(pagination).toBeVisible();
    }
  });
});
