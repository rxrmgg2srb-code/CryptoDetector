import { Page, Browser, BrowserContext } from '@playwright/test';

/**
 * Playwright E2E Helper Functions
 * Provides utilities for authentication, wallet stubbing, and common flows
 */

/**
 * Authenticate by setting session token
 */
export async function authenticateUser(page: Page, walletAddress: string, token?: string) {
  // Set authentication cookie or localStorage
  await page.context().addCookies([
    {
      name: 'auth_token',
      value: token || 'test-token-' + Date.now(),
      url: page.url(),
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    },
  ]);

  // Also set wallet in localStorage
  await page.evaluate(
    ([wallet]) => {
      localStorage.setItem('wallet_address', wallet);
      localStorage.setItem('is_authenticated', 'true');
    },
    [walletAddress]
  );

  return token || 'test-token-' + Date.now();
}

/**
 * Clear authentication
 */
export async function clearAuthentication(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Stub Solana wallet API
 */
export async function stubSolanaWallet(page: Page, walletAddress: string) {
  await page.addInitScript(
    ([wallet]) => {
      // Stub Phantom wallet
      (window as any).solana = {
        isPhantom: true,
        isConnected: true,
        publicKey: {
          toString: () => wallet,
        },
        connect: async () => ({
          publicKey: {
            toString: () => wallet,
          },
        }),
        disconnect: async () => {},
        signMessage: async () => ({ signature: new Uint8Array(64) }),
        signAndSendTransaction: async (tx: any) => ({ signature: 'test-signature' }),
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any[]) => txs,
        on: () => {},
        off: () => {},
      };
    },
    [walletAddress]
  );
}

/**
 * Mock Helius API responses for wallet analysis
 */
export async function mockHeliusApi(page: Page, walletAddress: string) {
  await page.route('**/api/helius/**', async (route) => {
    const url = route.request().url();

    // Mock different endpoints
    if (url.includes('/tokens')) {
      await route.abort();
      return;
    }

    // Mock transactions endpoint
    if (url.includes('/transactions')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          transactions: [
            {
              signature: 'test-sig-1',
              timestamp: Date.now() / 1000,
              type: 'TRADE',
              source: 'Magic Eden',
              amount: 1.5,
            },
          ],
        }),
      });
      return;
    }

    // Mock token balance endpoint
    if (url.includes('/balance')) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          totalLamports: 50000000,
          tokens: [
            {
              mint: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
              amount: '1000000',
              decimals: 6,
            },
          ],
        }),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * Mock card generation API
 */
