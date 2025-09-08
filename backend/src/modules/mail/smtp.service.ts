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

  constructor() {
    this.initialize();
  }

  /**
   * Initialize SMTP transporter
   */
  private initialize(): void {
    try {
      // MailHog SMTP configuration
      this.transporter = nodemailer.createTransporter({
        host: 'localhost',
        port: 1025,
        secure: false, // MailHog doesn't use TLS
        ignoreTLS: true, // Ignore TLS for MailHog
        auth: false // MailHog doesn't require authentication
      });

      this.isInitialized = true;
      logger.info('SMTP service initialized with MailHog');
    } catch (error) {
      logger.error('Failed to initialize SMTP service', { error });
    }
  }

  /**
   * Send email via SMTP (MailHog)
   */
  async sendEmail(emailData: SMTPEmailData): Promise<SMTPResponse> {
    try {
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
