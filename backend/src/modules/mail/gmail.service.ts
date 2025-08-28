import { google } from 'googleapis';
import logger from '../../utils/logger.js';
import { config } from '../../config/index.js';
import { errorHandler } from '../../utils/errors.js';
import { oauthService } from '../auth/oauth.service.js';
import fs from 'fs';
import path from 'path';

export interface GmailEmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateName?: string;
  companyId?: string;
}

export interface GmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class GmailService {
  private gmail: any = null;
  private isInitialized = false;

  constructor() {
    // Initialize asynchronously
    this.initialize().catch(error => {
      logger.error('Failed to initialize Gmail service in constructor', { error });
    });
  }

  /**
   * Initialize Gmail client
   */
  private async initialize(): Promise<void> {
    try {
      logger.info('Initializing Gmail service...');
      
      // Check if OAuth is available
      const isOAuthAuthenticated = await oauthService.isAuthenticated();
      logger.info(`OAuth authentication status: ${isOAuthAuthenticated}`);
      
      if (isOAuthAuthenticated) {
        logger.info('Using OAuth 2.0 authentication');
        
        // Use OAuth client
        const oauthClient = oauthService.getOAuthClient();
        this.gmail = google.gmail({ version: 'v1', auth: oauthClient });
        this.isInitialized = true;
        
        logger.info('Gmail service initialized with OAuth 2.0');
        return;
      }
      
      // Fallback to Service Account if OAuth is not available
      logger.info('OAuth not available, trying Service Account...');
      
      if (!config.googleCalendar.credentialsPath) {
        logger.warn('Google credentials not configured, using mock mode');
        return;
      }

      // Load credentials from file
      const credentialsPath = path.resolve(config.googleCalendar.credentialsPath);
      
      if (!fs.existsSync(credentialsPath)) {
        logger.error('Google credentials file not found', { path: credentialsPath });
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      logger.info('Credentials loaded successfully', { type: credentials.type });

      // Check if it's Service Account
      if (credentials.type === 'service_account') {
        // Service Account approach
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
          ],
        });

        // For Service Account, we need to impersonate a user
        const userEmail = config.mailjet.senderEmail || 'sales@domelia.sk';
        logger.info('Attempting user impersonation', { userEmail });
        
        try {
          const authClient = await auth.getClient();
          authClient.subject = userEmail;
          logger.info('Service Account configured with user impersonation', { userEmail });
        } catch (error) {
          logger.error('User impersonation failed', { error: error.message, userEmail });
          throw error;
        }
        
        // Create Gmail client
        logger.info('Creating Gmail client...');
        this.gmail = google.gmail({ version: 'v1', auth });
        this.isInitialized = true;
        
        logger.info('Gmail service initialized with Service Account');
      } else {
        logger.warn('Unsupported credentials type, using mock mode');
      }
    } catch (error) {
      logger.error('Failed to initialize Gmail service', { error });
      errorHandler.handleError(error as Error, { context: 'gmail_init' });
    }
  }

  /**
   * Send email via Gmail API
   */
  async sendEmail(emailData: GmailEmailData): Promise<GmailResponse> {
    try {
      if (!this.isInitialized || !this.gmail) {
        logger.warn('Gmail not initialized, skipping email send');
        return {
          success: false,
          error: 'Gmail not initialized',
        };
      }

      // Create email message
      const message = this.createEmailMessage(emailData);

      logger.info('Sending email via Gmail', {
        to: emailData.to,
        subject: emailData.subject,
        templateName: emailData.templateName,
        companyId: emailData.companyId,
      });

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      if (response.data.id) {
        logger.info('Email sent successfully via Gmail', {
          messageId: response.data.id,
          to: emailData.to,
          subject: emailData.subject,
        });

        return {
          success: true,
          messageId: response.data.id,
        };
      } else {
        logger.error('Failed to send email via Gmail - no message ID returned');
        return {
          success: false,
          error: 'No message ID returned from Gmail',
        };
      }
    } catch (error) {
      logger.error('Exception while sending email via Gmail', {
        error,
        to: emailData.to,
        subject: emailData.subject,
      });

      errorHandler.handleError(error as Error, {
        context: 'gmail_send',
        emailData,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create email message in Gmail format
   */
  private createEmailMessage(emailData: GmailEmailData): string {
          const senderEmail = config.mailjet.senderEmail || 'sales@domelia.sk';
    const senderName = config.mailjet.senderName || 'Domelia.sk - Biz Agent';

    const emailLines = [
      `From: ${senderName} <${senderEmail}>`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="boundary"',
      '',
      '--boundary',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      emailData.textContent || this.stripHtml(emailData.htmlContent),
      '',
      '--boundary',
      'Content-Type: text/html; charset=UTF-8',
      '',
      emailData.htmlContent,
      '',
      '--boundary--',
    ];

    const message = emailLines.join('\r\n');
    
    // Encode to base64
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: GmailEmailData[]): Promise<{
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

    logger.info('Sending bulk emails via Gmail', { count: emails.length });

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
   * Test Gmail connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.gmail) {
        logger.warn('Gmail not initialized, cannot test connection');
        return false;
      }

      // Test by getting profile
      const response = await this.gmail.users.getProfile({
        userId: 'me',
      });
      
      if (response.data.emailAddress) {
        logger.info('Gmail connection test successful', {
          email: response.data.emailAddress,
          messagesTotal: response.data.messagesTotal,
        });
        return true;
      } else {
        logger.error('Gmail connection test failed - no email address returned');
        return false;
      }
    } catch (error) {
      logger.error('Gmail connection test failed', { error });
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
      if (!this.isInitialized || !this.gmail) {
        logger.warn('Gmail not initialized, cannot get stats');
        return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
      }

      // Get messages from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)}`,
        maxResults: 100,
      });

      const messages = response.data.messages || [];
      
      logger.info('Retrieved Gmail sending statistics', {
        messagesCount: messages.length,
        timeRange: 'last 30 days',
      });
      
      return {
        sent: messages.length,
        delivered: messages.length, // Gmail doesn't provide delivery stats via API
        opened: 0, // Would need Gmail API for tracking
        clicked: 0, // Would need Gmail API for tracking
        bounced: 0, // Would need Gmail API for tracking
      };
    } catch (error) {
      logger.error('Failed to get Gmail sending statistics', { error });
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
    return this.isInitialized && this.gmail !== null;
  }
}

// Export singleton instance
export const gmailService = new GmailService();
