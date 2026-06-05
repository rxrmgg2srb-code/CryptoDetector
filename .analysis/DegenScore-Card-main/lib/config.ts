import { logger } from '@/lib/logger';

/**
 * Centralized configuration for the application
 * Validates and exports all environment variables
 */

// Payment configuration
export const PAYMENT_CONFIG = {
  MINT_PRICE_SOL: parseFloat(process.env.NEXT_PUBLIC_MINT_PRICE_SOL || '0.0001'), // Testing: 0.0001 SOL
  TREASURY_WALLET:
    process.env.NEXT_PUBLIC_TREASURY_WALLET || 'Pf9yHR1qmkY9geMLfMJs7JD4yXZURkiaxm5h7K61J7N',
  // Use HELIUS_RPC_URL as primary, fallback to SOLANA_NETWORK for backwards compatibility
  SOLANA_NETWORK:
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
    'https://api.mainnet-beta.solana.com',
} as const;

// API configuration
export const API_CONFIG = {
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
  CRON_API_KEY: process.env.CRON_API_KEY || '',
} as const;

// Upload configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// ❌ R2 Storage DISABLED - Images stored as base64 in database
// R2 Storage configuration (Cloudflare R2 - S3 compatible) - DISABLED
// export const R2_CONFIG = {
//   ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
//   ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
//   SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
//   BUCKET_NAME: process.env.R2_BUCKET_NAME || 'degenscore-images',
//   PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
// } as const;

// Rate limiting configuration - Optimized for 100+ concurrent users
export const RATE_LIMIT_CONFIG = {
  // Normal operations: 200 requests per 15 minutes
  WINDOW_MS: 15 * 60 * 1000,
  MAX_REQUESTS: 200,

  // Expensive operations (analyze, generate-card): 10 per minute per user
  STRICT_WINDOW_MS: 60 * 1000,
  STRICT_MAX_REQUESTS: 10,

  // Payment operations: 20 per 5 minutes
  PAYMENT_WINDOW_MS: 5 * 60 * 1000,
  PAYMENT_MAX_REQUESTS: 20,
} as const;

// Tier configuration
export const TIER_CONFIG = {
  tiers: [
    { name: 'Plankton', min: 0, max: 30, color: '#94a3b8', emoji: '🦐' },
    { name: 'Fish', min: 31, max: 50, color: '#60a5fa', emoji: '🐟' },
    { name: 'Dolphin', min: 51, max: 70, color: '#34d399', emoji: '🐬' },
    { name: 'Shark', min: 71, max: 85, color: '#fbbf24', emoji: '🦈' },
    { name: 'Whale', min: 86, max: 100, color: '#f472b6', emoji: '🐋' },
  ],
} as const;

// Validation function to ensure critical env vars are set
export function validateEnv() {
  const requiredEnvVars = [
    { key: 'DATABASE_URL', value: process.env.DATABASE_URL },
    { key: 'HELIUS_API_KEY', value: process.env.HELIUS_API_KEY },
  ];

  const missing = requiredEnvVars.filter(({ value }) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map(({ key }) => key).join(', ')}`
    );
  }
}

// Validate on import (only in Node.js environment)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    validateEnv();
  } catch (error) {
    logger.error('Environment validation failed', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    // Don't throw in build time to allow builds to complete
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Running with missing environment variables');
    }
  }
}
