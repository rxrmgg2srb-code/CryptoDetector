/**
 * 📝 Professional Logging System for DegenScore
 *
 * Replaces console.log with structured logging
 * Environment-aware (development vs production)
 * Multiple log levels: debug, info, warn, error
 * Automatic error tracking with Sentry integration
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Debug logs - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Info logs - general information
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warning logs - potential issues
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error logs - critical issues (also sent to Sentry)
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, { ...context, error: error?.message, stack: error?.stack });

    // Send to Sentry in production
    if (this.isProduction && typeof window !== 'undefined') {
      // @ts-expect-error - Sentry global injected at runtime
      if (window.Sentry) {
        // @ts-expect-error - Sentry global injected at runtime
        window.Sentry.captureException(error || new Error(message), {
          tags: context,
        });
      }
    }
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...(context && { context }),
    };

    // In development: pretty print to console
    if (this.isDevelopment) {
      const emoji = this.getLevelEmoji(level);
      const color = this.getLevelColor(level);

      console.log(
        `${emoji} [${timestamp}] ${color}${level.toUpperCase()}${this.getResetColor()}: ${message}`,
        context ? context : ''
      );
    } else {
      // In production: structured JSON logs
      console.log(JSON.stringify(logData));
    }
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return emojis[level];
  }

  /**
   * Get ANSI color code for log level
   */
  private getLevelColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };
    return colors[level];
  }

  /**
   * Reset ANSI color
   */
  private getResetColor(): string {
    return '\x1b[0m';
  }

  /**
   * Measure execution time of a function
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`⏱️ Starting: ${label}`);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`✅ Completed: ${label}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`❌ Failed: ${label}`, error as Error, { duration: `${duration}ms` });
      throw error;
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }
}

/**
 * Child logger with inherited context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, additionalContext?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: LogContext): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, error?: Error, additionalContext?: LogContext): void {
    this.parent.error(message, error, { ...this.context, ...additionalContext });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogContext };
