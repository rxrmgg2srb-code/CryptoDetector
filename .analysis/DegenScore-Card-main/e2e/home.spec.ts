import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();

    // Check for wallet connect button
    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/DegenScore/);
  });

  test('should show navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check navigation links
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /leaderboard/i })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that content is visible on mobile
    await expect(page.locator('h1')).toBeVisible();
  });
});
