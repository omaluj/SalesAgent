import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';

export interface TemplateData {
  companyName: string;
  contactName?: string;
  contactPosition?: string;
  industry?: string;
  size?: string;
  website?: string;
  customFields?: Record<string, string>;
}

export class TemplateService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get template by name
   */
  async getTemplate(templateName: string): Promise<any> {
    try {
      const template = await this.prisma.emailTemplate.findFirst({
        where: {
          name: templateName,
          active: true,
        },
      });

      if (!template) {
        throw new Error(`Template '${templateName}' not found or inactive`);
      }

      return template;
    } catch (error) {
      logger.error('Failed to get template', { error, templateName });
      throw error;
    }
  }

  /**
   * Personalize template with company data
   */
  async personalizeTemplate(templateName: string, data: TemplateData): Promise<{
    subject: string;
    htmlContent: string;
    textContent: string;
  }> {
    try {
      const template = await this.getTemplate(templateName);

      // Create variables for template replacement
      const variables = {
        companyName: data.companyName,
        contactName: data.contactName || 'Vážený zákazník',
        contactPosition: data.contactPosition || '',
        industry: data.industry || 'vášho odvetvia',
        size: data.size || 'spoločnosti',
        website: data.website || '',
        ...data.customFields,
      };

      // Replace placeholders in template
      let subject = template.subject;
      let htmlContent = template.content; // Note: schema uses 'content' not 'htmlContent'
      let textContent = ''; // Note: textContent field doesn't exist in schema yet

      // Replace variables in all fields
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        const replacement = value || '';

        subject = subject.replace(new RegExp(placeholder, 'g'), replacement);
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), replacement);
        textContent = textContent.replace(new RegExp(placeholder, 'g'), replacement);
      }

      // Clean up any remaining placeholders
      subject = subject.replace(/\{\{[^}]+\}\}/g, '');
      htmlContent = htmlContent.replace(/\{\{[^}]+\}\}/g, '');
      textContent = textContent.replace(/\{\{[^}]+\}\}/g, '');

      logger.info('Template personalized', {
        templateName,
        companyName: data.companyName,
        subjectLength: subject.length,
        htmlLength: htmlContent.length,
      });

      return {
        subject,
        htmlContent,
        textContent,
      };
    } catch (error) {
      logger.error('Failed to personalize template', { error, templateName, data });
      throw error;
    }
  }

  /**
   * Get all active templates
   */
  async getAllActiveTemplates(): Promise<any[]> {
    try {
      const templates = await this.prisma.emailTemplate.findMany({
        where: {
          active: true,
        },
        orderBy: { name: 'asc' },
      });

      return templates;
    } catch (error) {
      logger.error('Failed to get active templates', { error });
      throw error;
    }
  }

  /**
   * Create new template
   */
  async createTemplate(templateData: {
    name: string;
    subject: string;
    content: string; // Note: schema uses 'content' not 'htmlContent'
    category?: string;
    variables?: any;
    active?: boolean;
  }): Promise<any> {
    try {
      const template = await this.prisma.emailTemplate.create({
        data: {
          ...templateData,
          active: templateData.active ?? true,
        },
      });

      logger.info('Template created', {
        templateId: template.id,
        templateName: template.name,
      });

      return template;
    } catch (error) {
      logger.error('Failed to create template', { error, templateData });
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<{
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    targetIndustry: string;
    targetSize: string;
    keywords: string;
    isActive: boolean;
  }>): Promise<any> {
    try {
      const template = await this.prisma.emailTemplate.update({
        where: { id: templateId },
        data: updates,
      });

      logger.info('Template updated', {
        templateId,
        templateName: template.name,
        updates: Object.keys(updates),
      });

      return template;
    } catch (error) {
      logger.error('Failed to update template', { error, templateId, updates });
      throw error;
    }
  }

  /**
   * Deactivate template
   */
  async deactivateTemplate(templateId: string): Promise<void> {
    try {
      await this.prisma.emailTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
      });

      logger.info('Template deactivated', { templateId });
    } catch (error) {
      logger.error('Failed to deactivate template', { error, templateId });
      throw error;
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    usageCount: Record<string, number>;
  }> {
    try {
              const [total, active, inactive, usageStats] = await Promise.all([
          this.prisma.emailTemplate.count(),
          this.prisma.emailTemplate.count({ 
            where: { 
              active: true
            } 
          }),
          this.prisma.emailTemplate.count({ 
            where: { 
              active: false
            } 
          }),
        this.prisma.emailLog.groupBy({
          by: ['template'],
          _count: { template: true },
          where: { template: { not: null } },
        }),
      ]);

      const usageCount: Record<string, number> = {};
      usageStats.forEach(stat => {
        if (stat.template) {
          usageCount[stat.template] = stat._count.template;
        }
      });

      return {
        total,
        active,
        inactive,
        usageCount,
      };
    } catch (error) {
      logger.error('Failed to get template stats', { error });
      throw error;
    }
  }

  /**
   * Validate template syntax
   */
  validateTemplate(template: {
    subject: string;
    htmlContent: string;
    textContent: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required fields
    if (!template.subject.trim()) {
      errors.push('Subject is required');
    }

    if (!template.htmlContent.trim()) {
      errors.push('HTML content is required');
    }

    if (!template.textContent.trim()) {
      errors.push('Text content is required');
    }

    // Check for unmatched placeholders
    const placeholderRegex = /\{\{[^}]+\}\}/g;
    const subjectPlaceholders = template.subject.match(placeholderRegex) || [];
    const htmlPlaceholders = template.htmlContent.match(placeholderRegex) || [];
    const textPlaceholders = template.textContent.match(placeholderRegex) || [];

    const allPlaceholders = [...new Set([...subjectPlaceholders, ...htmlPlaceholders, ...textPlaceholders])];

    // Check for common required placeholders
    const requiredPlaceholders = ['{{companyName}}'];
    for (const required of requiredPlaceholders) {
      if (!template.subject.includes(required) && !template.htmlContent.includes(required)) {
        errors.push(`Required placeholder '${required}' not found in subject or HTML content`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const templateService = new TemplateService();
