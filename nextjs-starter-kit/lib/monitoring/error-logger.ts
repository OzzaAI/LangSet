/**
 * Comprehensive Error Logging System for LangSet MVP
 * Structured logging with correlation IDs, user context, and performance metrics
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  timestamp?: Date;
  environment?: string;
  version?: string;
  component?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  error?: Error;
  context: ErrorContext;
  stack?: string;
  fingerprint?: string;
  tags?: string[];
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private readonly environment: string;
  private readonly version: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.version = process.env.APP_VERSION || '1.0.0';
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create error fingerprint for grouping similar errors
   */
  private createFingerprint(error: Error, context: ErrorContext): string {
    const components = [
      error.name,
      error.message.replace(/\d+/g, 'N'), // Replace numbers with N
      context.component || 'unknown',
      context.operation || 'unknown'
    ];
    return Buffer.from(components.join('|')).toString('base64').substr(0, 16);
  }

  /**
   * Sanitize sensitive data from context
   */
  private sanitizeContext(context: ErrorContext): ErrorContext {
    const sanitized = { ...context };
    
    // Remove or mask sensitive fields
    if (sanitized.metadata) {
      const { password, token, secret, apiKey, ...safeMeta } = sanitized.metadata;
      sanitized.metadata = safeMeta;
    }

    // Mask IP addresses in development
    if (this.environment === 'development' && sanitized.ip) {
      sanitized.ip = sanitized.ip.replace(/\d+$/, 'XXX');
    }

    return sanitized;
  }

  /**
   * Core logging method
   */
  private async log(entry: LogEntry): Promise<void> {
    const sanitizedContext = this.sanitizeContext(entry.context);
    
    const logData = {
      timestamp: new Date().toISOString(),
      level: entry.level,
      message: entry.message,
      environment: this.environment,
      version: this.version,
      context: {
        ...sanitizedContext,
        requestId: sanitizedContext.requestId || this.generateCorrelationId()
      },
      fingerprint: entry.fingerprint,
      tags: entry.tags || [],
      ...(entry.error && {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack
        }
      })
    };

    // Console logging (always)
    this.logToConsole(logData);

    // In production, send to external services
    if (this.environment === 'production') {
      await Promise.allSettled([
        this.logToFile(logData),
        this.logToExternalService(logData)
      ]);
    }
  }

  /**
   * Console logging with color coding
   */
  private logToConsole(logData: any): void {
    const colors = {
      debug: '\x1b[36m',   // Cyan
      info: '\x1b[32m',    // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      fatal: '\x1b[35m'    // Magenta
    };
    const reset = '\x1b[0m';
    const color = colors[logData.level as keyof typeof colors] || '';
    
    const prefix = `${color}[${logData.timestamp}] ${logData.level.toUpperCase()}${reset}`;
    const message = `${prefix} ${logData.message}`;
    
    console.log(message);
    
    if (logData.context) {
      console.log('Context:', JSON.stringify(logData.context, null, 2));
    }
    
    if (logData.error) {
      console.error('Error Details:', logData.error);
    }
  }

  /**
   * File logging (production)
   */
  private async logToFile(logData: any): Promise<void> {
    try {
      // In a real implementation, use a proper file logging system
      // This is a simplified version for the MVP
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      
      // Ensure log directory exists
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }
      
      const logLine = JSON.stringify(logData) + '\n';
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * External service logging (Sentry, LogRocket, etc.)
   */
  private async logToExternalService(logData: any): Promise<void> {
    try {
      // Example: Send to external logging service
      // In production, integrate with services like:
      // - Sentry for error tracking
      // - LogRocket for session replay
      // - DataDog for monitoring
      // - Splunk for log aggregation
      
      if (process.env.EXTERNAL_LOG_ENDPOINT) {
        await fetch(process.env.EXTERNAL_LOG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXTERNAL_LOG_TOKEN}`
          },
          body: JSON.stringify(logData)
        });
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Debug level logging
   */
  async debug(message: string, context: Partial<ErrorContext> = {}): Promise<void> {
    if (this.environment === 'development') {
      await this.log({
        level: LogLevel.DEBUG,
        message,
        context: { ...context, environment: this.environment, version: this.version }
      });
    }
  }

  /**
   * Info level logging
   */
  async info(message: string, context: Partial<ErrorContext> = {}): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message,
      context: { ...context, environment: this.environment, version: this.version }
    });
  }

  /**
   * Warning level logging
   */
  async warn(message: string, context: Partial<ErrorContext> = {}, error?: Error): Promise<void> {
    await this.log({
      level: LogLevel.WARN,
      message,
      error,
      context: { ...context, environment: this.environment, version: this.version },
      fingerprint: error ? this.createFingerprint(error, context) : undefined
    });
  }

  /**
   * Error level logging
   */
  async error(message: string, error: Error, context: Partial<ErrorContext> = {}): Promise<void> {
    await this.log({
      level: LogLevel.ERROR,
      message,
      error,
      context: { ...context, environment: this.environment, version: this.version },
      fingerprint: this.createFingerprint(error, context),
      tags: ['error']
    });
  }

  /**
   * Fatal level logging
   */
  async fatal(message: string, error: Error, context: Partial<ErrorContext> = {}): Promise<void> {
    await this.log({
      level: LogLevel.FATAL,
      message,
      error,
      context: { ...context, environment: this.environment, version: this.version },
      fingerprint: this.createFingerprint(error, context),
      tags: ['fatal', 'critical']
    });
  }

  /**
   * Log API request/response
   */
  async logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: Partial<ErrorContext> = {}
  ): Promise<void> {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;

    await this.log({
      level,
      message: `${method} ${url} ${statusCode} ${duration}ms`,
      context: {
        ...context,
        method,
        url,
        statusCode,
        duration,
        component: 'api',
        environment: this.environment,
        version: this.version
      },
      tags: ['api', 'request']
    });
  }

  /**
   * Log database operations
   */
  async logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    context: Partial<ErrorContext> = {},
    error?: Error
  ): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Database ${operation} on ${table} ${success ? 'succeeded' : 'failed'} (${duration}ms)`;

    await this.log({
      level,
      message,
      error,
      context: {
        ...context,
        operation,
        duration,
        component: 'database',
        metadata: { table, success },
        environment: this.environment,
        version: this.version
      },
      fingerprint: error ? this.createFingerprint(error, context) : undefined,
      tags: ['database', operation]
    });
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    event: 'login' | 'logout' | 'signup' | 'failed_login' | 'password_reset',
    userId?: string,
    context: Partial<ErrorContext> = {},
    error?: Error
  ): Promise<void> {
    const level = error ? LogLevel.ERROR : LogLevel.INFO;
    const message = `Authentication event: ${event}${userId ? ` for user ${userId}` : ''}`;

    await this.log({
      level,
      message,
      error,
      context: {
        ...context,
        userId,
        component: 'auth',
        operation: event,
        environment: this.environment,
        version: this.version
      },
      fingerprint: error ? this.createFingerprint(error, context) : undefined,
      tags: ['auth', event]
    });
  }

  /**
   * Log business events (marketplace actions, payments, etc.)
   */
  async logBusinessEvent(
    event: string,
    userId: string,
    metadata: Record<string, any> = {},
    context: Partial<ErrorContext> = {}
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message: `Business event: ${event}`,
      context: {
        ...context,
        userId,
        component: 'business',
        operation: event,
        metadata: {
          ...metadata,
          event
        },
        environment: this.environment,
        version: this.version
      },
      tags: ['business', event]
    });
  }

  /**
   * Log performance metrics
   */
  async logPerformance(
    operation: string,
    duration: number,
    context: Partial<ErrorContext> = {}
  ): Promise<void> {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    const message = `Performance: ${operation} took ${duration}ms`;

    await this.log({
      level,
      message,
      context: {
        ...context,
        operation,
        duration,
        component: 'performance',
        environment: this.environment,
        version: this.version
      },
      tags: ['performance', duration > 5000 ? 'slow' : 'normal']
    });
  }
}

