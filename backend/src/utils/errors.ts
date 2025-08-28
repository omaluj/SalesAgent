import logger from './logger.js';

// Base error class
export class BizAgentError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    retryable: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.retryable = retryable;

    Error.captureStackTrace(this, this.constructor);
  }
}

// API Errors
export class ApiError extends BizAgentError {
  constructor(
    message: string,
    code: string = 'API_ERROR',
    statusCode: number = 500,
    retryable: boolean = true
  ) {
    super(message, code, statusCode, true, retryable);
  }
}

export class MailjetError extends ApiError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'MAILJET_ERROR', statusCode, statusCode >= 500);
  }
}

export class GoogleCalendarError extends ApiError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'GOOGLE_CALENDAR_ERROR', statusCode, statusCode >= 500);
  }
}

export class GoogleSearchError extends ApiError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'GOOGLE_SEARCH_ERROR', statusCode, statusCode >= 500);
  }
}

// Database Errors
export class DatabaseError extends BizAgentError {
  constructor(message: string, retryable: boolean = true) {
    super(message, 'DATABASE_ERROR', 500, true, retryable);
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string) {
    super(message, true);
  }
}

// Validation Errors
export class ValidationError extends BizAgentError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, true, false);
    this.field = field;
  }

  public readonly field?: string | undefined;
}

// Rate Limiting Errors
export class RateLimitError extends BizAgentError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, true);
    this.retryAfter = retryAfter;
  }

  public readonly retryAfter?: number | undefined;
}

// Business Logic Errors
export class BusinessLogicError extends BizAgentError {
  constructor(message: string, code: string = 'BUSINESS_LOGIC_ERROR') {
    super(message, code, 400, true, false);
  }
}

export class CompanyBlacklistedError extends BusinessLogicError {
  constructor(companyName: string) {
    super(`Company ${companyName} is blacklisted`, 'COMPANY_BLACKLISTED');
  }
}

export class DuplicateEmailError extends BusinessLogicError {
  constructor(email: string) {
    super(`Email ${email} already sent`, 'DUPLICATE_EMAIL');
  }
}

// Network Errors
export class NetworkError extends BizAgentError {
  constructor(message: string, retryable: boolean = true) {
    super(message, 'NETWORK_ERROR', 500, true, retryable);
  }
}

export class TimeoutError extends NetworkError {
  constructor(operation: string, timeout: number) {
    super(`${operation} timed out after ${timeout}ms`, true);
  }
}

// Error handler
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private readonly maxErrorsPerHour = 100;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: Error | BizAgentError, context?: Record<string, any>): void {
    const bizError = error instanceof BizAgentError ? error : new BizAgentError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      true,
      false
    );

    // Log error
    logger.error(`Error occurred: ${bizError.message}`, {
      code: bizError.code,
      statusCode: bizError.statusCode,
      isOperational: bizError.isOperational,
      retryable: bizError.retryable,
      stack: bizError.stack,
      context,
    });

    // Track error count
    this.trackError(bizError.code);

    // Handle operational vs programming errors
    if (!bizError.isOperational) {
      this.handleProgrammingError(bizError);
    }
  }

  private trackError(errorCode: string): void {
    const currentCount = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, currentCount + 1);

    // Alert if too many errors
    if (currentCount + 1 >= this.maxErrorsPerHour) {
      logger.warn(`High error rate detected for ${errorCode}: ${currentCount + 1} errors per hour`);
    }
  }

  private handleProgrammingError(error: BizAgentError): void {
    logger.error('Programming error detected, application may be unstable', {
      error: error.message,
      stack: error.stack,
    });

    // In production, you might want to restart the application
    // or send an alert to the development team
  }

  public getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  public resetErrorCounts(): void {
    this.errorCounts.clear();
  }
}

// Retry mechanism
export class RetryHandler {
  public static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        const bizError = error instanceof BizAgentError ? error : null;
        
        // Don't retry if error is not retryable
        if (bizError && !bizError.retryable) {
          throw error;
        }

        // Log retry attempt
        logger.warn(`Retry attempt ${attempt}/${maxRetries} failed`, {
          context,
          error: error instanceof Error ? error.message : String(error),
          attempt,
          maxRetries,
        });

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;

        logger.info(`Waiting ${totalDelay}ms before retry`, {
          context,
          attempt,
          delay: totalDelay,
        });

        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }

    throw lastError!;
  }
}

// Circuit breaker
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeout: number = 60000
  ) {
    // Parameters are used in class methods
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker moved to HALF_OPEN state');
      } else {
        throw new BizAgentError(
          'Circuit breaker is OPEN',
          'CIRCUIT_BREAKER_OPEN',
          503,
          true,
          true
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn('Circuit breaker moved to OPEN state', {
        failures: this.failures,
        threshold: this.failureThreshold,
      });
    }
  }

  public getState(): string {
    return this.state;
  }

  public getFailures(): number {
    return this.failures;
  }
}

// Export singleton
export const errorHandler = ErrorHandler.getInstance();
