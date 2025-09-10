#!/usr/bin/env node

import { config } from './config/index.js';
import logger from './utils/logger.js';
import { BizAgentCron } from './cron/run.js';

class BizAgentApp {
  private cron: BizAgentCron;

  constructor() {
    this.cron = new BizAgentCron();
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting Biz-Agent application...', {
        environment: config.app.nodeEnv,
        version: '1.0.0',
        cronSchedule: '0 2 * * *',
      });

      // Start cron job
      await this.cron.start();

      logger.info('Biz-Agent application started successfully');

      // Handle graceful shutdown
      process.on('SIGINT', this.handleShutdown.bind(this));
      process.on('SIGTERM', this.handleShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start Biz-Agent application', { error });
      process.exit(1);
    }
  }

  private async handleShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    try {
      await this.cron.stop();
      logger.info('Biz-Agent application stopped successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }
}

// Start application if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new BizAgentApp();
  app.start().catch((error) => {
    logger.error('Unhandled error in application', { error });
    process.exit(1);
  });
}

export { BizAgentApp };
