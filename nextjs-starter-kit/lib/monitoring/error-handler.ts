/**
 * Centralized Error Handler for LangSet MVP API Routes
 * Provides consistent error responses and comprehensive logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, createRequestContext, ErrorContext } from './error-logger';
import { ZodError } from 'zod';

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  INTERNAL = 'internal',
  BUSINESS_LOGIC = 'business_logic'
}

export interface ApiError extends Error {
  type: ErrorType;
  statusCode: number;
  userMessage: string;
  context?: Record<string, any>;
  isOperational?: boolean;
}

/**
 * Create a standardized API error
 */
export function createApiError(
  type: ErrorType,
  message: string,
  userMessage: string,
  statusCode: number = 500,
  context?: Record<string, any>
): ApiError {
  const error = new Error(message) as ApiError;
  error.type = type;
  error.statusCode = statusCode;
  error.userMessage = userMessage;
  error.context = context;
  error.isOperational = true;
  return error;
}

/**
 * Pre-defined error creators for common scenarios
 */
export const Errors = {
  validation: (message: string, details?: any) =>
    createApiError(
      ErrorType.VALIDATION,
      `Validation failed: ${message}`,
      'Please check your input and try again',
      400,
      { details }
    ),

  authentication: (message: string = 'Authentication required') =>
    createApiError(
      ErrorType.AUTHENTICATION,
      message,
      'Please log in to access this resource',
      401
    ),

  authorization: (message: string = 'Insufficient permissions') =>
    createApiError(
      ErrorType.AUTHORIZATION,
      message,
      'You do not have permission to access this resource',
      403
    ),

  notFound: (resource: string = 'Resource') =>
    createApiError(
      ErrorType.NOT_FOUND,
      `${resource} not found`,
      `The requested ${resource.toLowerCase()} could not be found`,
      404
    ),

  rateLimit: (resetTime?: number) =>
    createApiError(
      ErrorType.RATE_LIMIT,
      'Rate limit exceeded',
      'Too many requests. Please try again later.',
      429,
      { resetTime }
    ),

  externalService: (service: string, originalError?: Error) =>
    createApiError(
      ErrorType.EXTERNAL_SERVICE,
      `External service error: ${service}`,
      'A required service is temporarily unavailable. Please try again later.',
      502,
      { service, originalError: originalError?.message }
    ),

  database: (operation: string, originalError?: Error) =>
    createApiError(
      ErrorType.DATABASE,
      `Database error during ${operation}`,
      'A database error occurred. Please try again.',
      500,
      { operation, originalError: originalError?.message }
    ),

  businessLogic: (message: string, userMessage: string, context?: Record<string, any>) =>
    createApiError(
      ErrorType.BUSINESS_LOGIC,
      message,
      userMessage,
      400,
      context
    ),

  internal: (message: string = 'Internal server error', originalError?: Error) =>
    createApiError(
      ErrorType.INTERNAL,
      message,
      'An unexpected error occurred. Please try again later.',
      500,
      { originalError: originalError?.message }
    )
};

/**
 * Convert various error types to ApiError
 */
function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    return Errors.validation(
      'Schema validation failed',
      error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code
      }))
    );
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('UNAUTHORIZED') || error.message.includes('Authentication')) {
      return Errors.authentication(error.message);
    }

    if (error.message.includes('FORBIDDEN') || error.message.includes('Permission')) {
      return Errors.authorization(error.message);
    }

    if (error.message.includes('NOT_FOUND') || error.message.includes('not found')) {
      return Errors.notFound();
    }

    if (error.message.includes('Rate limit') || error.message.includes('Too many requests')) {
      return Errors.rateLimit();
    }

    if (error.message.includes('Circuit breaker') || error.message.includes('Service unavailable')) {
      return Errors.externalService('External API', error);
    }

    if (error.message.includes('database') || error.message.includes('SQL')) {
      return Errors.database('operation', error);
    }

    // Default to internal error
    return Errors.internal(error.message, error);
  }

  // Unknown error type
  return Errors.internal(`Unknown error: ${String(error)}`);
}

