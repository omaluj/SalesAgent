import * as nodemailer from 'nodemailer';
import logger from '../../utils/logger.js';
import { config } from '../../config/index.js';

export interface SMTPEmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateName?: string;
  companyId?: string;
}

export interface SMTPResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMTPService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeAsync();
  }

  /**
   * Initialize SMTP transporter asynchronously
   */
  private async initializeAsync(): Promise<void> {
    try {
      logger.info('Initializing SMTP service with MailHog configuration...');
      
      // MailHog SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false, // MailHog doesn't use TLS
        ignoreTLS: true, // Ignore TLS for MailHog
        auth: false // MailHog doesn't require authentication
      } as any);

      this.isInitialized = true;
      logger.info('SMTP service initialized with MailHog successfully');
      
      // Test connection asynchronously without blocking initialization
      this.testConnection().then(success => {
        if (success) {
          logger.info('SMTP connection test successful');
        } else {
          logger.warn('SMTP connection test failed, but service is still available');
        }
      }).catch(error => {
        logger.warn('SMTP connection test error', { error });
      });
    } catch (error) {
      logger.error('Failed to initialize SMTP service', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      this.isInitialized = false;
    }
  }

  /**
   * Initialize SMTP transporter (legacy sync method)
   */
  private initialize(): void {
    // This method is kept for compatibility but should not be used
    logger.warn('Using legacy sync initialize method, this should not happen');
  }

  /**
   * Send email via SMTP (MailHog)
   */
  async sendEmail(emailData: SMTPEmailData): Promise<SMTPResponse> {
    try {
      // Wait for initialization to complete
      if (this.initializationPromise) {
        await this.initializationPromise;
      }
      
      if (!this.isInitialized || !this.transporter) {
        logger.warn('SMTP not initialized, skipping email send');
        return {
          success: false,
          error: 'SMTP not initialized',
        };
      }

      const mailOptions = {
        from: config.mailjet.senderEmail || 'noreply@domelia.sk',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent || this.stripHtml(emailData.htmlContent),
        headers: {
          'X-Template-Name': emailData.templateName || 'unknown',
          'X-Company-ID': emailData.companyId || 'unknown',
        }
      };

      logger.info('Sending email via SMTP (MailHog)', {
        to: emailData.to,
        subject: emailData.subject,
        templateName: emailData.templateName,
        companyId: emailData.companyId,
      });

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully via SMTP (MailHog)', {
        messageId: result.messageId,
        to: emailData.to,
        subject: emailData.subject,
      });

      return {
        success: true,
        messageId: result.messageId,
      };

    } catch (error) {
      logger.error('Exception while sending email via SMTP (MailHog)', {
        error,
        to: emailData.to,
        subject: emailData.subject,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.transporter) {
        logger.warn('SMTP not initialized, cannot test connection');
        return false;
      }

      await this.transporter.verify();
      logger.info('SMTP connection test successful');
      return true;
    } catch (error) {
      logger.error('SMTP connection test failed', { error });
      return false;
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
    return this.isInitialized && this.transporter !== null;
  }
}

// Export singleton instance
export const smtpService = new SMTPService();
