import { BizAgentCron } from '@/cron/run.js';

// Mock dependencies
jest.mock('@/config/index.js', () => ({
  config: {
    app: {
      cronSchedule: '*/10 * * * *',
      nodeEnv: 'test',
    },
  },
}));

jest.mock('@/utils/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/utils/errors.js', () => ({
  errorHandler: {
    handleError: jest.fn(),
  },
}));

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

describe('BizAgentCron', () => {
  let cronJob: BizAgentCron;

  beforeEach(() => {
    jest.clearAllMocks();
    cronJob = new BizAgentCron();
  });

  describe('constructor', () => {
    it('should create cron job instance', () => {
      expect(cronJob).toBeDefined();
    });
  });

  describe('start', () => {
    it('should start cron job successfully', () => {
      const mockSchedule = require('node-cron').schedule;
      
      cronJob.start();
      
      expect(mockSchedule).toHaveBeenCalledWith(
        '*/10 * * * *',
        expect.any(Function),
        {
          scheduled: true,
          timezone: 'Europe/Bratislava',
        }
      );
    });
  });

  describe('getStatus', () => {
    it('should return status information', () => {
      const status = cronJob.getStatus();
      
      expect(status).toEqual({
        isRunning: false,
        runCount: 0,
        lastRunTime: null,
        schedule: '*/10 * * * *',
        environment: 'test',
      });
    });
  });

  describe('runJob', () => {
    it('should execute job successfully', async () => {
      // Access private method for testing
      const runJob = (cronJob as any).runJob.bind(cronJob);
      
      await runJob();
      
      expect(cronJob.getStatus().runCount).toBe(1);
      expect(cronJob.getStatus().lastRunTime).toBeInstanceOf(Date);
    });

    it('should skip execution if already running', async () => {
      // Set running state
      (cronJob as any).isRunning = true;
      
      const runJob = (cronJob as any).runJob.bind(cronJob);
      
      await runJob();
      
      // Should not increment run count
      expect(cronJob.getStatus().runCount).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      // Mock executePipeline to throw error
      jest.spyOn(cronJob as any, 'executePipeline').mockRejectedValue(new Error('Test error'));
      
      const runJob = (cronJob as any).runJob.bind(cronJob);
      
      await runJob();
      
      // Should still increment run count and set last run time
      expect(cronJob.getStatus().runCount).toBe(1);
      expect(cronJob.getStatus().lastRunTime).toBeInstanceOf(Date);
    });
  });

  describe('executePipeline', () => {
    it('should execute pipeline steps', async () => {
      const executePipeline = (cronJob as any).executePipeline.bind(cronJob);
      
      await executePipeline();
      
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('graceful shutdown', () => {
    it('should setup graceful shutdown handlers', () => {
      const setupGracefulShutdown = (cronJob as any).setupGracefulShutdown.bind(cronJob);
      
      // Mock process.on
      const mockOn = jest.fn();
      const originalOn = process.on;
      process.on = mockOn;
      
      setupGracefulShutdown();
      
      expect(mockOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      
      // Restore original
      process.on = originalOn;
    });
  });
});
