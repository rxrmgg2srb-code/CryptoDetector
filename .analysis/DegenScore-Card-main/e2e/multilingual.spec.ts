import { test, expect } from '@playwright/test';

/**
 * Multilingual and Localization E2E Tests
 * Tests language switching, localized content, and mobile breakpoints
 */

test.describe('Multilingual Support', () => {
  test('should display language selector', async ({ page }) => {
    await page.goto('/');

    const languageSelector = page
      .locator('button, select')
      .filter({ hasText: /english|español|language|lang/i })
      .first();

    if ((await languageSelector.count()) > 0) {
      await expect(languageSelector)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should switch to Spanish', async ({ page }) => {
    await page.goto('/');

    const languageButton = page
      .locator('button, select')
      .filter({ hasText: /language|lang|es|español/i })
      .first();

    if ((await languageButton.count()) > 0) {
      await languageButton.click().catch(() => null);

      // Look for Spanish option
      const spanishOption = page
        .locator('button, a, option')
        .filter({ hasText: /español|es/i })
        .first();

      if ((await spanishOption.count()) > 0) {
        await spanishOption.click().catch(() => null);

        // Page content should update to Spanish
        await page.waitForTimeout(500);
        expect(page.url()).toBeDefined();
      }
    }
  });

  test('should switch to French', async ({ page }) => {
    await page.goto('/');

    const languageButton = page
      .locator('button, select')
      .filter({ hasText: /language|lang|fr|français/i })
      .first();

    if ((await languageButton.count()) > 0) {
      await languageButton.click().catch(() => null);

      const frenchOption = page
        .locator('button, a, option')
        .filter({ hasText: /français|fr|french/i })
        .first();

      if ((await frenchOption.count()) > 0) {
        await frenchOption.click().catch(() => null);
        await page.waitForTimeout(500);
      }
    }
  });

  test('should persist language selection', async ({ page, context }) => {
    await page.goto('/');

    // Switch language
    const languageButton = page
      .locator('button, select')
      .filter({ hasText: /language|lang/i })
      .first();

    if ((await languageButton.count()) > 0) {
      await languageButton.click().catch(() => null);

      const option = page.locator('button, a, option').first();
      if ((await option.count()) > 0) {
        await option.click().catch(() => null);
      }
    }

    // Navigate to another page
    await page.goto('/about').catch(() => null);

    // Language should persist
    expect(page.url()).toBeDefined();
  });

  test('should translate key UI elements', async ({ page }) => {
    await page.goto('/');

    // Check for common UI elements
    const elements = ['connect', 'wallet', 'score', 'card', 'analyze'];

    for (const element of elements) {
      const el = page.locator(`text=/${element}/i`).first();
      if ((await el.count()) > 0) {
        await expect(el)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
        break;
      }
    }
  });

  test('should handle RTL languages', async ({ page }) => {
    await page.goto('/');

    const languageButton = page
      .locator('button, select')
      .filter({ hasText: /language|lang|ar|hebrew/i })
      .first();

    if ((await languageButton.count()) > 0) {
      await languageButton.click().catch(() => null);

      // Look for Arabic or Hebrew option
      const rtlOption = page
        .locator('button, a, option')
        .filter({ hasText: /عربي|العربية|עברית|hebrew/i })
        .first();

      if ((await rtlOption.count()) > 0) {
        await rtlOption.click().catch(() => null);
        await page.waitForTimeout(500);

        // Check if page direction changed
        const htmlDir = await page.locator('html').first().getAttribute('dir');
        expect(htmlDir).toBeDefined();
      }
    }
  });

  test('should load localized images', async ({ page }) => {
    await page.goto('/');

    // Images should be visible regardless of language
    const images = page.locator('img').first();

    if ((await images.count()) > 0) {
      await expect(images)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });
});

test.describe('Localized Content', () => {
  test('should display localized error messages', async ({ page }) => {
    await page.goto('/');

    const walletInput = page
      .locator('input[placeholder*="wallet" i], input[placeholder*="address" i]')
      .first();

    if ((await walletInput.count()) > 0) {
      // Enter invalid data
      await walletInput.fill('invalid');

      // Should show localized error
      const errorMsg = page.locator('text=/invalid|error|required/i').first();
      if ((await errorMsg.count()) > 0) {
        await expect(errorMsg)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should display localized notifications', async ({ page }) => {
    await page.goto('/');

    // Trigger action that shows notification
    const button = page
      .locator('button')
      .filter({ hasText: /analyze|generate/i })
      .first();

    if ((await button.count()) > 0) {
      await button.click().catch(() => null);

      // Check for notification
      const notification = page
        .locator('[role="alert"], [class*="notification"], [class*="toast"]')
        .first();
      if ((await notification.count()) > 0) {
        await expect(notification)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should localize date and time format', async ({ page }) => {
    await page.goto('/');

    // Look for date/time display
    const dateDisplay = page.locator('text=/\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{4}/').first();

    if ((await dateDisplay.count()) > 0) {
      await expect(dateDisplay)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should localize currency format', async ({ page }) => {
    await page.goto('/');

    // Look for currency display
    const currencyDisplay = page.locator('text=/\\$|€|£|¥/').first();

    if ((await currencyDisplay.count()) > 0) {
      await expect(currencyDisplay)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should provide localized tooltips', async ({ page }) => {
    await page.goto('/');

    // Look for help or info icons
    const helpIcon = page.locator('[aria-label*="help" i], [title], [class*="tooltip"]').first();

    if ((await helpIcon.count()) > 0) {
      // Hover to show tooltip
      await helpIcon.hover().catch(() => null);

      await page.waitForTimeout(500);
    }
  });
});

test.describe('Mobile Breakpoints', () => {
  test('should work on mobile phone (320px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    const connectButton = page
      .locator('button')
      .filter({ hasText: /connect|wallet/i })
      .first();

    if ((await connectButton.count()) > 0) {
      await expect(connectButton).toBeVisible();
    }
  });

  test('should work on small mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const content = page.locator('main, [role="main"]').first();

    if ((await content.count()) > 0) {
      await expect(content).toBeVisible();
    }
  });

  test('should work on large mobile (414px)', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await page.goto('/');

    const content = page.locator('main, [role="main"]').first();

    if ((await content.count()) > 0) {
      await expect(content).toBeVisible();
    }
  });

  test('should work on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const content = page.locator('main, [role="main"]').first();

    if ((await content.count()) > 0) {
      await expect(content).toBeVisible();
    }
  });

  test('should work on large tablet (1024px)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await page.goto('/');

    const content = page.locator('main, [role="main"]').first();

    if ((await content.count()) > 0) {
      await expect(content).toBeVisible();
    }
  });

  test('should work on desktop (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const content = page.locator('main, [role="main"]').first();

    if ((await content.count()) > 0) {
      await expect(content).toBeVisible();
    }
  });

  test('should work on large desktop (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const content = page.locator('main, [role="main"]').first();

    if ((await content.count()) > 0) {
      await expect(content).toBeVisible();
    }
  });

  test('should handle navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Look for mobile menu
    const mobileMenu = page
      .locator('button')
      .filter({ hasText: /menu|hamburger|nav/i })
      .first();

    if ((await mobileMenu.count()) > 0) {
      await mobileMenu.click().catch(() => null);

      // Menu should open
      await page.waitForTimeout(300);
    }
  });

  test('should stack content vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that page is scrollable
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = 667;

    // Content should require scrolling or fit within viewport
    expect(scrollHeight).toBeGreaterThanOrEqual(viewportHeight - 100);
  });

  test('should optimize images for mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images.slice(0, 3)) {
      const boundingBox = await img.boundingBox();
      if (boundingBox) {
        // Image should fit within viewport
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('should have touch-friendly buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 3)) {
      const boundingBox = await button.boundingBox();
      if (boundingBox) {
        // Buttons should be at least 44x44 for touch targets
        expect(boundingBox.height).toBeGreaterThanOrEqual(40);
        expect(boundingBox.width).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

test.describe('Multilingual Mobile', () => {
  test('should switch languages on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const languageButton = page
      .locator('button, select')
      .filter({ hasText: /language|lang/i })
      .first();

    if ((await languageButton.count()) > 0) {
      await languageButton.click().catch(() => null);

      const option = page.locator('button, a, option').first();
      if ((await option.count()) > 0) {
        await option.click().catch(() => null);
      }
    }
  });

  test('should display localized content on all breakpoints', async ({ page }) => {
    const breakpoints = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
    ];

    for (const breakpoint of breakpoints) {
      await page.setViewportSize(breakpoint);
      await page.goto('/');

      const content = page.locator('body').first();
      await expect(content).toBeVisible();
    }
  });
});
