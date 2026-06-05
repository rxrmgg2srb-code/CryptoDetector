import { logger } from '@/lib/logger';

// ✅ R2 CLOUDFLARE DESHABILITADO - Usando caché local en memoria/Redis
// Las imágenes se generan on-demand y se cachean en Redis o en memoria

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

/**
 * ❌ R2 Storage DISABLED - Images served from cache/on-demand
 */
export async function uploadImage(
  _key: string,
  _buffer: Buffer,
  _options: UploadOptions = {}
): Promise<string | null> {
  logger.info('✅ R2 storage disabled - images served from cache');
  return null;
}

/**
 * ❌ R2 Storage DISABLED
 */
export async function getImageUrl(_key: string, _expiresIn: number = 3600): Promise<string | null> {
  return null;
}

/**
 * ❌ R2 Storage DISABLED
 */
export async function deleteImage(_key: string): Promise<boolean> {
  return false;
}

/**
 * Generate key for card image (kept for compatibility)
 */
export function generateCardImageKey(walletAddress: string): string {
  const timestamp = Date.now();
  const prefix = walletAddress.slice(0, 8);
  const suffix = walletAddress.slice(-8);
  return `cards/${prefix}-${suffix}-${timestamp}.png`;
}

/**
 * ❌ R2 Storage DISABLED
 */
export function getPublicUrl(_key: string): string {
  return '';
}

// ✅ Storage is always DISABLED (no external storage)
export const isStorageEnabled = false;
