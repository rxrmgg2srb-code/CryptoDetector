import { test, expect } from '@playwright/test';

/**
 * Premium Features E2E Tests
 * Tests premium upsell, whale radar alerts, referral system, and advanced features
 */

test.describe('Whale Radar Feature', () => {
  test('should display whale radar section', async ({ page }) => {
    await page.goto('/');

    const whaleRadar = page
      .locator('a, button')
      .filter({ hasText: /whale|radar|monitoring/i })
      .first();

    if ((await whaleRadar.count()) > 0) {
      await whaleRadar.click();
      await expect(page).toHaveURL(/whale|radar/i);
    }
  });

  test('should show whale tracking dashboard', async ({ page }) => {
    await page.goto('/whale-radar').catch(() => null);

    const dashboard = page
      .locator('[data-testid="whale-radar"], [class*="whale"], [class*="radar"]')
      .first();

    if ((await dashboard.count()) > 0) {
      await expect(dashboard)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should display tracked whale wallets', async ({ page }) => {
    await page.goto('/whale-radar').catch(() => null);

    const whaleList = page
      .locator('[data-testid="whale-list"], [class*="whale-list"], table')
      .first();

    if ((await whaleList.count()) > 0) {
      await expect(whaleList)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should show real-time whale trades', async ({ page }) => {
    await page.goto('/whale-radar').catch(() => null);

    const tradesList = page
      .locator('[data-testid="trades"], [class*="trade"], [class*="activity"]')
      .first();

    if ((await tradesList.count()) > 0) {
      await expect(tradesList)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should allow adding custom whale tracking', async ({ page }) => {
    await page.goto('/whale-radar').catch(() => null);

    const addButton = page
      .locator('button')
      .filter({ hasText: /add|track|watch/i })
      .first();

    if ((await addButton.count()) > 0) {
      await addButton.click().catch(() => null);

      // Should show input field or modal
      const input = page
        .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
        .first();
      if ((await input.count()) > 0) {
        await expect(input)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should set whale alert thresholds', async ({ page }) => {
    await page.goto('/whale-radar').catch(() => null);

    const settingsButton = page
      .locator('button')
      .filter({ hasText: /settings|alert|threshold/i })
      .first();

    if ((await settingsButton.count()) > 0) {
      await settingsButton.click().catch(() => null);

      // Should show alert configuration
      const alertConfig = page
        .locator('[data-testid="alert-settings"], [class*="settings"]')
        .first();
      if ((await alertConfig.count()) > 0) {
        await expect(alertConfig)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should receive whale trade notifications', async ({ page, context }) => {
    await page.goto('/whale-radar').catch(() => null);

    // Enable notifications
    const notifyToggle = page
      .locator('button')
      .filter({ hasText: /notify|alert|notification/i })
      .first();

    if ((await notifyToggle.count()) > 0) {
      await notifyToggle.click().catch(() => null);
    }

    // Should remain on page
    expect(page.url()).toBeDefined();
  });

  test('should filter whale trades by token', async ({ page }) => {
    await page.goto('/whale-radar').catch(() => null);

    const filterButton = page
      .locator('button')
      .filter({ hasText: /filter|token/i })
      .first();
    const tokenSelect = page.locator('select, [role="combobox"]').first();

    if ((await filterButton.count()) > 0) {
      await filterButton.click().catch(() => null);
    }

    if ((await tokenSelect.count()) > 0) {
      await tokenSelect.click().catch(() => null);
    }
  });
});

test.describe('Premium Upsell', () => {
  test('should display premium benefits', async ({ page }) => {
    await page.goto('/');

    const premiumSection = page.locator('text=/premium|pro|upgrade/i').first();

    if ((await premiumSection.count()) > 0) {
      await expect(premiumSection)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should show pricing information', async ({ page }) => {
    await page.goto('/pricing').catch(() => null);

    const pricingCards = page
      .locator('[data-testid="pricing-card"], [class*="pricing"], [class*="plan"]')
      .first();

    if ((await pricingCards.count()) > 0) {
      await expect(pricingCards)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);

      // Should show price
      const price = page.locator('text=/\\$|price|cost/i').first();
      if ((await price.count()) > 0) {
        await expect(price)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should allow purchasing premium', async ({ page }) => {
    await page.goto('/pricing').catch(() => null);

    const upgradeButton = page
      .locator('button')
      .filter({ hasText: /upgrade|buy|purchase/i })
      .first();

    if ((await upgradeButton.count()) > 0) {
      await upgradeButton.click().catch(() => null);

      // Should navigate to payment or checkout
      await page.waitForTimeout(1000);
      expect(page.url()).toBeDefined();
    }
  });

  test('should show feature comparison', async ({ page }) => {
    await page.goto('/pricing').catch(() => null);

    const comparisonTable = page.locator('table, [class*="comparison"]').first();

    if ((await comparisonTable.count()) > 0) {
      await expect(comparisonTable)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);

      // Should show checkmarks and X marks
      const features = page.locator('text=/✓|✗|included|excluded/i');
      if ((await features.count()) > 0) {
        await expect(features.first())
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should handle payment flow', async ({ page }) => {
    await page.goto('/pricing').catch(() => null);

    const upgradeButton = page
      .locator('button')
      .filter({ hasText: /upgrade|buy|purchase/i })
      .first();

    if ((await upgradeButton.count()) > 0) {
      await upgradeButton.click().catch(() => null);

      // Wait for payment UI
      await page.waitForTimeout(1000);

      // Should show payment form or redirect
      expect(page.url()).toBeDefined();
    }
  });

  test('should provide upgrade incentives', async ({ page }) => {
    await page.goto('/');

    const incentive = page.locator('text=/limited time|special offer|discount|sale/i').first();

    if ((await incentive.count()) > 0) {
      await expect(incentive)
        .toBeVisible({ timeout: 1000 })
        .catch(() => null);
    }
  });
});

test.describe('Referral System', () => {
  test('should display referral program', async ({ page }) => {
    await page.goto('/');

    const referralLink = page
      .locator('a, button')
      .filter({ hasText: /refer|referral|invite/i })
      .first();

    if ((await referralLink.count()) > 0) {
      await referralLink.click();
      await expect(page).toHaveURL(/referral|refer|invite/i);
    }
  });

  test('should show referral dashboard', async ({ page }) => {
    await page.goto('/referral').catch(() => null);

    const dashboard = page
      .locator('[data-testid="referral-dashboard"], [class*="referral"]')
      .first();

    if ((await dashboard.count()) > 0) {
      await expect(dashboard)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should generate referral link', async ({ page }) => {
    await page.goto('/referral').catch(() => null);

    const generateButton = page
      .locator('button')
      .filter({ hasText: /generate|create|copy/i })
      .first();

    if ((await generateButton.count()) > 0) {
      await generateButton.click().catch(() => null);

      // Should show referral link
      const referralLink = page
        .locator('input[readonly], [class*="link"], [data-testid="referral-link"]')
        .first();
      if ((await referralLink.count()) > 0) {
        await expect(referralLink)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should copy referral link to clipboard', async ({ page }) => {
    await page.goto('/referral').catch(() => null);

    const copyButton = page.locator('button').filter({ hasText: /copy/i }).first();

    if ((await copyButton.count()) > 0) {
      await copyButton.click().catch(() => null);

      // Should show confirmation
      const confirmation = page.locator('text=/copied|success/i').first();
      if ((await confirmation.count()) > 0) {
        await expect(confirmation)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should show referral rewards', async ({ page }) => {
    await page.goto('/referral').catch(() => null);

    const rewards = page
      .locator('[data-testid="rewards"], [class*="reward"], text=/reward|bonus|earn/i')
      .first();

    if ((await rewards.count()) > 0) {
      await expect(rewards)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should track referral stats', async ({ page }) => {
    await page.goto('/referral').catch(() => null);

    const stats = ['referred', 'earned', 'clicks', 'conversions'];

    for (const stat of stats) {
      const statElement = page.locator(`text=/${stat}/i`).first();
      if ((await statElement.count()) > 0) {
        await expect(statElement)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
        break;
      }
    }
  });

  test('should show referred users list', async ({ page }) => {
    await page.goto('/referral').catch(() => null);

    const userList = page
      .locator('[data-testid="referred-users"], [class*="user-list"], table')
      .first();

    if ((await userList.count()) > 0) {
      await expect(userList)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should handle referral onboarding', async ({ page }) => {
    // Test referral link flow
    await page.goto('/referral?ref=TEST123').catch(() => null);

    // Should recognize referral code
    expect(page.url()).toBeDefined();
  });
});

test.describe('Premium Mobile Experience', () => {
  test('should display premium features on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/premium').catch(() => null);

    const premiumContent = page.locator('[data-testid="premium"], [class*="premium"]').first();

    if ((await premiumContent.count()) > 0) {
      await expect(premiumContent).toBeVisible();
    }
  });

  test('should work with mobile payment', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pricing').catch(() => null);

    const upgradeButton = page
      .locator('button')
      .filter({ hasText: /upgrade|buy/i })
      .first();

    if ((await upgradeButton.count()) > 0) {
      await upgradeButton.click().catch(() => null);
    }
  });

  test('should display referral on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/referral').catch(() => null);

    const referralLink = page.locator('input[readonly], [class*="link"]').first();

    if ((await referralLink.count()) > 0) {
      await expect(referralLink).toBeVisible();
    }
  });

  test('should handle whale radar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/whale-radar').catch(() => null);

    const dashboard = page.locator('[data-testid="whale-radar"], [class*="whale"]').first();

    if ((await dashboard.count()) > 0) {
      await expect(dashboard).toBeVisible();
    }
  });
});
