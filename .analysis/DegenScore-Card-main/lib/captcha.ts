/**
 * ✅ SECURITY: CAPTCHA Verification using hCaptcha
 *
 * Protects public endpoints from bot abuse:
 * - /api/like
 * - /api/generate-card
 * - /api/auth/challenge
 * - /api/follows/add
 */

import { logger } from './logger';

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET;
const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify';
const CAPTCHA_ENABLED = process.env.CAPTCHA_ENABLED === 'true';

/**
 * Verify hCaptcha token
 */
export async function verifyCaptcha(token: string, remoteIP?: string): Promise<boolean> {
  // If CAPTCHA is disabled (development), skip verification
  if (!CAPTCHA_ENABLED) {
    logger.debug('CAPTCHA verification skipped (disabled)');
    return true;
  }

  if (!HCAPTCHA_SECRET) {
    logger.error('HCAPTCHA_SECRET not configured');
    // Fail secure - require CAPTCHA if enabled but not configured
    return false;
  }

  if (!token) {
    logger.warn('CAPTCHA token missing');
    return false;
  }

  try {
    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET,
        response: token,
        ...(remoteIP && { remoteip: remoteIP }),
      }).toString(),
    });

    if (!response.ok) {
      logger.error('hCaptcha API request failed', undefined, {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    const data = await response.json();

    if (data.success) {
      logger.debug('CAPTCHA verification successful', {
        hostname: data.hostname,
        challenge_ts: data.challenge_ts,
      });
      return true;
    }

    // Log error codes for debugging
    logger.warn('CAPTCHA verification failed', {
      errorCodes: data['error-codes'],
    });

    return false;
  } catch (error) {
    logger.error('CAPTCHA verification error', error as Error);
    // Fail secure - deny on error
    return false;
  }
}

/**
 * Middleware to require CAPTCHA verification
 *
 * Usage:
 * ```ts
 * import { requireCaptcha } from '@/lib/captcha';
 *
 * export default async function handler(req, res) {
 *   if (!await requireCaptcha(req, res)) return;
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireCaptcha(req: any, res: any): Promise<boolean> {
  const captchaToken = req.body?.captchaToken || req.query?.captchaToken;

  if (!captchaToken && CAPTCHA_ENABLED) {
    logger.warn('CAPTCHA token required but not provided');
    res.status(400).json({
      error: 'CAPTCHA verification required',
      code: 'CAPTCHA_REQUIRED',
    });
    return false;
  }

  // Get client IP for verification
  const remoteIP =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    undefined;

  const verified = await verifyCaptcha(captchaToken, remoteIP);

  if (!verified) {
    res.status(403).json({
      error: 'CAPTCHA verification failed',
      code: 'CAPTCHA_FAILED',
    });
    return false;
  }

  return true;
}

/**
 * Optional CAPTCHA middleware (doesn't block if CAPTCHA disabled)
 */
export async function optionalCaptcha(req: any, res: any): Promise<boolean> {
  if (!CAPTCHA_ENABLED) {
    return true;
  }

  return requireCaptcha(req, res);
}

/**
 * Check if CAPTCHA is enabled
 */
export function isCaptchaEnabled(): boolean {
  return CAPTCHA_ENABLED;
}
