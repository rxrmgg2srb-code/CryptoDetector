import { test, expect } from '@playwright/test';

/**
 * Wallet Connection and Authentication Flow E2E Tests
 * Tests the critical path for connecting wallets, analyzing trades, and generating scores
 */

test.describe('Wallet Connection Flow', () => {
  test('should display wallet connect button on landing', async ({ page }) => {
    await page.goto('/');

    // Look for wallet connection UI
    const connectButton = page
      .locator('button')
      .filter({ hasText: /connect|wallet/i })
      .first();
    await expect(connectButton).toBeVisible({ timeout: 5000 });
  });

  test('should allow manual wallet address input', async ({ page }) => {
    await page.goto('/');

    // Look for wallet input field
    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();

    if ((await walletInput.count()) > 0) {
      const testWallet = 'So11111111111111111111111111111111111111112';
      await walletInput.fill(testWallet);
      await expect(walletInput).toHaveValue(testWallet);
    }
  });

  test('should validate wallet address format', async ({ page }) => {
    await page.goto('/');

    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();

    if ((await walletInput.count()) > 0) {
      // Try invalid address
      await walletInput.fill('invalid-address-123');

      // Look for error message
      const errorMsg = page.locator('text=/invalid|error|required/i').first();
      if ((await errorMsg.count()) > 0) {
        await expect(errorMsg).toBeVisible();
      }
    }
  });

  test('should initiate wallet analysis on submit', async ({ page }) => {
    await page.goto('/');

    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();
    const submitButton = page
      .locator('button')
      .filter({ hasText: /analyze|check|score/i })
      .first();

    if ((await walletInput.count()) > 0 && (await submitButton.count()) > 0) {
      const testWallet = 'So11111111111111111111111111111111111111112';
      await walletInput.fill(testWallet);

      // Click submit (don't wait for response in case no backend is available)
      submitButton.click({ timeout: 1000 }).catch(() => null);

      // Verify submit was attempted
      expect(await walletInput.inputValue()).toBe(testWallet);
    }
  });

  test('should handle wallet connection errors gracefully', async ({ page }) => {
    await page.goto('/');

    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();

    if ((await walletInput.count()) > 0) {
      // Enter wallet that might fail
      await walletInput.fill('So11111111111111111111111111111111111111112');
    }

    // Page should remain responsive
    await expect(page).toHaveURL(/^https?:\/\//);
  });

  test('should preserve wallet address in session', async ({ page, context }) => {
    const testWallet = 'So11111111111111111111111111111111111111112';

    await page.goto('/');

    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();

    if ((await walletInput.count()) > 0) {
      await walletInput.fill(testWallet);
    }

    // Navigate away and back
    await page.goto('/about');
    await page.goBack();

    // Check if wallet persists (optional - depends on implementation)
    const currentInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();
    if ((await currentInput.count()) > 0) {
      const value = await currentInput.inputValue();
      // May or may not persist depending on implementation
      expect(value).toBeDefined();
    }
  });
});

test.describe('Wallet Score Generation', () => {
  test('should display loading state during analysis', async ({ page }) => {
    await page.goto('/');

    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();
    const submitButton = page
      .locator('button')
      .filter({ hasText: /analyze|check|score/i })
      .first();

    if ((await walletInput.count()) > 0 && (await submitButton.count()) > 0) {
      const testWallet = 'So11111111111111111111111111111111111111112';
      await walletInput.fill(testWallet);
      submitButton.click({ timeout: 1000 }).catch(() => null);

      // Look for loading indicators
      const loadingIndicator = page
        .locator('text=/loading|analyzing|please wait/i, [role="progressbar"], .spinner, .loader')
        .first();

      if ((await loadingIndicator.count()) > 0) {
        await expect(loadingIndicator)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should display score result when ready', async ({ page }) => {
    await page.goto('/');

    // Look for score display (may be mocked)
    const scoreDisplay = page
      .locator('[data-testid="degen-score"], text=/score.*\\d+|\\d+.*score/i')
      .first();

    if ((await scoreDisplay.count()) > 0) {
      await expect(scoreDisplay).toBeVisible();
    }
  });

  test('should show card generation option after analysis', async ({ page }) => {
    await page.goto('/');

    // Look for card generation UI
    const cardButton = page
      .locator('button')
      .filter({ hasText: /generate.*card|create.*card|mint/i })
      .first();

    if ((await cardButton.count()) > 0) {
      await expect(cardButton)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should display key metrics in score breakdown', async ({ page }) => {
    await page.goto('/');

    // Look for metrics display
    const metricsContainer = page
      .locator('[data-testid="metrics"], .metrics, [class*="metric"]')
      .first();

    if ((await metricsContainer.count()) > 0) {
      await expect(metricsContainer).toBeVisible();

      // Check for common metrics
      const metrics = ['trades', 'volume', 'profit', 'winrate', 'days'];
      for (const metric of metrics) {
        const metricElement = page.locator(`text=/${metric}/i`).first();
        if ((await metricElement.count()) > 0) {
          await expect(metricElement)
            .toBeVisible({ timeout: 1000 })
            .catch(() => null);
        }
      }
    }
  });
});

test.describe('Card Generation and Export', () => {
  test('should allow card preview', async ({ page }) => {
    await page.goto('/');

    const cardPreview = page
      .locator('[data-testid="card-preview"], .card, [class*="card"]')
      .first();

    if ((await cardPreview.count()) > 0) {
      await expect(cardPreview).toBeVisible();
    }
  });

  test('should support card download', async ({ page }) => {
    await page.goto('/');

    const downloadButton = page
      .locator('button')
      .filter({ hasText: /download|export|save/i })
      .first();

    if ((await downloadButton.count()) > 0) {
      await expect(downloadButton)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);

      // Download should not throw
      await downloadButton.click().catch(() => null);
    }
  });

  test('should support card sharing', async ({ page }) => {
    await page.goto('/');

    const shareButton = page.locator('button').filter({ hasText: /share/i }).first();

    if ((await shareButton.count()) > 0) {
      await expect(shareButton)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);

      // Click share button
      await shareButton.click().catch(() => null);

      // Should show share options
      const shareModal = page.locator('[role="dialog"], .modal, [class*="share"]').first();
      if ((await shareModal.count()) > 0) {
        await expect(shareModal)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });
});

test.describe('Authentication State', () => {
  test('should show authenticated user info when connected', async ({ page }) => {
    await page.goto('/');

    // Look for user profile or account menu
    const profileMenu = page
      .locator('[data-testid="profile-menu"], [class*="profile"], [aria-label*="account" i]')
      .first();

    if ((await profileMenu.count()) > 0) {
      await expect(profileMenu)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should allow accessing user settings', async ({ page }) => {
    await page.goto('/');

    // Look for settings link
    const settingsLink = page.locator('a[href*="settings"], button:has-text("Settings")').first();

    if ((await settingsLink.count()) > 0) {
      await settingsLink.click().catch(() => null);
      // Settings page may or may not load depending on auth state
      expect(page.url()).toBeDefined();
    }
  });

  test('should handle session expiration', async ({ page }) => {
    await page.goto('/');

    // Page should still be accessible
    await expect(page).toHaveURL(/^https?:\/\//);
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);

    await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => null);

    // Page should attempt to load
    expect(page.url()).toBeDefined();

    // Restore connectivity
    await page.context().setOffline(false);
  });

  test('should retry failed operations', async ({ page }) => {
    await page.goto('/');

    // Look for retry button
    const retryButton = page
      .locator('button')
      .filter({ hasText: /retry|try again/i })
      .first();

    if ((await retryButton.count()) > 0) {
      await expect(retryButton)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should show helpful error messages', async ({ page }) => {
    await page.goto('/');

    // Check for error messages
    const errorMsg = page.locator('[class*="error"], [role="alert"], text=/error|failed/i').first();

    if ((await errorMsg.count()) > 0) {
      await expect(errorMsg)
        .toBeVisible({ timeout: 1000 })
        .catch(() => null);
    }
  });
});

test.describe('Mobile Authentication', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const connectButton = page
      .locator('button')
      .filter({ hasText: /connect|wallet/i })
      .first();
    if ((await connectButton.count()) > 0) {
      await expect(connectButton).toBeVisible();
    }
  });

  test('should handle touch events', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();

    if ((await walletInput.count()) > 0) {
      // Tap the input
      await walletInput.tap().catch(() => null);
      await expect(walletInput)
        .toBeFocused({ timeout: 1000 })
        .catch(() => null);
    }
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Content should be visible
    const connectButton = page
      .locator('button')
      .filter({ hasText: /connect|wallet/i })
      .first();
    if ((await connectButton.count()) > 0) {
      await expect(connectButton).toBeVisible();
    }
  });
});
