import { config } from '@/config/index.js';

describe('Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.DATABASE_URL;
    delete process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_API_SECRET;
    delete process.env.MAILJET_SENDER_EMAIL;
    delete process.env.MAILJET_SENDER_NAME;
    delete process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH;
  });

  describe('Database configuration', () => {
    it('should validate database URL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      
      expect(() => {
        require('@/config/index.js');
      }).not.toThrow();
    });

    it('should throw error for invalid database URL', () => {
      process.env.DATABASE_URL = 'invalid-url';
      
      expect(() => {
        require('@/config/index.js');
      }).toThrow('Invalid configuration');
    });
  });

  describe('Mailjet configuration', () => {
    it('should validate required Mailjet fields', () => {
      process.env.MAILJET_API_KEY = 'test-key';
      process.env.MAILJET_API_SECRET = 'test-secret';
      process.env.MAILJET_SENDER_EMAIL = 'test@example.com';
      process.env.MAILJET_SENDER_NAME = 'Test Sender';
      
      expect(() => {
        require('@/config/index.js');
      }).not.toThrow();
    });

    it('should throw error for missing Mailjet API key', () => {
      process.env.MAILJET_API_SECRET = 'test-secret';
      process.env.MAILJET_SENDER_EMAIL = 'test@example.com';
      process.env.MAILJET_SENDER_NAME = 'Test Sender';
      
      expect(() => {
        require('@/config/index.js');
      }).toThrow('Invalid configuration');
    });
  });

  describe('Rate limiting configuration', () => {
    it('should use default values when not provided', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MAILJET_API_KEY = 'test-key';
      process.env.MAILJET_API_SECRET = 'test-secret';
      process.env.MAILJET_SENDER_EMAIL = 'test@example.com';
      process.env.MAILJET_SENDER_NAME = 'Test Sender';
      process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH = './credentials.json';
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
      process.env.JWT_SECRET = 'test-secret';
      
      const config = require('@/config/index.js').config;
      
      expect(config.rateLimiting.maxEmailsPerHour).toBe(6);
      expect(config.rateLimiting.maxRequestsPerMinute).toBe(10);
      expect(config.rateLimiting.emailDelaySeconds).toBe(600);
    });

    it('should use provided values', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MAILJET_API_KEY = 'test-key';
      process.env.MAILJET_API_SECRET = 'test-secret';
      process.env.MAILJET_SENDER_EMAIL = 'test@example.com';
      process.env.MAILJET_SENDER_NAME = 'Test Sender';
      process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH = './credentials.json';
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
      process.env.JWT_SECRET = 'test-secret';
      process.env.MAX_EMAILS_PER_HOUR = '10';
      process.env.MAX_REQUESTS_PER_MINUTE = '20';
      process.env.EMAIL_DELAY_SECONDS = '300';
      
      const config = require('@/config/index.js').config;
      
      expect(config.rateLimiting.maxEmailsPerHour).toBe(10);
      expect(config.rateLimiting.maxRequestsPerMinute).toBe(20);
      expect(config.rateLimiting.emailDelaySeconds).toBe(300);
    });
  });

  describe('Logging configuration', () => {
    it('should use default logging values', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MAILJET_API_KEY = 'test-key';
      process.env.MAILJET_API_SECRET = 'test-secret';
      process.env.MAILJET_SENDER_EMAIL = 'test@example.com';
      process.env.MAILJET_SENDER_NAME = 'Test Sender';
      process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH = './credentials.json';
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
      process.env.JWT_SECRET = 'test-secret';
      
      const config = require('@/config/index.js').config;
      
      expect(config.logging.level).toBe('info');
      expect(config.logging.file).toBe('logs/biz-agent.log');
      expect(config.logging.maxSize).toBe('10m');
      expect(config.logging.maxFiles).toBe(5);
    });
  });

  describe('App configuration', () => {
    it('should use default app values', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MAILJET_API_KEY = 'test-key';
      process.env.MAILJET_API_SECRET = 'test-secret';
      process.env.MAILJET_SENDER_EMAIL = 'test@example.com';
      process.env.MAILJET_SENDER_NAME = 'Test Sender';
      process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH = './credentials.json';
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
      process.env.JWT_SECRET = 'test-secret';
      
      const config = require('@/config/index.js').config;
      
      expect(config.app.nodeEnv).toBe('development');
      expect(config.app.port).toBe(3000);
      expect(config.app.cronSchedule).toBe('*/10 * * * *');
      expect(config.app.debugMode).toBe(false);
      expect(config.app.skipRateLimiting).toBe(false);
    });

    it('should parse boolean values correctly', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MAILJET_API_KEY = 'test-key';
      process.env.MAILJET_API_SECRET = 'test-secret';
      process.env.MAILJET_SENDER_EMAIL = 'test@example.com';
      process.env.MAILJET_SENDER_NAME = 'Test Sender';
      process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH = './credentials.json';
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
      process.env.JWT_SECRET = 'test-secret';
      process.env.DEBUG_MODE = 'true';
      process.env.SKIP_RATE_LIMITING = 'true';
      
      const config = require('@/config/index.js').config;
      
      expect(config.app.debugMode).toBe(true);
      expect(config.app.skipRateLimiting).toBe(true);
    });
  });
});
