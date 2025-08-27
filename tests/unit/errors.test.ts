import { 
  BizAgentError, 
  ApiError, 
  MailjetError, 
  GoogleCalendarError,
  DatabaseError,
  ValidationError,
  RateLimitError,
  BusinessLogicError,
  CompanyBlacklistedError,
  DuplicateEmailError,
  NetworkError,
  TimeoutError,
  ErrorHandler,
  RetryHandler,
  CircuitBreaker,
  errorHandler
} from '@/utils/errors.js';

// Mock logger
jest.mock('@/utils/logger.js', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe('Error Classes', () => {
  describe('BizAgentError', () => {
    it('should create base error with correct properties', () => {
      const error = new BizAgentError('Test error', 'TEST_ERROR', 400, true, false);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('BizAgentError');
    });
  });

  describe('ApiError', () => {
    it('should create API error with default values', () => {
      const error = new ApiError('API error');
      
      expect(error.message).toBe('API error');
      expect(error.code).toBe('API_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should create API error with custom values', () => {
      const error = new ApiError('API error', 'CUSTOM_ERROR', 404, false);
      
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.statusCode).toBe(404);
      expect(error.retryable).toBe(false);
    });
  });

  describe('MailjetError', () => {
    it('should create Mailjet error', () => {
      const error = new MailjetError('Mailjet error', 500);
      
      expect(error.message).toBe('Mailjet error');
      expect(error.code).toBe('MAILJET_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should set retryable to false for 4xx errors', () => {
      const error = new MailjetError('Mailjet error', 400);
      
      expect(error.retryable).toBe(false);
    });
  });

  describe('GoogleCalendarError', () => {
    it('should create Google Calendar error', () => {
      const error = new GoogleCalendarError('Calendar error', 500);
      
      expect(error.message).toBe('Calendar error');
      expect(error.code).toBe('GOOGLE_CALENDAR_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });
  });

  describe('DatabaseError', () => {
    it('should create database error', () => {
      const error = new DatabaseError('Database error', true);
      
      expect(error.message).toBe('Database error');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Validation error', 'email');
      
      expect(error.message).toBe('Validation error');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.field).toBe('email');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('BusinessLogicError', () => {
    it('should create business logic error', () => {
      const error = new BusinessLogicError('Business error', 'BUSINESS_ERROR');
      
      expect(error.message).toBe('Business error');
      expect(error.code).toBe('BUSINESS_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
    });
  });

  describe('CompanyBlacklistedError', () => {
    it('should create company blacklisted error', () => {
      const error = new CompanyBlacklistedError('Test Company');
      
      expect(error.message).toBe('Company Test Company is blacklisted');
      expect(error.code).toBe('COMPANY_BLACKLISTED');
    });
  });

  describe('DuplicateEmailError', () => {
    it('should create duplicate email error', () => {
      const error = new DuplicateEmailError('test@example.com');
      
      expect(error.message).toBe('Email test@example.com already sent');
      expect(error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Network error', true);
      
      expect(error.message).toBe('Network error');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('API call', 5000);
      
      expect(error.message).toBe('API call timed out after 5000ms');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });
  });
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    // Reset error counts
    (errorHandler as any).errorCounts.clear();
  });

  describe('handleError', () => {
    it('should handle BizAgentError correctly', () => {
      const error = new BizAgentError('Test error', 'TEST_ERROR');
      
      errorHandler.handleError(error);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle regular Error correctly', () => {
      const error = new Error('Regular error');
      
      errorHandler.handleError(error);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle error with context', () => {
      const error = new BizAgentError('Test error', 'TEST_ERROR');
      const context = { userId: '123', action: 'test' };
      
      errorHandler.handleError(error, context);
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', () => {
      const error1 = new BizAgentError('Error 1', 'ERROR_1');
      const error2 = new BizAgentError('Error 2', 'ERROR_2');
      
      errorHandler.handleError(error1);
      errorHandler.handleError(error2);
      errorHandler.handleError(error1); // Same error type
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.ERROR_1).toBe(2);
      expect(stats.ERROR_2).toBe(1);
    });
  });

  describe('resetErrorCounts', () => {
    it('should reset error counts', () => {
      const error = new BizAgentError('Test error', 'TEST_ERROR');
      
      errorHandler.handleError(error);
      expect(errorHandler.getErrorStats().TEST_ERROR).toBe(1);
      
      errorHandler.resetErrorCounts();
      expect(errorHandler.getErrorStats().TEST_ERROR).toBeUndefined();
    });
  });
});

describe('RetryHandler', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await RetryHandler.withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue('success');
      
      const result = await RetryHandler.withRetry(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(RetryHandler.withRetry(operation, 2, 10)).rejects.toThrow('Persistent error');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new BizAgentError('Non-retryable', 'TEST_ERROR', 400, true, false);
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(RetryHandler.withRetry(operation)).rejects.toThrow('Non-retryable');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(2, 1000);
  });

  describe('execute', () => {
    it('should execute successful operation', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should open circuit after failure threshold', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failure'));
      
      // First failure
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      // Second failure - should open circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should reject when circuit is open', async () => {
      // Open the circuit first
      const operation = jest.fn().mockRejectedValue(new Error('Failure'));
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
      
      // Try to execute when circuit is open
      const successOperation = jest.fn().mockResolvedValue('success');
      await expect(circuitBreaker.execute(successOperation)).rejects.toThrow('Circuit breaker is OPEN');
      
      expect(successOperation).not.toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('getFailures', () => {
    it('should return failure count', () => {
      expect(circuitBreaker.getFailures()).toBe(0);
    });
  });
});