export async function mockCardGenerationApi(page: Page) {
  await page.route('**/api/generate-card', async (route) => {
    const request = route.request();

    if (request.method() === 'POST') {
      // Return base64 encoded PNG (1x1 transparent pixel)
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(pngBase64, 'base64'),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * Mock AI Coach API
 */
export async function mockAICoachApi(page: Page) {
  await page.route('**/api/ai-coach', async (route) => {
    const request = route.request();

    if (request.method() === 'POST') {
      const body = await request.postDataJSON();
      const message = body.message || '';

      let response = 'I am your AI trading coach. How can I help you?';

      if (message.toLowerCase().includes('strategy')) {
        response =
          'Based on your trading patterns, I recommend a dollar-cost averaging strategy with proper position sizing.';
      } else if (message.toLowerCase().includes('risk')) {
        response =
          'Your risk profile shows moderate risk tolerance. Consider using stop-losses on 30% of your positions.';
      } else if (message.toLowerCase().includes('improve')) {
        response =
          'To improve your performance, focus on: 1) Consistent risk management, 2) Diversification, 3) Tracking your trades.';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: response,
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * Mock Whale Radar API
 */
export async function mockWhaleRadarApi(page: Page) {
  await page.route('**/api/whale-radar/**', async (route) => {
    const request = route.request();
    const url = request.url();

    if (url.includes('/tracked')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          wallets: [
            {
              address: '9B5X4b3KZt9R1qEb8fN7qWp2aZ3vM8kL5pQ6tJ9sX',
              alias: 'Whale1',
              totalVolume: 50000000,
              trades24h: 15,
              lastTrade: Date.now(),
            },
            {
              address: '7aB9cD2eF4gH6iJ8kL0mN2pQ4rS6tU8vW0xY2zC',
              alias: 'Whale2',
              totalVolume: 30000000,
              trades24h: 8,
              lastTrade: Date.now() - 3600000,
            },
          ],
        }),
      });
      return;
    }

    if (url.includes('/trades')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trades: [
            {
              signature: 'sig-1',
              wallet: '9B5X4b3KZt9R1qEb8fN7qWp2aZ3vM8kL5pQ6tJ9sX',
              token: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
              amount: 1000,
              price: 0.5,
              timestamp: Date.now(),
            },
          ],
        }),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * Mock referral API
 */
export async function mockReferralApi(page: Page) {
  await page.route('**/api/referral/**', async (route) => {
    const request = route.request();
    const url = request.url();

    if (url.includes('/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          referred: 5,
          earned: 150,
          clicks: 25,
          conversions: 5,
        }),
      });
      return;
    }

    if (url.includes('/link')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          link: 'https://degenscore.com/?ref=USER123',
          code: 'USER123',
        }),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * Mock payment/checkout API
 */
export async function mockPaymentApi(page: Page) {
  await page.route('**/api/payment/**', async (route) => {
    const request = route.request();

    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          transactionId: 'txn-' + Date.now(),
          status: 'completed',
        }),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * Setup all common mocks
 */
export async function setupAllMocks(page: Page, walletAddress: string) {
  await mockHeliusApi(page, walletAddress);
  await mockCardGenerationApi(page);
  await mockAICoachApi(page);
  await mockWhaleRadarApi(page);
  await mockReferralApi(page);
  await mockPaymentApi(page);
  await stubSolanaWallet(page, walletAddress);
}

/**
 * Navigate to page and wait for ready
 */
export async function goToPageReady(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return page;
}

/**
 * Wait for element to be visible and interactive
 */
export async function waitForElementInteractive(page: Page, selector: string, timeout = 5000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.waitFor({ state: 'attached', timeout });
  return element;
}

/**
 * Fill form field safely
 */
export async function fillFormField(page: Page, selector: string, value: string) {
  const input = page.locator(selector);
  await input.clear();
  await input.fill(value);
  return input;
}

/**
 * Take screenshot for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `e2e/artifacts/${name}-${timestamp}.png`;

  // Create artifacts directory if it doesn't exist
  try {
    await page.screenshot({ path: filename });
  } catch (e) {
    console.warn(`Failed to save screenshot: ${filename}`);
  }
}

/**
 * Record video for debugging (use in test context)
 */
export async function recordTestVideo(page: Page, testName: string) {
  const context = page.context();
  return {
    start: () => {
      // Video is already recording if configured in playwright.config
    },
    stop: async () => {
      // Video is automatically saved when context closes
    },
  };
}

/**
 * Common test data
 */
export const testData = {
  wallets: {
    trader1: 'So11111111111111111111111111111111111111112',
    trader2: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
    whale: '9B5X4b3KZt9R1qEb8fN7qWp2aZ3vM8kL5pQ6tJ9sX',
  },
  tokens: {
    usdc: 'EPjFWaLb3ufEi6Q8w3sqJ2Yt8hVPMvj8cNh3RCTV9v4T',
    usdt: 'Es9vMFrzaCERmJfqV3CA6Ad8K4e6BW1kt67rR7AwtTs',
    raydium: '4k3Dyjzvzp8eMZWUUbX8HRk1Jmutm5LvMeL3z8zKX39',
  },
  users: {
    premiumUser: {
      email: 'premium@test.com',
      password: 'TestPass123!',
    },
    basicUser: {
      email: 'basic@test.com',
      password: 'TestPass123!',
    },
  },
};

/**
 * Simulate network delay
 */
export async function simulateNetworkDelay(page: Page, delayMs: number) {
  await page.route('**/*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Simulate network error
 */
export async function simulateNetworkError(page: Page, errorPattern: string) {
  await page.route(errorPattern, async (route) => {
    await route.abort('failed');
  });
}

/**
 * Get console messages during test
 */
export async function captureConsoleLogs(page: Page) {
  const logs: any[] = [];

  page.on('console', (msg) => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  return logs;
}

/**
 * Wait for specific console message
 */
export async function waitForConsoleMessage(page: Page, pattern: RegExp, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timeout waiting for console message')),
      timeout
    );

    const handler = (msg: any) => {
      if (pattern.test(msg.text())) {
        clearTimeout(timer);
        page.removeListener('console', handler);
        resolve(msg);
      }
    };

    page.on('console', handler);
  });
}