// Export singleton instance
export const logger = ErrorLogger.getInstance();

/**
 * Performance monitoring decorator
 */
export function withPerformanceLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string,
  component?: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now();
    let error: Error | undefined;
    
    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      const duration = Date.now() - start;
      
      if (error) {
        await logger.error(
          `Operation ${operationName} failed after ${duration}ms`,
          error,
          { component, operation: operationName, duration }
        );
      } else {
        await logger.logPerformance(operationName, duration, { component });
      }
    }
  }) as T;
}

/**
 * Error boundary wrapper for API routes
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  component: string = 'api'
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      await logger.error(
        `Unhandled error in ${component}`,
        err,
        { 
          component,
          operation: fn.name || 'anonymous'
        }
      );
      
      throw error;
    }
  }) as T;
}

/**
 * Request context middleware helper
 */
export function createRequestContext(
  request: any,
  userId?: string,
  sessionId?: string
): Partial<ErrorContext> {
  return {
    userId,
    sessionId,
    requestId: request.headers?.get?.('x-request-id') || undefined,
    userAgent: request.headers?.get?.('user-agent') || undefined,
    ip: request.ip || 
        request.headers?.get?.('x-forwarded-for')?.split(',')[0] || 
        request.headers?.get?.('x-real-ip') || 
        'unknown',
    url: request.url,
    method: request.method
  };
}

export default logger;