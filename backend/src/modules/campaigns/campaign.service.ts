import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';

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
}

export const campaignService = new CampaignService();