/**
 * Main error handler for API routes
 */
export async function handleApiError(
  error: unknown,
  request: NextRequest,
  context: Partial<ErrorContext> = {}
): Promise<NextResponse> {
  const apiError = normalizeError(error);
  const requestContext = createRequestContext(request, context.userId, context.sessionId);
  
  // Log the error with full context
  await logger.error(
    `API Error: ${apiError.message}`,
    apiError,
    {
      ...requestContext,
      ...context,
      component: 'api',
      operation: 'error_handler',
      statusCode: apiError.statusCode,
      errorType: apiError.type,
      metadata: {
        isOperational: apiError.isOperational,
        context: apiError.context
      }
    }
  );

  // Prepare response
  const responseBody: any = {
    error: {
      type: apiError.type,
      message: apiError.userMessage,
      timestamp: new Date().toISOString(),
      requestId: requestContext.requestId
    }
  };

  // Add additional context in development
  if (process.env.NODE_ENV === 'development') {
    responseBody.debug = {
      originalMessage: apiError.message,
      stack: apiError.stack,
      context: apiError.context
    };
  }

  // Add specific fields for certain error types
  if (apiError.type === ErrorType.VALIDATION && apiError.context?.details) {
    responseBody.error.details = apiError.context.details;
  }

  if (apiError.type === ErrorType.RATE_LIMIT && apiError.context?.resetTime) {
    responseBody.error.retryAfter = Math.ceil((apiError.context.resetTime - Date.now()) / 1000);
  }

  return NextResponse.json(responseBody, {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestContext.requestId || 'unknown',
      ...(apiError.type === ErrorType.RATE_LIMIT && {
        'Retry-After': String(Math.ceil(60)) // Default 1 minute
      })
    }
  });
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  component?: string
): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args;
    const start = Date.now();
    
    try {
      const response = await handler(...args);
      const duration = Date.now() - start;
      
      // Log successful API calls
      await logger.logApiRequest(
        request.method,
        request.url,
        response.status,
        duration,
        {
          component: component || 'api',
          operation: handler.name || 'anonymous'
        }
      );
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Log failed API calls
      await logger.logApiRequest(
        request.method,
        request.url,
        error instanceof ApiError ? error.statusCode : 500,
        duration,
        {
          component: component || 'api',
          operation: handler.name || 'anonymous'
        }
      );
      
      return handleApiError(error, request, {
        component: component || 'api',
        operation: handler.name || 'anonymous',
        duration
      });
    }
  }) as T;
}

/**
 * Async wrapper with error handling for any function
 */
export function withAsyncErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: Partial<ErrorContext> = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const apiError = normalizeError(error);
      
      await logger.error(
        `Async operation failed: ${apiError.message}`,
        apiError,
        {
          ...context,
          component: context.component || 'unknown',
          operation: fn.name || 'anonymous'
        }
      );
      
      throw apiError;
    }
  }) as T;
}

/**
 * Global error handler for uncaught exceptions
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error: Error) => {
    await logger.fatal(
      'Uncaught Exception - Process will exit',
      error,
      {
        component: 'process',
        operation: 'uncaught_exception'
      }
    );
    
    // Give logger time to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    await logger.error(
      'Unhandled Promise Rejection',
      error,
      {
        component: 'process',
        operation: 'unhandled_rejection',
        metadata: {
          promise: promise.toString()
        }
      }
    );
  });
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      await logger.info(
        `Received ${signal} - Starting graceful shutdown`,
        {
          component: 'process',
          operation: 'shutdown'
        }
      );
      
      // Allow time for cleanup
      setTimeout(() => {
        process.exit(0);
      }, 5000);
    });
  });
}

export default {
  handleApiError,
  withErrorHandler,
  withAsyncErrorHandler,
  Errors,
  createApiError,
  setupGlobalErrorHandlers,
  setupGracefulShutdown
};