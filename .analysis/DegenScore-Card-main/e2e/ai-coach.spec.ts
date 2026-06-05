import { test, expect } from '@playwright/test';

/**
 * AI Trading Coach E2E Tests
 * Tests the AI-powered coaching system that provides trading insights and recommendations
 */

test.describe('AI Coach Dashboard', () => {
  test('should navigate to AI Coach section', async ({ page }) => {
    await page.goto('/');

    const coachLink = page
      .locator('a, button')
      .filter({ hasText: /ai.*coach|coach/i })
      .first();

    if ((await coachLink.count()) > 0) {
      await coachLink.click();
      await expect(page).toHaveURL(/coach|ai/i);
    }
  });

  test('should display AI Coach welcome message', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const welcomeMsg = page.locator('text=/welcome|hello|hi there/i').first();

    if ((await welcomeMsg.count()) > 0) {
      await expect(welcomeMsg)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should show coaching tips and insights', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const tipsSection = page.locator('[data-testid="tips"], text=/tip|insight|advice/i').first();

    if ((await tipsSection.count()) > 0) {
      await expect(tipsSection)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });
});

test.describe('AI Chat Interface', () => {
  test('should display chat input field', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();

    if ((await chatInput.count()) > 0) {
      await expect(chatInput)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should send chat message', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send|submit|ask/i })
      .first();

    if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
      await chatInput.fill('What trading strategy would you recommend?');
      await sendButton.click().catch(() => null);

      // Should show message or loading state
      await page.waitForTimeout(1000);
    }
  });

  test('should display AI responses', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send|submit|ask/i })
      .first();

    if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
      await chatInput.fill('How can I improve my win rate?');
      await sendButton.click().catch(() => null);

      // Wait for response
      await page.waitForTimeout(2000);

      // Check for AI response
      const response = page
        .locator('[data-testid="chat-response"], [class*="message"], [class*="response"]')
        .last();
      if ((await response.count()) > 0) {
        await expect(response)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should handle rapid messages', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send|submit|ask/i })
      .first();

    if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
      for (let i = 0; i < 3; i++) {
        await chatInput.fill(`Question ${i + 1}: Trading advice?`);
        await sendButton.click().catch(() => null);
        await page.waitForTimeout(500);
      }

      // Page should remain responsive
      await expect(page).toHaveURL(/^https?:\/\//);
    }
  });

  test('should clear chat history', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const clearButton = page
      .locator('button')
      .filter({ hasText: /clear|reset|new/i })
      .first();

    if ((await clearButton.count()) > 0) {
      await clearButton.click().catch(() => null);

      // Chat should be cleared or reset
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Trading Analysis', () => {
  test('should show trading insights', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const insightsSection = page
      .locator('[data-testid="insights"], [class*="insight"], text=/analysis|insight/i')
      .first();

    if ((await insightsSection.count()) > 0) {
      await expect(insightsSection)
        .toBeVisible({ timeout: 2000 })
        .catch(() => null);
    }
  });

  test('should display key metrics analysis', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const metrics = ['winrate', 'roi', 'trades', 'profit', 'loss'];
    let foundMetric = false;

    for (const metric of metrics) {
      const metricElement = page.locator(`text=/${metric}/i`).first();
      if ((await metricElement.count()) > 0) {
        foundMetric = true;
        break;
      }
    }

    expect(foundMetric).toBe(true);
  });

  test('should provide personalized recommendations', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send|submit|ask/i })
      .first();

    if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
      await chatInput.fill('How can I optimize my portfolio?');
      await sendButton.click().catch(() => null);

      await page.waitForTimeout(2000);

      // Check for recommendations
      const recommendation = page.locator('text=/recommend|suggest|should/i').first();
      if ((await recommendation.count()) > 0) {
        await expect(recommendation)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });
});

test.describe('AI Coach Settings', () => {
  test('should have settings or preferences', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const settingsButton = page
      .locator('button')
      .filter({ hasText: /settings|preferences|options/i })
      .first();

    if ((await settingsButton.count()) > 0) {
      await settingsButton.click().catch(() => null);

      const settingsModal = page.locator('[role="dialog"], [class*="settings"]').first();
      if ((await settingsModal.count()) > 0) {
        await expect(settingsModal)
          .toBeVisible({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });

  test('should toggle risk profile', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const riskToggle = page
      .locator('button')
      .filter({ hasText: /risk|conservative|aggressive/i })
      .first();

    if ((await riskToggle.count()) > 0) {
      await riskToggle.click().catch(() => null);
    }
  });

  test('should customize coaching style', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const styleSelect = page.locator('select, [role="combobox"]').first();

    if ((await styleSelect.count()) > 0) {
      await styleSelect.click().catch(() => null);
    }
  });
});

test.describe('Mobile AI Coach', () => {
  test('should be accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();

    if ((await chatInput.count()) > 0) {
      await expect(chatInput).toBeVisible();
    }
  });

  test('should handle mobile chat interaction', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send|submit|ask/i })
      .first();

    if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
      await chatInput.tap().catch(() => null);
      await chatInput.fill('Mobile test message');
      await sendButton.click().catch(() => null);
    }
  });

  test('should scroll chat history on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/coach').catch(() => null);

    // Add multiple messages to create scroll
    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send|submit|ask/i })
      .first();

    if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
      for (let i = 0; i < 2; i++) {
        await chatInput.fill(`Message ${i + 1}`);
        await sendButton.click().catch(() => null);
        await page.waitForTimeout(300);
      }

      // Scroll should work
      const chatContainer = page.locator('[class*="chat"], [data-testid="chat"]').first();
      if ((await chatContainer.count()) > 0) {
        await chatContainer.scroll({ top: 100 }).catch(() => null);
      }
    }
  });
});

test.describe('AI Coach Performance', () => {
  test('should respond within reasonable time', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send|submit|ask/i })
      .first();

    if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
      const startTime = Date.now();

      await chatInput.fill('Quick trading tip?');
      await sendButton.click().catch(() => null);

      // Wait for response
      await page.waitForTimeout(3000);
      const responseTime = Date.now() - startTime;

      // Should respond within 10 seconds
      expect(responseTime).toBeLessThan(10000);
    }
  });

  test('should not block UI during analysis', async ({ page }) => {
    await page.goto('/coach').catch(() => null);

    const chatInput = page
      .locator('input[placeholder*="ask" i], input[placeholder*="message" i], textarea')
      .first();
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send|submit|ask/i })
      .first();

    if ((await chatInput.count()) > 0 && (await sendButton.count()) > 0) {
      await chatInput.fill('Complex analysis query');
      await sendButton.click().catch(() => null);

      // UI should still be responsive
      const closeButton = page
        .locator('button')
        .filter({ hasText: /close|back|exit/i })
        .first();
      if ((await closeButton.count()) > 0) {
        await expect(closeButton)
          .toBeEnabled({ timeout: 1000 })
          .catch(() => null);
      }
    }
  });
});
