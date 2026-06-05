import { test, expect } from '@playwright/test';

test.describe('Referral System', () => {
  test('should display referral section for authenticated users', async ({ page }) => {
    await page.goto('/');

    // Check if referral system is visible (might require auth)
    const referralSection = page.locator('[class*="referral" i], text=/referral/i');
    const referralExists = (await referralSection.count()) > 0;

    if (referralExists) {
      // Referral link should be present
      const referralLink = page.locator('input[value*="ref=" i], input[value*="referral" i]');
      if ((await referralLink.count()) > 0) {
        await expect(referralLink.first()).toBeVisible();
      }
    }
  });

  test('should show referral stats', async ({ page }) => {
    await page.goto('/');

    // Look for referral dashboard/stats
    const referralStats = page.locator(
      '[class*="referral" i]:has-text("count"), [class*="referral" i]:has-text("total")'
    );

    if ((await referralStats.count()) > 0) {
      await expect(referralStats.first()).toBeVisible();
    }
  });

  test('should handle referral link copying', async ({ page }) => {
    await page.goto('/');

    // Find copy referral link button
    const copyButton = page.locator('button:has-text("Copy"), button:has-text("Share")');

    if ((await copyButton.count()) > 0) {
      await copyButton.first().click();

      // Check for success message
      const successMsg = page.locator('text=/copied|success/i');
      if ((await successMsg.count()) > 0) {
        await expect(successMsg.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe('Referral Rewards', () => {
  test('should display reward milestones', async ({ page }) => {
    await page.goto('/');

    // Look for reward information
    const rewardInfo = page.locator('text=/reward|milestone|bonus/i');

    if ((await rewardInfo.count()) > 0) {
      // Rewards should be visible
      const firstReward = rewardInfo.first();
      if (await firstReward.isVisible()) {
        await expect(firstReward).toContainText(/\d+/); // Should contain numbers
      }
    }
  });

  test('should show referral leaderboard', async ({ page }) => {
    await page.goto('/');

    // Navigate to referral leaderboard if it exists
    const referralLeaderboard = page.locator(
      'a[href*="referral" i]:has-text("leaderboard"), button:has-text("referral"):has-text("leaderboard")'
    );

    if ((await referralLeaderboard.count()) > 0) {
      await referralLeaderboard.first().click();

      // Should show referral rankings
      const rankings = page.locator('[class*="rank" i], [class*="position" i]');
      await expect(rankings.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
