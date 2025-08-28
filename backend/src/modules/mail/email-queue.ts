import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';
import { config } from '../../config/index.js';
import { mailjetService } from './mailjet.service.js';
import { gmailService } from './gmail.service.js';

export interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  templateName?: string;
  companyId?: string;
  scheduledAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export class EmailQueue {
  private prisma: PrismaClient;
  private isProcessing = false;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Add email to queue (without sending)
   */
  async addToQueue(emailData: Omit<EmailQueueItem, 'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const emailLog = await this.prisma.emailLog.create({
        data: {
          to: emailData.to,
          subject: emailData.subject,
          template: emailData.templateName || 'unknown',
          content: emailData.htmlContent,
          companyId: emailData.companyId,
          // Note: scheduledAt, textContent fields don't exist in schema yet
          // TODO: Add these fields to schema in future migration
          status: 'PENDING',
          retryCount: 0,
          maxRetries: emailData.maxRetries || 3,
        },
      });

      logger.info('Email added to queue', {
        emailId: emailLog.id,
        to: emailData.to,
        subject: emailData.subject,
        templateName: emailData.templateName,
      });

      return emailLog.id;
    } catch (error) {
      logger.error('Failed to add email to queue', { error, emailData });
      throw error;
    }
  }

  /**
   * Get pending emails from queue
   */
  async getPendingEmails(limit = 10): Promise<EmailQueueItem[]> {
    try {
      const emails = await this.prisma.emailLog.findMany({
        where: {
          status: 'PENDING',
          // Note: scheduledAt field doesn't exist in schema yet
          // TODO: Add this field to schema in future migration
        },
        orderBy: {
          sentAt: 'asc',
        },
        take: limit,
      });

      return emails.map(email => ({
        id: email.id,
        to: email.to,
        subject: email.subject,
        htmlContent: email.content || '',
        textContent: '', // Note: textContent field doesn't exist in schema yet
        templateName: email.template || undefined,
        companyId: email.companyId || undefined,
        scheduledAt: undefined, // Note: scheduledAt field doesn't exist in schema yet
        status: email.status,
        retryCount: email.retryCount,
        maxRetries: email.maxRetries,
        createdAt: email.sentAt, // Note: EmailLog doesn't have createdAt, using sentAt
        updatedAt: email.sentAt, // Note: EmailLog doesn't have updatedAt, using sentAt
      }));
    } catch (error) {
      logger.error('Failed to get pending emails', { error });
      throw error;
    }
  }

  /**
   * Mark email as sent (for testing purposes)
   */
  async markAsSent(emailId: string): Promise<void> {
    try {
      await this.prisma.emailLog.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          // Note: sentAt field is already set by default
        },
      });

      logger.info('Email marked as sent', { emailId });
    } catch (error) {
      logger.error('Failed to mark email as sent', { error, emailId });
      throw error;
    }
  }

  /**
   * Mark email as failed
   */
  async markAsFailed(emailId: string, error?: string): Promise<void> {
    try {
      await this.prisma.emailLog.update({
        where: { id: emailId },
        data: {
          status: 'FAILED',
          errorMessage: error,
          retryCount: {
            increment: 1,
          },
        },
      });

      logger.warn('Email marked as failed', { emailId, error });
    } catch (error) {
      logger.error('Failed to mark email as failed', { error, emailId });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    sent: number;
    failed: number;
    total: number;
  }> {
    try {
      const [pending, sent, failed, total] = await Promise.all([
        this.prisma.emailLog.count({ where: { status: 'PENDING' } }),
        this.prisma.emailLog.count({ where: { status: 'SENT' } }),
        this.prisma.emailLog.count({ where: { status: 'FAILED' } }),
        this.prisma.emailLog.count(),
      ]);

      return { pending, sent, failed, total };
    } catch (error) {
      logger.error('Failed to get queue stats', { error });
      throw error;
    }
  }

  /**
   * Process queue (simulate sending)
   */
  async processQueue(): Promise<{ processed: number; sent: number; failed: number }> {
    if (this.isProcessing) {
      logger.warn('Queue processing already in progress');
      return { processed: 0, sent: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let sent = 0;
    let failed = 0;

    try {
      const pendingEmails = await this.getPendingEmails(50);

      logger.info('Processing email queue', { 
        pendingCount: pendingEmails.length,
        mode: config.app.debugMode ? 'debug' : 'production'
      });

      for (const email of pendingEmails) {
        try {
          processed++;

                         // Send email via Gmail if available, otherwise Mailjet, otherwise debug mode
               if (gmailService.isReady() && !config.app.debugMode) {
                 const result = await gmailService.sendEmail({
                   to: email.to,
                   subject: email.subject,
                   htmlContent: email.htmlContent,
                   textContent: email.textContent,
                   templateName: email.templateName,
                   companyId: email.companyId,
                 });

            if (result.success) {
              await this.markAsSent(email.id);
              sent++;
                               logger.info('Email sent via Gmail', {
                   emailId: email.id,
                   messageId: result.messageId,
                   to: email.to,
                   subject: email.subject,
                 });
               } else if (mailjetService.isReady() && !config.app.debugMode) {
                 // Fallback to Mailjet
                 const mailjetResult = await mailjetService.sendEmail({
                   to: email.to,
                   subject: email.subject,
                   htmlContent: email.htmlContent,
                   textContent: email.textContent,
                   templateName: email.templateName,
                   companyId: email.companyId,
                 });

                 if (mailjetResult.success) {
                   await this.markAsSent(email.id);
                   sent++;
                   logger.info('Email sent via Mailjet (fallback)', {
                     emailId: email.id,
                     messageId: mailjetResult.messageId,
                     to: email.to,
                     subject: email.subject,
                   });
                 } else {
                   await this.markAsFailed(email.id, mailjetResult.error);
                   failed++;
                   logger.error('Failed to send email via Mailjet (fallback)', {
                     emailId: email.id,
                     error: mailjetResult.error,
                     to: email.to,
                     subject: email.subject,
                   });
                 }
               } else {
                 // Debug mode or no email service available
                 await this.markAsSent(email.id);
                 sent++;
                 logger.debug('Email would be sent (debug mode or no email service available)', {
                   emailId: email.id,
                   to: email.to,
                   subject: email.subject,
                   gmailReady: gmailService.isReady(),
                   mailjetReady: mailjetService.isReady(),
                   debugMode: config.app.debugMode,
                 });
               }
             }

          // Add delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          failed++;
          await this.markAsFailed(email.id, error instanceof Error ? error.message : String(error));
        }
      }

      logger.info('Queue processing completed', { processed, sent, failed });

    } catch (error) {
      logger.error('Queue processing failed', { error });
    } finally {
      this.isProcessing = false;
    }

    return { processed, sent, failed };
  }

  /**
   * Clean up old emails
   */
  async cleanupOldEmails(daysToKeep = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.emailLog.deleteMany({
        where: {
          sentAt: {
            lt: cutoffDate,
          },
          status: {
            in: ['SENT', 'FAILED'],
          },
        },
      });

      logger.info('Cleaned up old emails', { 
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString()
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old emails', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const emailQueue = new EmailQueue();
