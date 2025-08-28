import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';
import { emailQueue } from '../../modules/mail/email-queue.js';
import { companyService } from '../../modules/companies/company-service.js';
import { oauthService } from '../../modules/auth/oauth.service.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/dashboard/overview
 * Získa prehľadové metriky pre dashboard
 */
router.get('/overview', async (req, res) => {
  try {
    logger.info('Fetching dashboard overview metrics');

    // Email metrics
    const emailStats = await prisma.emailLog.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const emailMetrics = {
      total: emailStats.reduce((sum, stat) => sum + stat._count.status, 0),
      sent: emailStats.find(s => s.status === 'SENT')?._count.status || 0,
      failed: emailStats.find(s => s.status === 'FAILED')?._count.status || 0,
      pending: emailStats.find(s => s.status === 'PENDING')?._count.status || 0,
    };

    // Company metrics
    const companyStats = await prisma.company.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const companyMetrics = {
      total: companyStats.reduce((sum, stat) => sum + stat._count.status, 0),
      active: companyStats.find(s => s.status === 'ACTIVE')?._count.status || 0,
      contacted: companyStats.find(s => s.status === 'CONTACTED')?._count.status || 0,
      interested: companyStats.find(s => s.status === 'INTERESTED')?._count.status || 0,
    };

    // Calendar metrics
    const calendarStats = await prisma.calendarEvent.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const calendarMetrics = {
      total: calendarStats.reduce((sum, stat) => sum + stat._count.status, 0),
      scheduled: calendarStats.find(s => s.status === 'SCHEDULED')?._count.status || 0,
      completed: calendarStats.find(s => s.status === 'COMPLETED')?._count.status || 0,
      cancelled: calendarStats.find(s => s.status === 'CANCELLED')?._count.status || 0,
    };

    // Recent activity
    const recentEmails = await prisma.emailLog.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' },
      include: {
        company: true
      }
    });

    const recentCompanies = await prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // OAuth status
    const oauthStatus = await oauthService.isAuthenticated();

    // Queue status
    const queueStatus = {
      isProcessing: emailQueue.isProcessing,
      pendingCount: 0, // TODO: Implement getPendingCount method
    };

    res.json({
      success: true,
      data: {
        emailMetrics,
        companyMetrics,
        calendarMetrics,
        recentActivity: {
          emails: recentEmails,
          companies: recentCompanies
        },
        systemStatus: {
          oauth: oauthStatus,
          queue: queueStatus,
          lastPipelineRun: new Date().toISOString(), // TODO: Get from cron service
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard overview'
    });
  }
});

/**
 * GET /api/dashboard/pipeline-status
 * Získa stav pipeline a cron jobu
 */
router.get('/pipeline-status', async (req, res) => {
  try {
    // TODO: Get actual pipeline status from cron service
    const pipelineStatus = {
      isRunning: false,
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
      successRate: 95.5,
      errors: []
    };

    res.json({
      success: true,
      data: pipelineStatus
    });

  } catch (error) {
    logger.error('Error fetching pipeline status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pipeline status'
    });
  }
});

/**
 * GET /api/dashboard/api-health
 * Získa stav všetkých API služieb
 */
router.get('/api-health', async (req, res) => {
  try {
    const healthChecks = {
      oauth: await oauthService.isAuthenticated(),
      gmail: false, // TODO: Check Gmail service
      calendar: false, // TODO: Check Calendar service
      database: true, // TODO: Check database connection
      search: false, // TODO: Check Search API
    };

    res.json({
      success: true,
      data: healthChecks
    });

  } catch (error) {
    logger.error('Error fetching API health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API health'
    });
  }
});

export default router;
