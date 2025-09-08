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
  sendTime?: string;
  timezone?: string;
  maxEmailsPerDay?: number;
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
          description: data.description,
          templateId: data.templateId,
          startDate: data.startDate,
          endDate: data.endDate,
          targetIndustries: data.targetIndustries || [],
          targetSizes: data.targetSizes || [],
          targetRegions: data.targetRegions || [],
          sendTime: data.sendTime,
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
        console.log('🔍 DEBUG: First campaign:', campaigns[0].name);
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
          campaignCompany: {
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
        totalCompanies: campaign.campaignCompany.length,
        templateName: campaign.template.name,
      });

      // Process each company
      for (const campaignCompany of campaign.campaignCompany) {
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
            campaign.template.name,
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
            templateName: campaign.template.name,
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
        totalCompanies: campaign.campaignCompany.length,
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
          campaignCompany: {
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

      return campaign.campaignCompany;
    } catch (error) {
      logger.error('Failed to get campaign companies', { error, campaignId });
      throw error;
    }
  }

}

export const campaignService = new CampaignService();
