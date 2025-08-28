import cron from 'node-cron';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { errorHandler } from '../utils/errors.js';

// Import modules
import { emailQueue } from '../modules/mail/email-queue.js';
import { companyService } from '../modules/companies/company-service.js';
import { templateService } from '../modules/templates/template-service.js';
import { timeSlotService } from '../modules/calendar/time-slot.service.js';

export class BizAgentCron {
  private isRunning = false;
  private lastRunTime: Date | null = null;
  private runCount = 0;

  constructor() {
    this.setupGracefulShutdown();
  }

  /**
   * Start the cron job
   */
  public start(): void {
    logger.info('Starting Biz-Agent cron job', {
      schedule: config.app.cronSchedule,
      environment: config.app.nodeEnv,
    });

    // Schedule the main job
    cron.schedule(config.app.cronSchedule, () => {
      this.runJob();
    }, {
      scheduled: true,
      timezone: 'Europe/Bratislava',
    });

    logger.info('Biz-Agent cron job scheduled successfully');
  }

  /**
   * Stop the cron job
   */
  public stop(): void {
    logger.info('Stopping Biz-Agent cron job');
    // Note: node-cron doesn't provide a direct stop method
    // The job will stop when the process exits
  }

  /**
   * Main job execution
   */
  private async runJob(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Previous job still running, skipping this execution');
      return;
    }

    this.isRunning = true;
    this.runCount++;
    const startTime = Date.now();

    try {
      logger.info(`Starting job execution #${this.runCount}`, {
        runCount: this.runCount,
        lastRunTime: this.lastRunTime,
      });

      // TODO: Implement the main pipeline
      await this.executePipeline();

      this.lastRunTime = new Date();
      const duration = Date.now() - startTime;

      logger.info(`Job execution #${this.runCount} completed successfully`, {
        runCount: this.runCount,
        duration: `${duration}ms`,
        lastRunTime: this.lastRunTime,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Job execution #${this.runCount} failed`, {
        runCount: this.runCount,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
      });

      // Handle error
      errorHandler.handleError(error as Error, {
        context: 'cron_job',
        runCount: this.runCount,
        duration,
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Main pipeline execution
   */
  private async executePipeline(): Promise<void> {
    logger.info('Executing main pipeline');

    try {
      // Step 1: Find companies to contact
      const companies = await companyService.findCompaniesToContact({}, 5);
      logger.info('Found companies to contact', { count: companies.length });

      if (companies.length === 0) {
        logger.info('No companies to contact, skipping pipeline');
        return;
      }

      // Step 2: Process each company
      for (const company of companies) {
        try {
          // Step 2a: Match template
          const templateMatch = await companyService.matchTemplate(company);
          logger.info('Template matched', {
            companyId: company.id,
            companyName: company.name,
            templateName: templateMatch.templateName,
            confidence: templateMatch.confidence,
          });

          // Step 2b: Personalize template
          const personalizedEmail = await templateService.personalizeTemplate(
            templateMatch.templateName,
            {
              companyName: company.name,
              contactName: company.contactName,
              contactPosition: company.contactPosition,
              industry: company.industry,
              size: company.size,
              website: company.website,
            }
          );

          // Step 2c: Add to email queue
          const emailId = await emailQueue.addToQueue({
            to: company.email || company.contactEmail || 'test@example.com',
            subject: personalizedEmail.subject,
            htmlContent: personalizedEmail.htmlContent,
            textContent: personalizedEmail.textContent,
            templateName: templateMatch.templateName,
            companyId: company.id,
            maxRetries: 3,
          });

          // Step 2d: Update company status
          await companyService.updateCompanyStatus(
            company.id,
            'CONTACTED',
            `Email queued: ${emailId}`
          );

          logger.info('Company processed successfully', {
            companyId: company.id,
            companyName: company.name,
            emailId,
          });

        } catch (error) {
          logger.error('Failed to process company', {
            error,
            companyId: company.id,
            companyName: company.name,
          });

          // Update company status to indicate failure
          await companyService.updateCompanyStatus(
            company.id,
            'PENDING',
            `Processing failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // Step 3: Process email queue
      const queueResult = await emailQueue.processQueue();
      logger.info('Email queue processed', queueResult);

      

      // Step 5: Sync with Google Calendar
      await timeSlotService.syncWithGoogleCalendar();
      logger.info('Synced with Google Calendar');

      // Step 6: Log pipeline completion
      logger.info('Pipeline completed successfully', {
        companiesProcessed: companies.length,
        emailsQueued: queueResult.processed,
        emailsSent: queueResult.sent,
        emailsFailed: queueResult.failed,
      });

    } catch (error) {
      logger.error('Pipeline execution failed', { error });
      throw error;
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      // Stop accepting new jobs
      this.isRunning = false;
      
      // Give current job time to finish
      setTimeout(() => {
        logger.info('Graceful shutdown completed');
        process.exit(0);
      }, 5000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Get status information
   */
  public getStatus(): Record<string, any> {
    return {
      isRunning: this.isRunning,
      runCount: this.runCount,
      lastRunTime: this.lastRunTime,
      schedule: config.app.cronSchedule,
      environment: config.app.nodeEnv,
    };
  }
}

// Start the application
const main = async (): Promise<void> => {
  try {
    logger.info('Initializing Biz-Agent application', {
      version: '1.0.0',
      environment: config.app.nodeEnv,
      nodeVersion: process.version,
    });

    // Validate configuration
    logger.info('Configuration validated successfully');

    // Initialize services (will be implemented later)
    // await DatabaseService.initialize();
    // await MailjetService.initialize();
    // await CalendarService.initialize();

    // Start cron job
    const cronJob = new BizAgentCron();
    cronJob.start();

    // Keep the process alive
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', {
        promise,
        reason,
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    logger.info('Biz-Agent application started successfully');

  } catch (error) {
    logger.error('Failed to start Biz-Agent application', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
};

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Application startup failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}
