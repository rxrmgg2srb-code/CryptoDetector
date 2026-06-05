import { PublicKey } from '@solana/web3.js';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

/**
 * Sanitizes a social media handle
 */
export function sanitizeHandle(handle: string): string {
  if (!handle) {
    return '';
  }
  return handle.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 200);
}

/**
 * Sanitizes display name
 */
export function sanitizeDisplayName(name: string): string {
  if (!name) {
    return '';
  }
  // Allow letters, numbers, spaces, and common punctuation
  return name.replace(/[^\w\s\-_.]/g, '').slice(0, 50);
}

/**
 * Validates sort field for leaderboard
 */
export const VALID_SORT_FIELDS = ['degenScore', 'totalVolume', 'winRate', 'likes'] as const;
export type SortField = (typeof VALID_SORT_FIELDS)[number];

export function isValidSortField(field: string): field is SortField {
  return VALID_SORT_FIELDS.includes(field as SortField);
}

/**
 * Validates pagination parameters
 */
export function validatePagination(page?: string | string[], limit?: string | string[]) {
  const pageNum = parseInt(typeof page === 'string' ? page : '1');
  const limitNum = parseInt(typeof limit === 'string' ? limit : '10');

  return {
    page: isNaN(pageNum) || pageNum < 1 ? 1 : Math.min(pageNum, 1000),
    limit: isNaN(limitNum) || limitNum < 1 ? 10 : Math.min(limitNum, 100),
  };
}

/**
 * Validates file types by checking magic numbers (file signatures)
 */
export const VALID_IMAGE_TYPES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
} as const;

export function getFileMagicNumbers(buffer: Buffer): number[] {
  return Array.from(buffer.slice(0, 8));
}

export function isValidImageType(buffer: Buffer, declaredType: string): boolean {
  const magic = VALID_IMAGE_TYPES[declaredType as keyof typeof VALID_IMAGE_TYPES];
  if (!magic) {
    return false;
  }

  const fileHeader = getFileMagicNumbers(buffer);
  return magic.every((byte, i) => fileHeader[i] === byte);
}

// Aliases and additional validators for tests
export const validateWalletAddress = isValidSolanaAddress;

export function validateSignature(signature: string): boolean {
  if (!signature || typeof signature !== 'string') {
    return false;
  }
  // Basic base58 check. Solana signatures are usually 87-88 chars.
  // The test uses 'A'.repeat(87) which is valid base58.
  return /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(signature);
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
