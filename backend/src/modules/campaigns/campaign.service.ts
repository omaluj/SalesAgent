import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';
import { emailQueue } from '../mail/email-queue.js';
import { templateService } from '../templates/template-service.js';

export interface CreateCampaignData {
  name: string;
  description?: string;
  templateId: string;
  startDate: Date;
  endDate: Date;
  targetIndustries?: string[];
  targetSizes?: string[];
  targetRegions?: string[];
  searchKeywords?: string[];
  searchLocation?: string;
  maxCompaniesPerSearch?: number;
  searchFrequency?: string;
  sendTime?: string;
  timezone?: string;
  maxEmailsPerDay?: number;
  autoDiscover?: boolean;
  autoContact?: boolean;
  autoSchedule?: boolean;
}

export interface CampaignFilters {
  status?: string;
  isActive?: boolean;
  templateId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class CampaignService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaignData) {
    try {
      const campaign = await this.prisma.campaign.create({
        data: {
          name: data.name,
          description: data.description || null,
          templateId: data.templateId,
          startDate: data.startDate,
          endDate: data.endDate,
          targetIndustries: data.targetIndustries || [],
          targetSizes: data.targetSizes || [],
          targetRegions: data.targetRegions || [],
          sendTime: data.sendTime || null,
          timezone: data.timezone || 'Europe/Bratislava',
          maxEmailsPerDay: data.maxEmailsPerDay || 50,
          status: 'DRAFT',
        },
        include: {
          template: true,
        },
      });

      logger.info('Campaign created successfully', {
        campaignId: campaign.id,
        name: campaign.name,
        templateId: campaign.templateId,
      });

      return campaign;
    } catch (error) {
      logger.error('Failed to create campaign', { error, data });
      throw error;
    }
  }

  /**
   * Get all campaigns with optional filters
   */
  async getCampaigns(filters: CampaignFilters = {}) {
    try {
      console.log('🔍 DEBUG: CampaignService.getCampaigns called with filters:', filters);
      
      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.templateId) {
        where.templateId = filters.templateId;
      }

      if (filters.startDate) {
        where.startDate = {
          gte: filters.startDate,
        };
      }

      if (filters.endDate) {
        where.endDate = {
          lte: filters.endDate,
        };
      }

      console.log('🔍 DEBUG: Prisma where clause:', where);

      const campaigns = await this.prisma.campaign.findMany({
        where,
        include: {
          template: true,
          _count: {
            select: {
              campaignCompanies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log('🔍 DEBUG: Prisma returned:', campaigns.length, 'campaigns');
      if (campaigns.length > 0) {
        console.log('🔍 DEBUG: First campaign:', campaigns[0]?.name);
      }

      return campaigns;
    } catch (error) {
      logger.error('Failed to get campaigns', { error, filters });
      throw error;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id },
        include: {
          template: true,
          campaignCompanies: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new Error(`Campaign with ID ${id} not found`);
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to get campaign by ID', { error, campaignId: id });
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, data: Partial<CreateCampaignData>) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id },
        data,
        include: {
          template: true,
        },
      });

      logger.info('Campaign updated successfully', {
        campaignId: id,
        updatedFields: Object.keys(data),
      });

      return campaign;
    } catch (error) {
      logger.error('Failed to update campaign', { error, campaignId: id, data });
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string) {
    try {
      await this.prisma.campaign.delete({
        where: { id },
      });

      logger.info('Campaign deleted successfully', { campaignId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete campaign', { error, campaignId: id });
      throw error;
    }
  }

  /**
   * Assign companies to campaign
   */
  async assignCompaniesToCampaign(campaignId: string, companyIds: string[]) {
    try {
      const assignments = await this.prisma.campaignCompany.createMany({
        data: companyIds.map(companyId => ({
          campaignId,
          companyId,
        })),
        skipDuplicates: true,
      });

      logger.info('Companies assigned to campaign successfully', {
        campaignId,
        assignedCount: assignments.count,
        totalRequested: companyIds.length,
      });

      return assignments;
    } catch (error) {
      logger.error('Failed to assign companies to campaign', {
        error,
        campaignId,
        companyIds,
      });
      throw error;
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string) {
    try {
      const stats = await this.prisma.campaignCompany.groupBy({
        by: ['status'],
        where: {
          campaignId,
        },
        _count: {
          status: true,
        },
      });

      const total = await this.prisma.campaignCompany.count({
        where: { campaignId },
      });

      const statsMap = stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        byStatus: statsMap,
        sent: statsMap.SENT || 0,
        delivered: statsMap.DELIVERED || 0,
        opened: statsMap.OPENED || 0,
        clicked: statsMap.CLICKED || 0,
        failed: statsMap.FAILED || 0,
      };
    } catch (error) {
      logger.error('Failed to get campaign stats', { error, campaignId });
      throw error;
    }
  }

  /**
   * Activate campaign
   */
  async activateCampaign(id: string) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          isActive: true,
        },
      });

      logger.info('Campaign activated successfully', { campaignId: id });
      return campaign;
    } catch (error) {
      logger.error('Failed to activate campaign', { error, campaignId: id });
      throw error;
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(id: string) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'PAUSED',
          isActive: false,
        },
      });

      logger.info('Campaign paused successfully', { campaignId: id });
      return campaign;
    } catch (error) {
      logger.error('Failed to pause campaign', { error, campaignId: id });
      throw error;
    }
  }

  /**
   * Send emails to all companies in campaign
   */
  async sendCampaignEmails(campaignId: string): Promise<{
    totalCompanies: number;
    emailsQueued: number;
    errors: number;
    results: Array<{
      companyId: string;
      companyName: string;
      email: string;
      success: boolean;
      error?: string;
      emailId?: string;
    }>;
  }> {
    try {
      logger.info('Starting campaign email sending', { campaignId });

      // Get campaign with template and companies
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          template: true,
          campaignCompanies: {
            include: {
              company: true,
            },
            where: {
              status: 'ASSIGNED', // Only send to assigned companies
            },
          },
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (!campaign.template) {
        throw new Error('Campaign template not found');
      }

      const results = [];
      let emailsQueued = 0;
      let errors = 0;

      logger.info('Processing companies for campaign', {
        campaignId,
        campaignName: campaign.name,
        totalCompanies: campaign.campaignCompanies.length,
        templateName: campaign.template?.name || 'Unknown',
      });

      // Process each company
      for (const campaignCompany of campaign.campaignCompanies) {
        const company = campaignCompany.company;
        
        try {
          // Check if company has email
          if (!company.email && !company.contactEmail) {
            logger.warn('Company has no email address', {
              companyId: company.id,
              companyName: company.name,
            });
            
            results.push({
              companyId: company.id,
              companyName: company.name,
              email: 'no-email',
              success: false,
              error: 'No email address available',
            });
            errors++;
            continue;
          }

          // Personalize template
          const personalizedEmail = await templateService.personalizeTemplate(
            campaign.template?.name || 'Unknown',
            {
              companyName: company.name,
              contactName: company.contactName || 'Vážený klient',
              contactPosition: company.contactPosition || '',
              industry: company.industry || '',
              size: company.size || '',
              website: company.website || '',
            }
          );

          // Add to email queue
          const emailId = await emailQueue.addToQueue({
            to: company.email || company.contactEmail!,
            subject: personalizedEmail.subject,
            htmlContent: personalizedEmail.htmlContent,
            textContent: personalizedEmail.textContent,
            templateName: campaign.template?.name || 'Unknown',
            companyId: company.id,
            maxRetries: 3,
          });

          // Update campaign company status
          await this.prisma.campaignCompany.update({
            where: { id: campaignCompany.id },
            data: {
              status: 'SCHEDULED',
              sentAt: new Date(),
            },
          });

          // Update company status
          await this.prisma.company.update({
            where: { id: company.id },
            data: {
              status: 'CONTACTED',
            },
          });

          results.push({
            companyId: company.id,
            companyName: company.name,
            email: company.email || company.contactEmail!,
            success: true,
            emailId: emailId,
          });

          emailsQueued++;
          
          logger.info('Email queued for company', {
            campaignId,
            companyId: company.id,
            companyName: company.name,
            email: company.email || company.contactEmail,
            emailId,
          });

        } catch (error) {
          logger.error('Failed to process company for campaign', {
            campaignId,
            companyId: company.id,
            companyName: company.name,
            error,
          });

          results.push({
            companyId: company.id,
            companyName: company.name,
            email: company.email || company.contactEmail || 'unknown',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });

          errors++;
        }
      }

      const summary = {
        totalCompanies: campaign.campaignCompanies.length,
        emailsQueued,
        errors,
        results,
      };

      logger.info('Campaign email sending completed', {
        campaignId,
        campaignName: campaign.name,
        ...summary,
      });

      return summary;

    } catch (error) {
      logger.error('Failed to send campaign emails', { error, campaignId });
      throw error;
    }
  }

  /**
   * Get campaign companies with their email status
   */
  async getCampaignCompanies(campaignId: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          campaignCompanies: {
            include: {
              company: true,
            },
            orderBy: {
              assignedAt: 'desc',
            },
          },
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      return campaign.campaignCompanies;
    } catch (error) {
      logger.error('Failed to get campaign companies', { error, campaignId });
      throw error;
    }
  }

  /**
   * Create campaign tracking record
   */
  async createCampaignTracking(campaignId: string, data: {
    companiesDiscovered?: number;
    companiesContacted?: number;
    companiesResponded?: number;
    emailsSent?: number;
    emailsDelivered?: number;
    emailsOpened?: number;
    emailsClicked?: number;
    emailsBounced?: number;
    leadsGenerated?: number;
    meetingsScheduled?: number;
    meetingsCompleted?: number;
    revenueGenerated?: number;
    date?: Date;
  }) {
    try {
      const tracking = await this.prisma.campaignTracking.create({
        data: {
          campaignId,
          companiesDiscovered: data.companiesDiscovered || 0,
          companiesContacted: data.companiesContacted || 0,
          companiesResponded: data.companiesResponded || 0,
          emailsSent: data.emailsSent || 0,
          emailsDelivered: data.emailsDelivered || 0,
          emailsOpened: data.emailsOpened || 0,
          emailsClicked: data.emailsClicked || 0,
          emailsBounced: data.emailsBounced || 0,
          leadsGenerated: data.leadsGenerated || 0,
          meetingsScheduled: data.meetingsScheduled || 0,
          meetingsCompleted: data.meetingsCompleted || 0,
          revenueGenerated: data.revenueGenerated || 0,
          date: data.date || new Date(),
        },
      });

      logger.info('Campaign tracking created', {
        campaignId,
        trackingId: tracking.id,
        date: tracking.date,
      });

      return tracking;
    } catch (error) {
      logger.error('Failed to create campaign tracking', { error, campaignId, data });
      throw error;
    }
  }

  /**
   * Update campaign tracking record
   */
  async updateCampaignTracking(trackingId: string, data: {
    companiesDiscovered?: number;
    companiesContacted?: number;
    companiesResponded?: number;
    emailsSent?: number;
    emailsDelivered?: number;
    emailsOpened?: number;
    emailsClicked?: number;
    emailsBounced?: number;
    leadsGenerated?: number;
    meetingsScheduled?: number;
    meetingsCompleted?: number;
    revenueGenerated?: number;
  }) {
    try {
      const tracking = await this.prisma.campaignTracking.update({
        where: { id: trackingId },
        data,
      });

      logger.info('Campaign tracking updated', {
        trackingId,
        campaignId: tracking.campaignId,
      });

      return tracking;
    } catch (error) {
      logger.error('Failed to update campaign tracking', { error, trackingId, data });
      throw error;
    }
  }

  /**
   * Get campaign tracking record for specific date
   */
  async getCampaignTracking(campaignId: string, date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const tracking = await this.prisma.campaignTracking.findFirst({
        where: {
          campaignId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      return tracking;
    } catch (error) {
      logger.error('Failed to get campaign tracking', { error, campaignId, date });
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string, startDate?: Date, endDate?: Date) {
    try {
      const where: any = { campaignId };
      
      if (startDate && endDate) {
        where.date = {
          gte: startDate,
          lte: endDate,
        };
      }

      const tracking = await this.prisma.campaignTracking.findMany({
        where,
        orderBy: {
          date: 'desc',
        },
      });

      // Calculate totals
      const totals = tracking.reduce((acc, record) => ({
        companiesDiscovered: acc.companiesDiscovered + record.companiesDiscovered,
        companiesContacted: acc.companiesContacted + record.companiesContacted,
        companiesResponded: acc.companiesResponded + record.companiesResponded,
        emailsSent: acc.emailsSent + record.emailsSent,
        emailsDelivered: acc.emailsDelivered + record.emailsDelivered,
        emailsOpened: acc.emailsOpened + record.emailsOpened,
        emailsClicked: acc.emailsClicked + record.emailsClicked,
        emailsBounced: acc.emailsBounced + record.emailsBounced,
        leadsGenerated: acc.leadsGenerated + record.leadsGenerated,
        meetingsScheduled: acc.meetingsScheduled + record.meetingsScheduled,
        meetingsCompleted: acc.meetingsCompleted + record.meetingsCompleted,
        revenueGenerated: Number(acc.revenueGenerated) + Number(record.revenueGenerated || 0),
      }), {
        companiesDiscovered: 0,
        companiesContacted: 0,
        companiesResponded: 0,
        emailsSent: 0,
        emailsDelivered: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        emailsBounced: 0,
        leadsGenerated: 0,
        meetingsScheduled: 0,
        meetingsCompleted: 0,
        revenueGenerated: 0,
      });

      // Calculate rates
      const rates = {
        responseRate: totals.companiesContacted > 0 ? (totals.companiesResponded / totals.companiesContacted) * 100 : 0,
        deliveryRate: totals.emailsSent > 0 ? (totals.emailsDelivered / totals.emailsSent) * 100 : 0,
        openRate: totals.emailsDelivered > 0 ? (totals.emailsOpened / totals.emailsDelivered) * 100 : 0,
        clickRate: totals.emailsDelivered > 0 ? (totals.emailsClicked / totals.emailsDelivered) * 100 : 0,
        bounceRate: totals.emailsSent > 0 ? (totals.emailsBounced / totals.emailsSent) * 100 : 0,
        leadRate: totals.companiesContacted > 0 ? (totals.leadsGenerated / totals.companiesContacted) * 100 : 0,
        meetingRate: totals.leadsGenerated > 0 ? (totals.meetingsScheduled / totals.leadsGenerated) * 100 : 0,
        completionRate: totals.meetingsScheduled > 0 ? (totals.meetingsCompleted / totals.meetingsScheduled) * 100 : 0,
      };

      return {
        tracking,
        totals,
        rates,
        period: {
          startDate: startDate || (tracking.length > 0 ? tracking[tracking.length - 1]?.date : null),
          endDate: endDate || (tracking.length > 0 ? tracking[0]?.date : null),
        },
      };
    } catch (error) {
      logger.error('Failed to get campaign analytics', { error, campaignId, startDate, endDate });
      throw error;
    }
  }

}

export const campaignService = new CampaignService();
