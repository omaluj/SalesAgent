import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';

export interface CreateTemplateData {
  name: string;
  subject: string;
  content: string;
  category?: string;
  targetIndustries?: string[];
  targetSizes?: string[];
  seasonalStart?: string;
  seasonalEnd?: string;
  isSeasonal?: boolean;
  variables?: string[];
}

export interface TemplateFilters {
  category?: string;
  active?: boolean;
  isSeasonal?: boolean;
  targetIndustries?: string[];
  targetSizes?: string[];
}

export class EnhancedTemplateService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new email template
   */
  async createTemplate(data: CreateTemplateData) {
    try {
      const template = await this.prisma.emailTemplate.create({
        data: {
          name: data.name,
          subject: data.subject,
          content: data.content,
          category: data.category || null,
          targetIndustries: data.targetIndustries || [],
          targetSizes: data.targetSizes || [],
          seasonalStart: data.seasonalStart || null,
          seasonalEnd: data.seasonalEnd || null,
          isSeasonal: data.isSeasonal || false,
          variables: data.variables || [],
          active: true,
        },
      });

      logger.info('Email template created successfully', {
        templateId: template.id,
        name: template.name,
        category: template.category,
      });

      return template;
    } catch (error) {
      logger.error('Failed to create email template', { error, data });
      throw error;
    }
  }

  /**
   * Get all templates with optional filters
   */
  async getTemplates(filters: TemplateFilters = {}) {
    try {
      console.log('🔍 DEBUG: EnhancedTemplateService.getTemplates called with filters:', filters);
      
      const where: any = {};

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.active !== undefined) {
        where.active = filters.active;
      }

      if (filters.isSeasonal !== undefined) {
        where.isSeasonal = filters.isSeasonal;
      }

      if (filters.targetIndustries && filters.targetIndustries.length > 0) {
        where.OR = filters.targetIndustries.map(industry => ({
          targetIndustries: {
            has: industry,
          },
        }));
      }

      if (filters.targetSizes && filters.targetSizes.length > 0) {
        where.OR = filters.targetSizes.map(size => ({
          targetSizes: {
            has: size,
          },
        }));
      }

      console.log('🔍 DEBUG: Prisma where clause:', where);

      const templates = await this.prisma.emailTemplate.findMany({
        where,
        include: {
          _count: {
            select: {
              campaigns: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log('🔍 DEBUG: Prisma returned:', templates.length, 'templates');
      if (templates.length > 0) {
        console.log('🔍 DEBUG: First template:', templates[0]?.name);
      }

      return templates;
    } catch (error) {
      logger.error('Failed to get templates', { error, filters });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string) {
    try {
      const template = await this.prisma.emailTemplate.findUnique({
        where: { id },
        include: {
          campaigns: {
            include: {
              _count: {
                select: {
                  campaignCompanies: true,
                },
              },
            },
          },
        },
      });

      if (!template) {
        throw new Error(`Template with ID ${id} not found`);
      }

      return template;
    } catch (error) {
      logger.error('Failed to get template by ID', { error, templateId: id });
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, data: Partial<CreateTemplateData>) {
    try {
      const template = await this.prisma.emailTemplate.update({
        where: { id },
        data,
      });

      logger.info('Template updated successfully', {
        templateId: id,
        updatedFields: Object.keys(data),
      });

      return template;
    } catch (error) {
      logger.error('Failed to update template', { error, templateId: id, data });
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string) {
    try {
      await this.prisma.emailTemplate.delete({
        where: { id },
      });

      logger.info('Template deleted successfully', { templateId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete template', { error, templateId: id });
      throw error;
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string) {
    try {
      const templates = await this.prisma.emailTemplate.findMany({
        where: {
          category,
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return templates;
    } catch (error) {
      logger.error('Failed to get templates by category', { error, category });
      throw error;
    }
  }

  /**
   * Get seasonal templates for current date
   */
  async getSeasonalTemplates() {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const currentDate = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      const templates = await this.prisma.emailTemplate.findMany({
        where: {
          isSeasonal: true,
          active: true,
          OR: [
            {
              seasonalStart: {
                lte: currentDate,
              },
              seasonalEnd: {
                gte: currentDate,
              },
            },
            {
              seasonalStart: {
                lte: currentDate,
              },
              seasonalEnd: null,
            },
          ],
        },
      });

      return templates;
    } catch (error) {
      logger.error('Failed to get seasonal templates', { error });
      throw error;
    }
  }

  /**
   * Get templates suitable for company
   */
  async getTemplatesForCompany(company: any) {
    try {
      const templates = await this.prisma.emailTemplate.findMany({
        where: {
          active: true,
          OR: [
            // Match by industry
            {
              targetIndustries: {
                has: company.industry,
              },
            },
            // Match by company size
            {
              targetSizes: {
                has: company.size,
              },
            },
            // Match by category
            {
              category: company.industry,
            },
            // Generic templates
            {
              category: 'firmy',
            },
          ],
        },
        orderBy: [
          {
            isSeasonal: 'desc',
          },
          {
            name: 'asc',
          },
        ],
      });

      // Filter out seasonal templates if not in season
      if (company.industry !== 'skolky') {
        return templates.filter(template => !template.isSeasonal);
      }

      return templates;
    } catch (error) {
      logger.error('Failed to get templates for company', { error, company });
      throw error;
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(templateId: string) {
    try {
      const campaigns = await this.prisma.campaign.findMany({
        where: {
          templateId,
        },
        include: {
          _count: {
            select: {
              campaignCompanies: true,
            },
          },
        },
      });

      const totalCampaigns = campaigns.length;
      const totalCompanies = campaigns.reduce(
        (sum, campaign) => sum + campaign._count.campaignCompanies,
        0
      );

      return {
        templateId,
        totalCampaigns,
        totalCompanies,
        campaigns,
      };
    } catch (error) {
      logger.error('Failed to get template stats', { error, templateId });
      throw error;
    }
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(id: string, newName: string) {
    try {
      const original = await this.getTemplateById(id);
      
      const duplicated = await this.prisma.emailTemplate.create({
        data: {
          name: newName,
          subject: original.subject,
          content: original.content,
          category: original.category,
          targetIndustries: original.targetIndustries || [],
          targetSizes: original.targetSizes || [],
          seasonalStart: original.seasonalStart,
          seasonalEnd: original.seasonalEnd,
          isSeasonal: original.isSeasonal,
          variables: original.variables || [],
          active: false, // Start as inactive
        },
      });

      logger.info('Template duplicated successfully', {
        originalId: id,
        newId: duplicated.id,
        newName,
      });

      return duplicated;
    } catch (error) {
      logger.error('Failed to duplicate template', { error, templateId: id, newName });
      throw error;
    }
  }
}

export const enhancedTemplateService = new EnhancedTemplateService();
