/**
 * Sanitization utilities to prevent XSS attacks
 * Simple server-side implementation without DOMPurify/jsdom
 */

/**
 * Sanitize a string by removing HTML tags, script tags, null bytes, and trimming.
 * Returns an empty string for null/undefined or non‑string inputs.
 */
export function sanitizeString(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  // Remove script tags and their content
  let sanitized = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  // Trim whitespace
  return sanitized.trim();
}

/**
 * Sanitize HTML content to plain text.
 * Strips all tags (including script tags) and returns the cleaned text.
 */
export function sanitizeHTML(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  // Remove script tags first
  let sanitized = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Strip all remaining HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  return sanitized.trim();
}

/**
 * Sanitize URL (ensure it's a valid http/https URL or a relative path).
 * Returns an empty string for invalid URLs.
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  // Allow relative URLs that start with '/'
  if (url.startsWith('/')) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Recursively sanitize input objects/arrays.
 * Strings are passed through `sanitizeString`.
 */
export function sanitizeInput<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(input as any)) {
      result[key] = sanitizeInput(value);
    }
    return result;
  }
  if (typeof input === 'string') {
    return sanitizeString(input) as unknown as T;
  }
  // numbers, booleans, null, undefined are returned unchanged
  return input;
}

// Backwards‑compatible aliases for existing codebase
export const sanitizeHtml = sanitizeHTML;
export const sanitizeText = sanitizeString;
export const sanitizeDisplayName = (name: string) => {
  const cleaned = sanitizeString(name);
  return cleaned.length > 50 ? cleaned.substring(0, 50) : cleaned;
};
export const sanitizeUrl = sanitizeURL;
export const sanitizeSocialHandle = (handle: string) => {
  if (!handle) {
    return '';
  }
  let sanitized = handle.replace(/^@/, '');
  sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');
  return sanitized.length > 30 ? sanitized.slice(0, 30) : sanitized;
};
export const sanitizePromoCode = (code: string) => {
  if (!code) {
    return '';
  }
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

// ============================================================================
// LOG SANITIZATION (Sensitive Data Redaction)
// ============================================================================

/**
 * ✅ SECURITY: Redact wallet address (show only first 4 and last 4 characters)
 */
export function redactWallet(wallet: string): string {
  if (!wallet || typeof wallet !== 'string') {
    return '[invalid]';
  }

  if (wallet.length < 12) {
    return '[redacted]';
  }

  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

/**
 * ✅ SECURITY: Redact transaction signature (show only first 8 characters)
 */
export function redactSignature(signature: string): string {
  if (!signature || typeof signature !== 'string') {
    return '[invalid]';
  }

  if (signature.length < 16) {
    return '[redacted]';
  }

  return `${signature.slice(0, 8)}...`;
}

/**
 * ✅ SECURITY: Redact email address (show only domain)
 */
export function redactEmail(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '[redacted]';
  }

  const [, domain] = email.split('@');
  return `***@${domain}`;
}

/**
 * ✅ SECURITY: Redact JWT token (show only first 8 characters)
 */
export function redactToken(token: string): string {
  if (!token || typeof token !== 'string') {
    return '[invalid]';
  }

  if (token.length < 16) {
    return '[redacted]';
  }

  return `${token.slice(0, 8)}...`;
}

/**
 * ✅ SECURITY: Redact nonce (show only first 8 characters)
 */
export function redactNonce(nonce: string): string {
  if (!nonce || typeof nonce !== 'string') {
    return '[invalid]';
  }

  if (nonce.length < 10) {
    return '[redacted]';
  }

  return `${nonce.slice(0, 8)}...`;
}

/**
 * ✅ SECURITY: Sanitize amount (round to 4 decimals, add SOL suffix)
 */
export function sanitizeAmount(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '[invalid]';
  }

  return `${amount.toFixed(4)} SOL`;
}

/**
 * ✅ SECURITY: Sanitize object for logging (redacts common sensitive fields)
 */
export function sanitizeForLog(obj: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'walletAddress',
    'publicKey',
    'signature',
    'paymentSignature',
    'token',
    'sessionToken',
    'jwt',
    'nonce',
    'email',
    'privateKey',
    'secret',
    'password',
    'apiKey',
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive information
    const isSensitive = sensitiveKeys.some((sensitive) =>
      lowerKey.includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      if (typeof value === 'string') {
        if (lowerKey.includes('wallet') || lowerKey.includes('publickey')) {
          sanitized[key] = redactWallet(value);
        } else if (lowerKey.includes('signature')) {
          sanitized[key] = redactSignature(value);
        } else if (lowerKey.includes('email')) {
          sanitized[key] = redactEmail(value);
        } else if (lowerKey.includes('token') || lowerKey.includes('jwt')) {
          sanitized[key] = redactToken(value);
        } else if (lowerKey.includes('nonce')) {
          sanitized[key] = redactNonce(value);
        } else {
          sanitized[key] = '[redacted]';
        }
      } else {
        sanitized[key] = '[redacted]';
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * ✅ SECURITY: Sanitize error message (generic message for production)
 */
export function sanitizeError(
  error: Error | unknown,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): string {
  if (isDevelopment) {
    return error instanceof Error ? error.message : String(error);
  }

  // Return generic message in production
  return 'An error occurred';
}
