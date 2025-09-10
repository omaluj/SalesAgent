import cron from 'node-cron';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { errorHandler } from '../utils/errors.js';

// Import services
import { campaignService } from '../modules/campaigns/campaign.service.js';
import { companyDiscoveryService } from '../modules/companies/company-discovery.service.js';
import { emailQueue } from '../modules/mail/email-queue.js';
import { templateService } from '../modules/templates/template-service.js';
import { timeSlotService } from '../modules/calendar/time-slot.service.js';

export interface CampaignCronConfig {
  enabled: boolean;
  schedule: string; // cron expression
  maxCampaignsPerRun: number;
  maxCompaniesPerCampaign: number;
}

export class CampaignCronService {
  private isRunning = false;
  private lastRunTime: Date | null = null;
  private runCount = 0;
  private config: CampaignCronConfig;

  constructor(config: CampaignCronConfig) {
    this.config = config;
    this.setupGracefulShutdown();
  }

  /**
   * Start the campaign cron job
   */
  public start(): void {
    if (!this.config.enabled) {
      logger.info('Campaign cron job is disabled');
      return;
    }

    logger.info('Starting campaign cron job', {
      schedule: this.config.schedule,
      maxCampaignsPerRun: this.config.maxCampaignsPerRun,
    });

    cron.schedule(this.config.schedule, () => {
      this.runCampaignPipeline();
    });
  }

  /**
   * Stop the cron job
   */
  public stop(): void {
    logger.info('Stopping campaign cron job');
    // Note: node-cron doesn't provide a direct stop method
  }

  /**
   * Main campaign pipeline execution
   */
  private async runCampaignPipeline(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Previous campaign pipeline still running, skipping this execution');
      return;
    }

    this.isRunning = true;
    this.runCount++;
    const startTime = Date.now();

