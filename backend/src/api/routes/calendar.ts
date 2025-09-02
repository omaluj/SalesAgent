import { Router } from 'express';
import logger from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { timeSlotService } from '../../modules/calendar/time-slot.service.js';
import { slotGeneratorService } from '../../modules/calendar/slot-generator.service.js';
import { googleCalendarService } from '../../modules/calendar/google-calendar.service.js';

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

/**
 * POST /api/calendar/create-event
 * Vytvorí Google Calendar event pre slot
 */
router.post('/create-event', async (req, res) => {
  try {
    const { slotId, title, description, startTime, endTime } = req.body;
    
    logger.info('Creating Google Calendar event:', { slotId, title, startTime, endTime });
    
    // Vytvoriť event v Google Calendar
    const event = await googleCalendarService.createEvent({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees: []
    });
    
    if (event?.success && event?.eventId) {
      logger.info('Google Calendar event created successfully:', { eventId: event.eventId });
      
      res.json({
        success: true,
        data: {
          eventId: event.eventId,
          meetingLink: event.meetingLink,
          message: 'Event created successfully'
        }
      });
    } else {
      logger.error('Failed to create Google Calendar event:', { error: event?.error });
      
      res.status(500).json({
        success: false,
        error: event?.error || 'Failed to create event'
      });
    }
  } catch (error) {
    logger.error('Error creating Google Calendar event:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/calendar/generate-slots
 * Manuálne spustí generovanie Google Calendar slotov
 */
router.post('/generate-slots', async (req, res) => {
  try {
    logger.info('🔧 Manuálne generovanie slotov spustené cez API...');
    
    const result = await slotGeneratorService.manualGenerate();
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          message: result.message,
          created: result.created,
          errors: result.errors
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Error in manual slot generation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/calendar/check-slots
 * Kontroluje stav slotov a vráti analýzu
 */
router.post('/check-slots', async (req, res) => {
  try {
    logger.info('🔍 Kontrola stavu slotov spustená cez API...');
    
    await slotGeneratorService.checkAndGenerateSlots();
    
    res.json({
      success: true,
      data: {
        message: 'Kontrola slotov dokončená'
      }
    });
  } catch (error) {
    logger.error('Error in slot check:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/calendar/delete-event
 * Vymaže Google Calendar event
 */
router.post('/delete-event', async (req, res) => {
  try {
    const { eventId } = req.body;
    
    logger.info('Deleting Google Calendar event:', { eventId });
    
    // Vymazať event z Google Calendar
    const deleteResponse = await googleCalendarService.deleteEvent(eventId);
    
    if (deleteResponse?.success) {
      logger.info('Google Calendar event deleted successfully:', { eventId });
      
      res.json({
        success: true,
        data: {
          message: 'Event deleted successfully'
        }
      });
    } else {
      logger.error('Failed to delete Google Calendar event:', { error: deleteResponse?.error });
      
      res.status(500).json({
        success: false,
        error: deleteResponse?.error || 'Failed to delete event'
      });
    }
  } catch (error) {
    logger.error('Error deleting Google Calendar event:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/calendar/get-events
 * Získa všetky eventy z Google Calendar
 */
router.get('/get-events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    logger.info('Getting Google Calendar events:', { startDate, endDate });
    
    // Získať eventy z Google Calendar
    const eventsResponse = await googleCalendarService.getEvents(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    if (eventsResponse.success) {
      logger.info('Google Calendar events retrieved successfully:', { count: eventsResponse.events.length });
      
      res.json({
        success: true,
        data: {
          events: eventsResponse.events,
          count: eventsResponse.events.length
        }
      });
    } else {
      logger.error('Failed to get Google Calendar events:', { error: eventsResponse.error });
      
      res.status(500).json({
        success: false,
        error: eventsResponse.error || 'Failed to get events'
      });
    }
  } catch (error) {
    logger.error('Error getting Google Calendar events:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/calendar/clear-all-slots
 * Vymaže všetky sloty z databázy
 */
router.post('/clear-all-slots', async (req, res) => {
  try {
    logger.info('Clearing all time slots from database...');
    
    // Vymazať všetky sloty z databázy
    const result = await prisma.timeSlot.deleteMany({});
    
    logger.info('All time slots cleared from database:', { deleted: result.count });
    
    res.json({
      success: true,
      data: {
        deleted: result.count,
        message: 'All time slots cleared successfully'
      }
    });
  } catch (error) {
    logger.error('Error clearing time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/calendar/create-100-slots
 * Vytvorí 100 nových slotov
 */
router.post('/create-100-slots', async (req, res) => {
  try {
    const { count = 100 } = req.body;
    
    logger.info('Creating new time slots:', { count });
    
    let createdCount = 0;
    let googleEventsCount = 0;
    let errorsCount = 0;
    
    // Vytvoriť sloty pre ďalších 20 týždňov (100 slotov = 20 týždňov × 5 slotov/týždeň)
    const startDate = new Date();
    const dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
    const timeSlots = ['10:00', '11:00', '13:00', '14:00', '15:00'];
    
    // Nájsť ďalší pondelok
    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== 1) { // 1 = Pondelok
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    for (let week = 0; week < 20 && createdCount < count; week++) {
      for (let dayOfWeek = 1; dayOfWeek <= 5 && createdCount < count; dayOfWeek++) { // Pondelok - Piatok (1-5)
        for (let timeIndex = 0; timeIndex < timeSlots.length && createdCount < count; timeIndex++) {
          try {
            const slotDate = new Date(currentDate);
            slotDate.setDate(currentDate.getDate() + dayOfWeek - 1); // -1 pretože začíname od pondelka
            
            const dateStr = slotDate.toISOString().split('T')[0];
            const dayName = dayNames[slotDate.getDay()];
            const time = timeSlots[timeIndex];
            
            // Vytvoriť slot v databáze
            const slot = await prisma.timeSlot.create({
              data: {
                date: dateStr,
                day: dayName,
                time: time,
                available: true
              }
            });
            
            createdCount++;
            
            // Vytvoriť Google Calendar event
            try {
              const eventStartTime = new Date(dateStr + 'T' + time + ':00');
              const eventEndTime = new Date(eventStartTime);
              eventEndTime.setHours(eventEndTime.getHours() + 1);

              const eventTitle = `Dostupné časové okno - ${dayName} ${time}`;
              const eventDescription = 'Časové okno pre konzultáciu. Rezervujte si termín cez náš web.';

              const event = await googleCalendarService.createEvent({
                title: eventTitle,
                description: eventDescription,
                startTime: eventStartTime,
                endTime: eventEndTime,
                attendees: []
              });

              if (event?.success && event?.eventId) {
                // Aktualizovať slot s Google event ID
                await prisma.timeSlot.update({
                  where: { id: slot.id },
                  data: { googleEventId: event.eventId }
                });
                
                googleEventsCount++;
                logger.info(`✅ Vytvorený slot ${createdCount}/${count}: ${dateStr} ${time} (${dayName})`);
              } else {
                errorsCount++;
                logger.error(`❌ Chyba pri vytváraní Google event pre ${dateStr} ${time}: ${event?.error}`);
              }
              
              // Rate limiting - pauza 1 sekunda
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              errorsCount++;
              logger.error(`❌ Chyba pri vytváraní Google event pre ${dateStr} ${time}:`, error);
            }
            
          } catch (error) {
            errorsCount++;
            logger.error(`❌ Chyba pri vytváraní slotu:`, error);
          }
        }
      }
      
      // Presunúť sa na ďalší týždeň (pondelok)
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    logger.info('Time slots creation completed:', { 
      created: createdCount, 
      googleEvents: googleEventsCount, 
      errors: errorsCount 
    });
    
    res.json({
      success: true,
      data: {
        created: createdCount,
        googleEvents: googleEventsCount,
        errors: errorsCount,
        message: 'Time slots created successfully'
      }
    });
  } catch (error) {
    logger.error('Error creating time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/calendar/create-clean-slots
 * Vytvorí čisté sloty bez duplicitov
 */
router.post('/create-clean-slots', async (req, res) => {
  try {
    const { count = 100 } = req.body;
    
    logger.info('Creating clean time slots without duplicates:', { count });
    
    let createdCount = 0;
    let googleEventsCount = 0;
    let errorsCount = 0;
    let skippedDuplicates = 0;
    
    // Vytvoriť sloty pre ďalších 20 týždňov (100 slotov = 20 týždňov × 5 slotov/týždeň)
    const startDate = new Date();
    const dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
    const timeSlots = ['10:00', '11:00', '13:00', '14:00', '15:00'];
    
    // Nájsť ďalší pondelok
    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== 1) { // 1 = Pondelok
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Set na sledovanie už vytvorených kombinácií dátum + čas
    const createdSlots = new Set();
    
    for (let week = 0; week < 20 && createdCount < count; week++) {
      for (let dayOfWeek = 1; dayOfWeek <= 5 && createdCount < count; dayOfWeek++) { // Pondelok - Piatok (1-5)
        for (let timeIndex = 0; timeIndex < timeSlots.length && createdCount < count; timeIndex++) {
          try {
            const slotDate = new Date(currentDate);
            slotDate.setDate(currentDate.getDate() + dayOfWeek - 1); // -1 pretože začíname od pondelka
            
            const dateStr = slotDate.toISOString().split('T')[0];
            const dayName = dayNames[slotDate.getDay()];
            const time = timeSlots[timeIndex];
            
            // Kontrola duplicitov
            const slotKey = `${dateStr}_${time}`;
            if (createdSlots.has(slotKey)) {
              skippedDuplicates++;
              logger.warn(`⚠️  Preskočený duplicitný slot: ${dateStr} ${time} (${dayName})`);
              continue;
            }
            
            // Skontrolovať, či už existuje v databáze
            const existingSlot = await prisma.timeSlot.findFirst({
              where: {
                date: dateStr,
                time: time
              }
            });
            
            if (existingSlot) {
              skippedDuplicates++;
              logger.warn(`⚠️  Preskočený existujúci slot: ${dateStr} ${time} (${dayName})`);
              continue;
            }
            
            // Vytvoriť slot v databáze
            const slot = await prisma.timeSlot.create({
              data: {
                date: dateStr,
                day: dayName,
                time: time,
                available: true
              }
            });
            
            createdSlots.add(slotKey);
            createdCount++;
            
            // Vytvoriť Google Calendar event
            try {
              const eventStartTime = new Date(dateStr + 'T' + time + ':00');
              const eventEndTime = new Date(eventStartTime);
              eventEndTime.setHours(eventEndTime.getHours() + 1);

              const eventTitle = `Dostupné časové okno - ${dayName} ${time}`;
              const eventDescription = 'Časové okno pre konzultáciu. Rezervujte si termín cez náš web.';

              const event = await googleCalendarService.createEvent({
                title: eventTitle,
                description: eventDescription,
                startTime: eventStartTime,
                endTime: eventEndTime,
                attendees: []
              });

              if (event?.success && event?.eventId) {
                // Aktualizovať slot s Google event ID
                await prisma.timeSlot.update({
                  where: { id: slot.id },
                  data: { googleEventId: event.eventId }
                });
                
                googleEventsCount++;
                logger.info(`✅ Vytvorený čistý slot ${createdCount}/${count}: ${dateStr} ${time} (${dayName})`);
              } else {
                errorsCount++;
                logger.error(`❌ Chyba pri vytváraní Google event pre ${dateStr} ${time}: ${event?.error}`);
              }
              
              // Rate limiting - pauza 1 sekunda
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              errorsCount++;
              logger.error(`❌ Chyba pri vytváraní Google event pre ${dateStr} ${time}:`, error);
            }
            
          } catch (error) {
            errorsCount++;
            logger.error(`❌ Chyba pri vytváraní slotu:`, error);
          }
        }
      }
      
      // Presunúť sa na ďalší týždeň (pondelok)
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    logger.info('Clean time slots creation completed:', { 
      created: createdCount, 
      googleEvents: googleEventsCount, 
      errors: errorsCount,
      skippedDuplicates: skippedDuplicates
    });
    
    res.json({
      success: true,
      data: {
        created: createdCount,
        googleEvents: googleEventsCount,
        errors: errorsCount,
        skippedDuplicates: skippedDuplicates,
        message: 'Clean time slots created successfully'
      }
    });
  } catch (error) {
    logger.error('Error creating clean time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
