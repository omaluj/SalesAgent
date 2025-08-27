import logger, { logError, logWarn, logInfo, logDebug, logPerformance, logApiCall, logEmailSent, logCalendarEvent } from '@/utils/logger.js';

// Mock winston
jest.mock('winston', () => {
  const mockLogger: any = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => mockLogger),
  };
  
  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      printf: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  dirname: jest.fn(() => 'logs'),
  join: jest.fn((...args) => args.join('/')),
}));

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger instance', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined();
    });
  });

  describe('Log methods', () => {
    it('should call logError with correct parameters', () => {
      const error = new Error('Test error');
      const meta = { test: 'data' };
      
      logError('Test error message', error, meta);
      
      expect(logger.error).toHaveBeenCalledWith('Test error message', {
        error: 'Test error',
        stack: error.stack,
        test: 'data',
      });
    });

    it('should call logWarn with correct parameters', () => {
      const meta = { test: 'data' };
      
      logWarn('Test warning message', meta);
      
      expect(logger.warn).toHaveBeenCalledWith('Test warning message', meta);
    });

    it('should call logInfo with correct parameters', () => {
      const meta = { test: 'data' };
      
      logInfo('Test info message', meta);
      
      expect(logger.info).toHaveBeenCalledWith('Test info message', meta);
    });

    it('should call logDebug with correct parameters', () => {
      const meta = { test: 'data' };
      
      logDebug('Test debug message', meta);
      
      expect(logger.debug).toHaveBeenCalledWith('Test debug message', meta);
    });
  });

  describe('Performance logging', () => {
    it('should log performance metrics', () => {
      const operation = 'test-operation';
      const duration = 150;
      const meta = { test: 'data' };
      
      logPerformance(operation, duration, meta);
      
      expect(logger.info).toHaveBeenCalledWith('Performance: test-operation', {
        duration: '150ms',
        operation: 'test-operation',
        test: 'data',
      });
    });
  });

  describe('API logging', () => {
    it('should log successful API calls as info', () => {
      const method = 'GET';
      const url = 'https://api.example.com/test';
      const statusCode = 200;
      const duration = 100;
      
      logApiCall(method, url, statusCode, duration);
      
      expect(logger.info).toHaveBeenCalledWith('API Call: GET https://api.example.com/test', {
        method: 'GET',
        url: 'https://api.example.com/test',
        statusCode: 200,
        duration: '100ms',
      });
    });

    it('should log failed API calls as warn', () => {
      const method = 'POST';
      const url = 'https://api.example.com/test';
      const statusCode = 500;
      const duration = 200;
      
      logApiCall(method, url, statusCode, duration);
      
      expect(logger.warn).toHaveBeenCalledWith('API Call: POST https://api.example.com/test', {
        method: 'POST',
        url: 'https://api.example.com/test',
        statusCode: 500,
        duration: '200ms',
      });
    });
  });

  describe('Email logging', () => {
    it('should log successful email as info', () => {
      const to = 'test@example.com';
      const template = 'welcome-template';
      const success = true;
      const meta = { test: 'data' };
      
      logEmailSent(to, template, success, meta);
      
      expect(logger.info).toHaveBeenCalledWith('Email sent: welcome-template', {
        to: 'test@example.com',
        template: 'welcome-template',
        success: true,
        test: 'data',
      });
    });

    it('should log failed email as error', () => {
      const to = 'test@example.com';
      const template = 'welcome-template';
      const success = false;
      const meta = { test: 'data' };
      
      logEmailSent(to, template, success, meta);
      
      expect(logger.error).toHaveBeenCalledWith('Email failed: welcome-template', {
        to: 'test@example.com',
        template: 'welcome-template',
        success: false,
        test: 'data',
      });
    });
  });

  describe('Calendar logging', () => {
    it('should log calendar events', () => {
      const action = 'created' as const;
      const eventId = 'event-123';
      const meta = { test: 'data' };
      
      logCalendarEvent(action, eventId, meta);
      
      expect(logger.info).toHaveBeenCalledWith('Calendar event created', {
        action: 'created',
        eventId: 'event-123',
        test: 'data',
      });
    });
  });

  describe('Request ID logging', () => {
    it('should create child logger with request ID', () => {
      const requestId = 'req-123';
      
      const childLogger = logger.child({ requestId });
      
      expect(logger.child).toHaveBeenCalledWith({ requestId });
      expect(childLogger).toBe(logger);
    });
  });
});
