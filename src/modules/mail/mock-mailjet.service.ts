import logger from '@/utils/logger.js';
import { logEmailSent } from '@/utils/logger.js';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  template?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class MockMailjetService {
  private static instance: MockMailjetService;
  private emailCount = 0;

  private constructor() {}

  public static getInstance(): MockMailjetService {
    if (!MockMailjetService.instance) {
      MockMailjetService.instance = new MockMailjetService();
    }
    return MockMailjetService.instance;
  }

  public async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    this.emailCount++;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional failures (5% chance)
    const shouldFail = Math.random() < 0.05;
    
    if (shouldFail) {
      const error = 'Mock Mailjet API error';
      logger.warn('Mock email failed', {
        to: emailData.to,
        subject: emailData.subject,
        error,
        emailCount: this.emailCount,
      });
      
      logEmailSent(emailData.to, emailData.template || 'unknown', false, {
        error,
        mock: true,
      });
      
      return {
        success: false,
        error,
      };
    }
    
    const messageId = `mock_${Date.now()}_${this.emailCount}`;
    
    logger.info('Mock email sent successfully', {
      to: emailData.to,
      subject: emailData.subject,
      messageId,
      emailCount: this.emailCount,
      mock: true,
    });
    
    logEmailSent(emailData.to, emailData.template || 'unknown', true, {
      messageId,
      mock: true,
    });
    
    return {
      success: true,
      messageId,
    };
  }

  public async sendBulkEmails(emails: EmailData[]): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
      
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return results;
  }

  public getStats(): { emailCount: number } {
    return {
      emailCount: this.emailCount,
    };
  }

  public resetStats(): void {
    this.emailCount = 0;
    logger.info('Mock Mailjet stats reset');
  }
}

export const mockMailjetService = MockMailjetService.getInstance();
