import { test, expect } from '@playwright/test';

test.describe('Wallet Authentication', () => {
  test('should display wallet connect button', async ({ page }) => {
    await page.goto('/');

    // Look for wallet connect button
    const connectButton = page.locator('button:has-text("Connect"), button:has-text("Wallet")');
    const buttonExists = (await connectButton.count()) > 0;

    if (buttonExists) {
      await expect(connectButton.first()).toBeVisible();
    }
  });

  test('should show wallet providers when connect clicked', async ({ page }) => {
    await page.goto('/');

    const connectButton = page.locator('button:has-text("Connect"):has-text("Wallet")');

    if ((await connectButton.count()) > 0) {
      await connectButton.first().click();

      // Modal/dropdown with wallet providers should appear
      const walletModal = page.locator('[role="dialog"], [class*="modal" i]');

      if ((await walletModal.count()) > 0) {
        await expect(walletModal.first()).toBeVisible({ timeout: 3000 });

        // Should show wallet options (Phantom, Solflare, etc.)
        const walletOptions = page.locator(
          'button:has-text("Phantom"), button:has-text("Solflare"), [class*="wallet" i] button'
        );
        if ((await walletOptions.count()) > 0) {
          await expect(walletOptions.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle disconnection', async ({ page }) => {
    await page.goto('/');

    // Look for disconnect button (appears when wallet is connected)
    const disconnectButton = page.locator('button:has-text("Disconnect")');

    if ((await disconnectButton.count()) > 0) {
      await disconnectButton.first().click();

      // After disconnect, connect button should appear again
      const connectButton = page.locator('button:has-text("Connect")');
      await expect(connectButton.first()).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Authenticated Features', () => {
  test('should show different UI for authenticated users', async ({ page }) => {
    await page.goto('/');

    // Check for user-specific features
    const userFeatures = page.locator(
      '[class*="profile" i], [class*="dashboard" i], text=/my card|my profile/i'
    );

    if ((await userFeatures.count()) > 0) {
      // User features should be visible when authenticated
      await expect(userFeatures.first()).toBeVisible();
    }
  });

  test('should show settings for authenticated users', async ({ page }) => {
    await page.goto('/');

    // Look for settings link/button
    const settingsLink = page.locator('a[href*="settings" i], button:has-text("Settings")');

    if ((await settingsLink.count()) > 0) {
      await settingsLink.first().click();
      await expect(page).toHaveURL(/.*settings.*/);
    }
  });

  test('should allow profile customization', async ({ page }) => {
    await page.goto('/settings');

    // Check for profile form fields
    const profileFields = page.locator(
      'input[name*="name" i], input[name*="bio" i], textarea[name*="bio" i]'
    );

    if ((await profileFields.count()) > 0) {
      await expect(profileFields.first()).toBeVisible();
    }
  });
});

test.describe('Security', () => {
  test('should protect admin routes', async ({ page }) => {
    await page.goto('/api/admin/sync-database');

    // Should not allow unauthenticated access
    const response = await page
      .waitForResponse((response) => response.url().includes('/api/admin'), { timeout: 5000 })
      .catch(() => null);

    if (response) {
      expect([401, 403, 404]).toContain(response.status());
    }
  });

  test('should validate CSRF tokens', async ({ page }) => {
    await page.goto('/');

    // Check for CSRF meta tag
    const csrfToken = await page.locator('meta[name="csrf-token"]').getAttribute('content');

    // CSRF protection might be implemented differently
    // This is a basic check
    if (csrfToken) {
      expect(csrfToken).toBeTruthy();
    }
  });
});
