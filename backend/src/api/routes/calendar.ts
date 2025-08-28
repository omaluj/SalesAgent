import { Router } from 'express';
import logger from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { timeSlotService } from '../../modules/calendar/time-slot.service.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/calendar/events
 * Získa calendar events
 */
router.get('/events', async (req, res) => {
  try {
    const events = await prisma.calendarEvent.findMany({
      include: {
        company: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error in calendar events endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/calendar/settings
 * Získa kalendár nastavenia
 */
router.get('/settings', async (req, res) => {
  try {
    // Získať sloty z timeSlotService
    const timeSlots = await timeSlotService.getTimeSlots();
    
    logger.info('Retrieved time slots from service:', { count: timeSlots.length });

    res.json({
      success: true,
      data: {
        timeSlots: timeSlots,
        settings: {
          workingDays: ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok'],
          workingHours: ['10:00', '11:00', '13:00', '14:00', '15:00'],
          timezone: 'Europe/Bratislava'
        }
      }
    });
  } catch (error) {
    logger.error('Error in calendar settings endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/calendar/settings
 * Uloží kalendár nastavenia
 */
router.post('/settings', async (req, res) => {
  try {
    const { timeSlots } = req.body;
    
    logger.info('Saving calendar settings:', { timeSlotsCount: timeSlots?.length });
    
    await timeSlotService.saveTimeSlots(timeSlots);
    
    res.json({
      success: true,
      data: {
        message: 'Calendar settings saved successfully',
        timeSlots
      }
    });
  } catch (error) {
    logger.error('Error saving calendar settings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});



/**
 * POST /api/calendar/sync-google
 * Synchronizuje s Google Calendar
 */
router.post('/sync-google', async (req, res) => {
  try {
    logger.info('Manually syncing with Google Calendar');
    
    await timeSlotService.syncWithGoogleCalendar();
    
    res.json({
      success: true,
      data: {
        message: 'Synced with Google Calendar successfully'
      }
    });
  } catch (error) {
    logger.error('Error syncing with Google Calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
