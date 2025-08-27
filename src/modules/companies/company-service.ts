import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger.js';
import { config } from '@/config/index.js';

export interface CompanyFilter {
  status?: 'PENDING' | 'CONTACTED' | 'RESPONDED' | 'MEETING_SCHEDULED' | 'CONVERTED' | 'REJECTED';
  industry?: string;
  size?: 'small' | 'medium' | 'large';
  blacklisted?: boolean;
  lastContactedBefore?: Date;
  hasEmail?: boolean;
  hasPhone?: boolean;
}

export interface TemplateMatch {
  companyId: string;
  templateName: string;
  confidence: number;
  reason: string;
}

export class CompanyService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Find companies that should be contacted
   */
  async findCompaniesToContact(filter: CompanyFilter = {}, limit = 10): Promise<any[]> {
    try {
      const where: any = {
        blacklisted: false,
      };

      // Apply filters
      if (filter.status) {
        where.status = filter.status;
      } else {
        // Default: find PENDING companies
        where.status = 'PENDING';
      }

      if (filter.industry) {
        where.industry = filter.industry;
      }

      if (filter.size) {
        where.size = filter.size;
      }

      if (filter.hasEmail) {
        where.email = { not: null };
      }

      if (filter.hasPhone) {
        where.phone = { not: null };
      }

      // Note: lastContactedAt field doesn't exist in schema yet
      // TODO: Add this field to schema in future migration
      if (filter.lastContactedBefore) {
        logger.warn('lastContactedBefore filter not implemented - field missing from schema');
      }

      const companies = await this.prisma.company.findMany({
        where,
        orderBy: [
          { createdAt: 'asc' },
        ],
        take: limit,
      });

      logger.info('Found companies to contact', {
        count: companies.length,
        filters: filter,
      });

      return companies;
    } catch (error) {
      logger.error('Failed to find companies to contact', { error, filter });
      throw error;
    }
  }

  /**
   * Match company with appropriate email template
   */
  async matchTemplate(company: any): Promise<TemplateMatch> {
    try {
      const templates = await this.prisma.emailTemplate.findMany({
        where: { active: true },
      });

      let bestMatch: TemplateMatch = {
        companyId: company.id,
        templateName: 'firmy-intro', // default
        confidence: 0,
        reason: 'Default template',
      };

      // Simple template matching logic
      for (const template of templates) {
        let confidence = 0;
        let reason = '';

        // Match by industry (using category field)
        if (template.category && company.industry) {
          if (template.category.toLowerCase().includes(company.industry.toLowerCase()) ||
              company.industry.toLowerCase().includes(template.category.toLowerCase())) {
            confidence += 0.4;
            reason += 'Industry match; ';
          }
        }

        // Match by company size (using category field)
        if (template.category && company.size) {
          if (template.category.toLowerCase().includes(company.size.toLowerCase())) {
            confidence += 0.3;
            reason += 'Size match; ';
          }
        }

        // Match by company name keywords (using category field)
        if (template.category && company.name) {
          const keywords = template.category.toLowerCase().split(',').map(k => k.trim());
          const companyName = company.name.toLowerCase();
          
          const matchedKeywords = keywords.filter(keyword => 
            companyName.includes(keyword)
          );
          
          if (matchedKeywords.length > 0) {
            confidence += 0.2 * (matchedKeywords.length / keywords.length);
            reason += `Keyword match: ${matchedKeywords.join(', ')}; `;
          }
        }

        // Update best match if this template has higher confidence
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            companyId: company.id,
            templateName: template.name,
            confidence,
            reason: reason.trim(),
          };
        }
      }

      logger.info('Template matched for company', {
        companyId: company.id,
        companyName: company.name,
        templateName: bestMatch.templateName,
        confidence: bestMatch.confidence,
        reason: bestMatch.reason,
      });

      return bestMatch;
    } catch (error) {
      logger.error('Failed to match template for company', { error, companyId: company.id });
      throw error;
    }
  }

  /**
   * Update company status
   */
  async updateCompanyStatus(companyId: string, status: string, notes?: string): Promise<void> {
    try {
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          status,
          // Note: lastContactedAt and notes fields don't exist in schema yet
          // TODO: Add these fields to schema in future migration
        },
      });

      // Log the notes separately since the field doesn't exist
      if (notes) {
        logger.info('Company status updated with notes', {
          companyId,
          status,
          notes,
        });
      }

      logger.info('Company status updated', {
        companyId,
        status,
        notes,
      });
    } catch (error) {
      logger.error('Failed to update company status', { error, companyId, status });
      throw error;
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(): Promise<{
    total: number;
    pending: number;
    contacted: number;
    responded: number;
    meetingScheduled: number;
    converted: number;
    lost: number;
    blacklisted: number;
  }> {
    try {
      const [
        total,
        pending,
        contacted,
        responded,
        meetingScheduled,
        converted,
        lost,
        blacklisted,
      ] = await Promise.all([
        this.prisma.company.count(),
        this.prisma.company.count({ where: { status: 'PENDING' } }),
        this.prisma.company.count({ where: { status: 'CONTACTED' } }),
        this.prisma.company.count({ where: { status: 'RESPONDED' } }),
        this.prisma.company.count({ where: { status: 'MEETING_SCHEDULED' } }),
        this.prisma.company.count({ where: { status: 'CONVERTED' } }),
        this.prisma.company.count({ where: { status: 'LOST' } }),
        this.prisma.company.count({ where: { blacklisted: true } }),
      ]);

      return {
        total,
        pending,
        contacted,
        responded,
        meetingScheduled,
        converted,
        rejected,
        blacklisted,
      };
    } catch (error) {
      logger.error('Failed to get company stats', { error });
      throw error;
    }
  }

  /**
   * Add company to blacklist
   */
  async blacklistCompany(companyId: string, reason: string): Promise<void> {
    try {
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          blacklisted: true,
          blacklistReason: reason,
          status: 'LOST',
        },
      });

      logger.warn('Company blacklisted', {
        companyId,
        reason,
      });
    } catch (error) {
      logger.error('Failed to blacklist company', { error, companyId, reason });
      throw error;
    }
  }

  /**
   * Get companies by industry
   */
  async getCompaniesByIndustry(industry: string): Promise<any[]> {
    try {
      const companies = await this.prisma.company.findMany({
        where: {
          industry: {
            contains: industry,
            mode: 'insensitive',
          },
          blacklisted: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      return companies;
    } catch (error) {
      logger.error('Failed to get companies by industry', { error, industry });
      throw error;
    }
  }
}

// Export singleton instance
export const companyService = new CompanyService();
