/**
 * 📁 File Upload Validation for DegenScore
 *
 * Comprehensive validation for user-uploaded files
 * Security features:
 * - File type validation (MIME type + extension)
 * - File size limits
 * - Image dimension validation
 * - Malicious file detection
 */

import { logger } from './logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 2000;
const MAX_IMAGE_HEIGHT = 2000;
const MIN_IMAGE_WIDTH = 100;
const MIN_IMAGE_HEIGHT = 100;

// ============================================================================
// TYPES
// ============================================================================

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: {
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    extension: string;
  };
}

export interface ImageDimensions {
  width: number;
  height: number;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export async function validateUploadedFile(file: File): Promise<FileValidationResult> {
  try {
    logger.debug('Starting file validation', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // 1. Check file size
    if (!validateFileSize(file.size)) {
      logger.warn('File size validation failed', { size: file.size });
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // 2. Check file extension
    const extension = getFileExtension(file.name);
    if (!validateFileExtension(extension)) {
      logger.warn('File extension validation failed', { extension });
      return {
        isValid: false,
        error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    // 3. Check MIME type
    if (!validateMimeType(file.type)) {
      logger.warn('MIME type validation failed', { mimeType: file.type });
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      };
    }

    // 4. Validate image dimensions
    let dimensions: ImageDimensions | null = null;
    try {
      dimensions = await getImageDimensions(file);
      if (!validateImageDimensions(dimensions)) {
        logger.warn('Image dimension validation failed', dimensions);
        return {
          isValid: false,
          error: `Image dimensions must be between ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} and ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT} pixels`,
        };
      }
    } catch (error) {
      logger.error('Failed to get image dimensions', error as Error);
      return {
        isValid: false,
        error: 'Failed to process image. File may be corrupted.',
      };
    }

    // 5. Check for malicious content (basic check)
    const isSafe = await checkFileSignature(file);
    if (!isSafe) {
      logger.warn('Malicious file detected', { name: file.name });
      return {
        isValid: false,
        error: 'File failed security check. Please upload a valid image file.',
      };
    }

    logger.info('File validation successful', {
      name: file.name,
      size: file.size,
      dimensions,
    });

    return {
      isValid: true,
      metadata: {
        mimeType: file.type,
        size: file.size,
        width: dimensions?.width,
        height: dimensions?.height,
        extension,
      },
    };
  } catch (error) {
    logger.error('File validation error', error as Error);
    return {
      isValid: false,
      error: 'An error occurred during file validation',
    };
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate file size
 */
function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Validate file extension
 */
function validateFileExtension(extension: string): boolean {
  return ALLOWED_EXTENSIONS.includes(extension as any);
}

/**
 * Validate MIME type
 */
function validateMimeType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType as any);
}

/**
 * Validate image dimensions
 */
function validateImageDimensions(dimensions: ImageDimensions): boolean {
  return (
    dimensions.width >= MIN_IMAGE_WIDTH &&
    dimensions.width <= MAX_IMAGE_WIDTH &&
    dimensions.height >= MIN_IMAGE_HEIGHT &&
    dimensions.height <= MAX_IMAGE_HEIGHT
  );
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const extension = filename.toLowerCase().match(/\.[^.]*$/);
  return extension ? extension[0] : '';
}

/**
 * Get image dimensions
 */
function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Check file signature (magic bytes)
 * Validates that the file is actually an image based on its header
 */
async function checkFileSignature(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check for common image file signatures
    const signatures: { [key: string]: number[] } = {
      jpeg: [0xff, 0xd8, 0xff],
      png: [0x89, 0x50, 0x4e, 0x47],
      gif: [0x47, 0x49, 0x46, 0x38],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF
    };

    // Check if file starts with any known image signature
    for (const [format, signature] of Object.entries(signatures)) {
      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        logger.debug('File signature validated', { format });
        return true;
      }
    }

    logger.warn('File signature validation failed - no matching signature found');
    return false;
  } catch (error) {
    logger.error('Error checking file signature', error as Error);
    return false;
  }
}

// ============================================================================
// SERVER-SIDE VALIDATION (for API routes)
// ============================================================================

export interface ServerFileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export function validateUploadedFileServer(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  options: ServerFileValidationOptions = {}
): FileValidationResult {
  const maxSize = options.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || ALLOWED_IMAGE_TYPES;

  // Validate size
  if (fileBuffer.length > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    };
  }

  // Validate extension
  const extension = getFileExtension(filename);
  if (!ALLOWED_EXTENSIONS.includes(extension as any)) {
    return {
      isValid: false,
      error: 'Invalid file extension',
    };
  }

  // Validate MIME type
  if (!allowedTypes.includes(mimeType as any)) {
    return {
      isValid: false,
      error: 'Invalid file type',
    };
  }

  // Check file signature
  const signature = checkBufferSignature(fileBuffer);
  if (!signature.isValid) {
    return {
      isValid: false,
      error: 'File signature validation failed',
    };
  }

  return {
    isValid: true,
    metadata: {
      mimeType,
      size: fileBuffer.length,
      extension,
    },
  };
}

/**
 * Check buffer signature for server-side validation
 */
function checkBufferSignature(buffer: Buffer): { isValid: boolean; type?: string } {
  const signatures: { [key: string]: number[] } = {
    jpeg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47],
    gif: [0x47, 0x49, 0x46, 0x38],
    webp: [0x52, 0x49, 0x46, 0x46],
  };

  for (const [type, signature] of Object.entries(signatures)) {
    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return { isValid: true, type };
    }
  }

  return { isValid: false };
}

// Export constants for external use
export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: MAX_FILE_SIZE,
  MAX_WIDTH: MAX_IMAGE_WIDTH,
  MAX_HEIGHT: MAX_IMAGE_HEIGHT,
  MIN_WIDTH: MIN_IMAGE_WIDTH,
  MIN_HEIGHT: MIN_IMAGE_HEIGHT,
  ALLOWED_TYPES: ALLOWED_IMAGE_TYPES,
  ALLOWED_EXTENSIONS,
} as const;
