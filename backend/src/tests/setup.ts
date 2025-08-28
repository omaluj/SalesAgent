// Test setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  if (process.env.NODE_ENV === 'test') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Global test utilities
(global as any).testUtils = {
  // Helper to create test data
  createTestCompany: (overrides = {}) => ({
    name: 'Test Company',
    website: 'https://testcompany.com',
    email: 'test@testcompany.com',
    industry: 'Technology',
    size: 'medium',
    ...overrides,
  }),
  
  // Helper to create test email log
  createTestEmailLog: (overrides = {}) => ({
    to: 'test@example.com',
    subject: 'Test Email',
    template: 'test-template',
    status: 'SENT',
    ...overrides,
  }),
  
  // Helper to wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to mock API responses
  mockApiResponse: (data: any, status = 200) => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
  }),
};

// Type declarations for global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createTestCompany: (overrides?: Record<string, any>) => Record<string, any>;
        createTestEmailLog: (overrides?: Record<string, any>) => Record<string, any>;
        wait: (ms: number) => Promise<void>;
        mockApiResponse: (data: any, status?: number) => any;
      };
    }
  }
}