    try {
      logger.info(`Starting campaign pipeline execution #${this.runCount}`, {
        runCount: this.runCount,
        lastRunTime: this.lastRunTime,
      });

      await this.executeCampaignPipeline();

      this.lastRunTime = new Date();
      const duration = Date.now() - startTime;

      logger.info(`Campaign pipeline execution #${this.runCount} completed successfully`, {
        runCount: this.runCount,
        duration: `${duration}ms`,
        lastRunTime: this.lastRunTime,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Campaign pipeline execution #${this.runCount} failed`, {
        runCount: this.runCount,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
      });

      errorHandler.handleError(error as Error, {
        context: 'campaign_cron_job',
        runCount: this.runCount,
        duration,
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute the main campaign pipeline
   */
  private async executeCampaignPipeline(): Promise<void> {
    logger.info('Executing campaign pipeline');

    try {
      // Step 1: Get active campaigns
      const activeCampaigns = await campaignService.getCampaigns({
        status: 'ACTIVE',
        isActive: true,
      });

      logger.info('Found active campaigns', { count: activeCampaigns.length });

      if (activeCampaigns.length === 0) {
        logger.info('No active campaigns found, skipping pipeline');
        return;
      }

      // Step 2: Process each campaign
      for (const campaign of activeCampaigns.slice(0, this.config.maxCampaignsPerRun)) {
        try {
          await this.processCampaign(campaign);
        } catch (error) {
          logger.error('Failed to process campaign', {
            error,
            campaignId: campaign.id,
            campaignName: campaign.name,
          });
        }
      }

      // Step 3: Process email queue
      const queueResult = await emailQueue.processQueue();
      logger.info('Email queue processed', queueResult);

      // Step 4: Sync with Google Calendar
      await timeSlotService.syncWithGoogleCalendar();
      logger.info('Synced with Google Calendar');

      logger.info('Campaign pipeline completed successfully', {
        campaignsProcessed: activeCampaigns.length,
        emailsQueued: queueResult.processed,
        emailsSent: queueResult.sent,
        emailsFailed: queueResult.failed,
      });

    } catch (error) {
      logger.error('Campaign pipeline execution failed', { error });
      throw error;
    }
  }

  /**
   * Process a single campaign
   */
  private async processCampaign(campaign: any): Promise<void> {
    logger.info('Processing campaign', {
      campaignId: campaign.id,
      campaignName: campaign.name,
      autoDiscover: campaign.autoDiscover,
      autoContact: campaign.autoContact,
    });

    let companiesDiscovered = 0;
    let companiesContacted = 0;

    try {
      // Step 1: Auto-discover new companies if enabled
      if (campaign.autoDiscover && campaign.searchKeywords.length > 0) {
        logger.info('Auto-discovering companies for campaign', {
          campaignId: campaign.id,
          keywords: campaign.searchKeywords,
          location: campaign.searchLocation,
        });

        const discoveryResults = await companyDiscoveryService.runDiscoveryPipeline(
          campaign.searchKeywords,
          campaign.searchLocation || 'Slovakia',
          campaign.maxCompaniesPerSearch
        );

        companiesDiscovered = discoveryResults.totalDiscovered;
        logger.info('Companies discovered for campaign', {
          campaignId: campaign.id,
          discovered: companiesDiscovered,
        });
      }

      // Step 2: Auto-contact companies if enabled
      if (campaign.autoContact) {
        logger.info('Auto-contacting companies for campaign', {
          campaignId: campaign.id,
        });

        const contactResult = await campaignService.sendCampaignEmails(campaign.id);
        companiesContacted = contactResult.emailsQueued;

        logger.info('Companies contacted for campaign', {
          campaignId: campaign.id,
          contacted: companiesContacted,
          errors: contactResult.errors,
        });
      }

      // Step 3: Update campaign tracking
      await this.updateCampaignTracking(campaign.id, {
        companiesDiscovered,
        companiesContacted,
      });

      // Step 4: Auto-schedule follow-ups if enabled
      if (campaign.autoSchedule) {
        await this.scheduleFollowUps(campaign);
      }

    } catch (error) {
      logger.error('Failed to process campaign', {
        error,
        campaignId: campaign.id,
        campaignName: campaign.name,
      });
      throw error;
    }
  }

  /**
   * Update campaign tracking metrics
   */
  private async updateCampaignTracking(campaignId: string, metrics: {
    companiesDiscovered: number;
    companiesContacted: number;
  }): Promise<void> {
    try {
      // Get today's tracking record
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingTracking = await campaignService.getCampaignTracking(campaignId, today);

      if (existingTracking) {
        // Update existing record
        await campaignService.updateCampaignTracking(existingTracking.id, {
          companiesDiscovered: existingTracking.companiesDiscovered + metrics.companiesDiscovered,
          companiesContacted: existingTracking.companiesContacted + metrics.companiesContacted,
        });
      } else {
        // Create new record
        await campaignService.createCampaignTracking(campaignId, {
          companiesDiscovered: metrics.companiesDiscovered,
          companiesContacted: metrics.companiesContacted,
          date: today,
        });
      }

      logger.info('Campaign tracking updated', {
        campaignId,
        ...metrics,
      });

    } catch (error) {
      logger.error('Failed to update campaign tracking', {
        error,
        campaignId,
        metrics,
      });
    }
  }

  /**
   * Schedule follow-up meetings for campaign
   */
  private async scheduleFollowUps(campaign: any): Promise<void> {
    try {
      // Get companies that responded positively
      const campaignCompanies = await campaignService.getCampaignCompanies(campaign.id);
      const respondedCompanies = campaignCompanies.filter(
        (cc: any) => cc.status === 'RESPONDED' || cc.status === 'INTERESTED'
      );

      if (respondedCompanies.length === 0) {
        logger.info('No companies responded to campaign, skipping follow-up scheduling', {
          campaignId: campaign.id,
        });
        return;
      }

      logger.info('Scheduling follow-ups for campaign', {
        campaignId: campaign.id,
        respondedCompanies: respondedCompanies.length,
      });

      // Schedule meetings for each responded company
      for (const campaignCompany of respondedCompanies) {
        try {
          await (timeSlotService as any).scheduleMeeting({
            companyId: campaignCompany.companyId,
            campaignId: campaign.id,
            title: `Follow-up meeting - ${campaign.name}`,
            description: `Follow-up meeting for ${campaignCompany.company.name} from campaign ${campaign.name}`,
            duration: 30, // 30 minutes
            preferredTime: campaign.sendTime || '09:00',
          });

          logger.info('Follow-up meeting scheduled', {
            campaignId: campaign.id,
            companyId: campaignCompany.companyId,
            companyName: campaignCompany.company.name,
          });

        } catch (error) {
          logger.error('Failed to schedule follow-up meeting', {
            error,
            campaignId: campaign.id,
            companyId: campaignCompany.companyId,
          });
        }
      }

    } catch (error) {
      logger.error('Failed to schedule follow-ups for campaign', {
        error,
        campaignId: campaign.id,
      });
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down campaign cron service gracefully`);
      this.stop();
      process.exit(0);
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
      config: this.config,
      environment: config.app.nodeEnv,
    };
  }
}

// Default configuration
export const defaultCampaignCronConfig: CampaignCronConfig = {
  enabled: true,
  schedule: '0 */6 * * *', // Every 6 hours
  maxCampaignsPerRun: 5,
  maxCompaniesPerCampaign: 10,
};

export const campaignCronService = new CampaignCronService(defaultCampaignCronConfig);
