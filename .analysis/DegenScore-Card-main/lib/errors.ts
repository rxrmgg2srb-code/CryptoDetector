/**
 * Enhanced Error Classes for DegenScore
 *
 * Custom error types with proper TypeScript support
 */

export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Base error class for application-specific errors
 */
export class AppError extends Error {
  public readonly errorCode: string;
  public readonly statusCode: number;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;

  constructor(
    message: string,
    errorCode: string,
    statusCode: number = 500,
    context?: ErrorContext
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * API-related errors
 */
export class APIError extends AppError {
  constructor(message: string, statusCode: number = 500, context?: ErrorContext) {
    super(message, 'API_ERROR', statusCode, context);
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'DATABASE_ERROR', 500, context);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'AUTHENTICATION_ERROR', 401, context);
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
  }
}

/**
 * Wallet-related errors
 */
export class InvalidWalletAddressError extends AppError {
  constructor(address: string) {
    super('Invalid wallet address', 'INVALID_ADDRESS', 400, { address });
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, context);
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(`${resource} not found${identifier ? `: ${identifier}` : ''}`, 'NOT_FOUND', 404, {
      resource,
      identifier,
    });
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: ErrorContext) {
    super(`External service error (${service}): ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, {
      service,
      ...context,
    });
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'CONFIGURATION_ERROR', 500, context);
  }
}

/**
 * Helper function to determine if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper function to safely extract error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Helper function to safely extract error code
 */
export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.errorCode;
  }
  return 'UNKNOWN_ERROR';
}
