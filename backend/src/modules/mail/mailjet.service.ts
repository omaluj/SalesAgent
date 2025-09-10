import Mailjet from 'node-mailjet';
import logger from '../../utils/logger.js';
import { config } from '../../config/index.js';
import { errorHandler } from '../../utils/errors.js';

export interface MailjetEmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateName?: string;
  companyId?: string;
}

export interface MailjetResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class MailjetService {
  private client: Mailjet | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Mailjet client
   */
  private initialize(): void {
    try {
      if (!config.mailjet.apiKey || !config.mailjet.apiSecret) {
        logger.warn('Mailjet API credentials not configured, using mock mode');
        return;
      }

      this.client = new Mailjet({
        apiKey: config.mailjet.apiKey,
        apiSecret: config.mailjet.apiSecret,
      });

      this.isInitialized = true;
      logger.info('Mailjet service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Mailjet service', { error });
      errorHandler.handleError(error as Error, { context: 'mailjet_init' });
    }
  }

  /**
   * Send email via Mailjet
   */
  async sendEmail(emailData: MailjetEmailData): Promise<MailjetResponse> {
    try {
      if (!this.isInitialized || !this.client) {
        logger.warn('Mailjet not initialized, skipping email send');
        return {
          success: false,
          error: 'Mailjet not initialized',
        };
      }

      const request = {
        Messages: [
          {
            From: {
              Email: config.mailjet.senderEmail || 'noreply@domelia.sk',
              Name: config.mailjet.senderName || 'Domelia.sk',
            },
            To: [
              {
                Email: emailData.to,
                Name: emailData.to.split('@')[0], // Use email prefix as name
              },
            ],
            Subject: emailData.subject,
            HTMLPart: emailData.htmlContent,
            TextPart: emailData.textContent || this.stripHtml(emailData.htmlContent),
            CustomID: emailData.companyId || 'unknown',
            Variables: {
              template_name: emailData.templateName || 'unknown',
              company_id: emailData.companyId || 'unknown',
            },
          },
        ],
      };

      logger.info('Sending email via Mailjet', {
        to: emailData.to,
        subject: emailData.subject,
        templateName: emailData.templateName,
        companyId: emailData.companyId,
      });

      const response = await this.client.post('send', { version: 'v3.1' }).request(request);

      if ((response.body as any).Messages && (response.body as any).Messages[0].Status === 'success') {
        const messageId = (response.body as any).Messages[0].To[0].MessageID;
        
        logger.info('Email sent successfully via Mailjet', {
          messageId,
          to: emailData.to,
          subject: emailData.subject,
        });

        return {
          success: true,
          messageId,
        };
      } else {
        const error = (response.body as any).Messages?.[0]?.Errors?.[0]?.ErrorMessage || 'Unknown error';
        
        logger.error('Failed to send email via Mailjet', {
          error,
          to: emailData.to,
          subject: emailData.subject,
        });

        return {
          success: false,
          error,
        };
      }
    } catch (error) {
      logger.error('Exception while sending email via Mailjet', {
        error,
        to: emailData.to,
        subject: emailData.subject,
      });

      errorHandler.handleError(error as Error, {
        context: 'mailjet_send',
        emailData,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: MailjetEmailData[]): Promise<{
    total: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      total: emails.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    logger.info('Sending bulk emails via Mailjet', { count: emails.length });

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          if (result.error) {
            results.errors.push(`${email.to}: ${result.error}`);
          }
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`${email.to}: ${errorMsg}`);
      }
    }

    logger.info('Bulk email sending completed', results);
    return results;
  }

  /**
   * Test Mailjet connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.client) {
        logger.warn('Mailjet not initialized, cannot test connection');
        return false;
      }

      // Test by getting account info
      const response = await this.client.get('account', { version: 'v3' }).request();
      
      if (response.body) {
        logger.info('Mailjet connection test successful', {
          accountId: (response.body as any).ID,
          email: (response.body as any).Email,
        });
        return true;
      } else {
        logger.error('Mailjet connection test failed - no response body');
        return false;
      }
    } catch (error) {
      logger.error('Mailjet connection test failed', { error });
      return false;
    }
  }

  /**
   * Get sending statistics
   */
  async getSendingStats(): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  }> {
    try {
      if (!this.isInitialized || !this.client) {
        logger.warn('Mailjet not initialized, cannot get stats');
        return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
      }

      // Get messages statistics for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const response = await this.client
        .get('statistics', { version: 'v3' })
        .request({
          FromTS: Math.floor(thirtyDaysAgo.getTime() / 1000),
          ToTS: Math.floor(Date.now() / 1000),
        });

      if (response.body && (response.body as any).Data) {
        const stats = (response.body as any).Data[0] || {};
        
        logger.info('Retrieved Mailjet sending statistics', stats);
        
        return {
          sent: stats.Count || 0,
          delivered: stats.DeliveredCount || 0,
          opened: stats.OpenedCount || 0,
          clicked: stats.ClickedCount || 0,
          bounced: stats.BouncedCount || 0,
        };
      } else {
        logger.warn('No statistics data received from Mailjet');
        return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
      }
    } catch (error) {
      logger.error('Failed to get Mailjet sending statistics', { error });
      return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    }
  }

  /**
   * Strip HTML tags to create text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }
}

// Export singleton instance
export const mailjetService = new MailjetService();
