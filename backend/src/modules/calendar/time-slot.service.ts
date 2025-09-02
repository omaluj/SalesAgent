import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';
import { googleCalendarService } from './google-calendar.service.js';
import { prisma } from '../../database/prisma.js';

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD format
  day: string; // Názov dňa (Pondelok, Utorok, etc.)
  time: string; // Čas (10:00, 11:00, etc.)
  available: boolean;
  bookedBy?: string | null;
  bookedAt?: string | null;
  googleEventId?: string | null;
}

export class TimeSlotService {
  /**
   * Získa časové okná - generuje ich z Google Calendar
   */
  async getTimeSlots(): Promise<TimeSlot[]> {
    try {
      logger.info('Loading time slots from Google Calendar...');
      
      if (!googleCalendarService.isReady()) {
        logger.warn('Google Calendar service not ready, returning empty slots');
        return [];
      }

      // Získať všetky sloty z databázy
      const dbSlots = await prisma.timeSlot.findMany({
        orderBy: [
          { date: 'asc' },
          { time: 'asc' }
        ]
      });
      
      logger.info('Retrieved slots from database:', { count: dbSlots.length });
      
      // Získať eventy z Google Calendar pre synchronizáciu
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 28); // 4 týždne

      const calendarResponse = await googleCalendarService.getEvents(startDate, endDate);
      
      if (!calendarResponse.success) {
        logger.error('Failed to get Google Calendar events:', calendarResponse.error);
        // Pokračovať len s databázovými slotmi
        return dbSlots.map(dbSlot => ({
          id: dbSlot.id,
          date: dbSlot.date,
          day: dbSlot.day,
          time: dbSlot.time,
          available: dbSlot.available,
          bookedBy: dbSlot.bookedBy,
          bookedAt: dbSlot.bookedAt?.toISOString() || null,
          googleEventId: dbSlot.googleEventId
        }));
      }

      const calendarEvents = calendarResponse.events;
      logger.info('Retrieved events from Google Calendar:', { count: calendarEvents.length });

      // Mapovať databázové sloty a synchronizovať s Google Calendar
      const slots: TimeSlot[] = dbSlots.map(dbSlot => {
        // Nájsť zodpovedajúci event v Google Calendar
        const slotStart = new Date(dbSlot.date + 'T' + dbSlot.time + ':00');
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 1);

        const matchingEvent = calendarEvents.find(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          return eventStart < slotEnd && eventEnd > slotStart;
        });

                 return {
           id: dbSlot.id,
           date: dbSlot.date,
           day: dbSlot.day,
           time: dbSlot.time,
           available: dbSlot.available, // Použiť dostupnosť z databázy
           bookedBy: dbSlot.bookedBy,
           bookedAt: dbSlot.bookedAt?.toISOString() || null,
           googleEventId: matchingEvent?.id || dbSlot.googleEventId
         };
      });

      logger.info('Generated time slots from Google Calendar:', { 
        count: slots.length,
        available: slots.filter(s => s.available).length,
        booked: slots.filter(s => !s.available).length
      });

      return slots;
    } catch (error) {
      logger.error('Error getting time slots from Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Vytvorí event v Google Calendar s rate limiting
   */
  private async createGoogleCalendarEvent(slot: TimeSlot): Promise<void> {
    try {
      // Rate limiting - pauza 1 sekunda medzi eventmi
      await new Promise(resolve => setTimeout(resolve, 1000));

      const slotDate = new Date(slot.date + 'T' + slot.time + ':00');
      const endDate = new Date(slotDate);
      endDate.setHours(endDate.getHours() + 1);

      const eventTitle = `Dostupné časové okno - ${slot.day} ${slot.time}`;
      const eventDescription = 'Časové okno pre konzultáciu. Rezervujte si termín cez náš web.';

      const event = await googleCalendarService.createEvent({
        title: eventTitle,
        description: eventDescription,
        startTime: slotDate,
        endTime: endDate,
        attendees: []
      });

      if (event?.success && event?.eventId) {
        logger.info('Created Google Calendar event:', {
          date: slot.date,
          day: slot.day,
          time: slot.time,
          eventId: event.eventId
        });
      } else {
        logger.error('Failed to create Google Calendar event for slot:', {
          date: slot.date,
          day: slot.day,
          time: slot.time,
          error: event?.error
        });
      }
    } catch (error) {
      logger.error('Error creating Google Calendar event:', error);
    }
  }

  /**
   * Uloží časové okná - synchronizuje s Google Calendar
   */
  async saveTimeSlots(timeSlots: TimeSlot[]): Promise<void> {
    try {
      logger.info('Saving time slots:', { count: timeSlots.length });
      
      // Pre každý slot uložiť do databázy
      for (const slot of timeSlots) {
        await prisma.timeSlot.upsert({
          where: { id: slot.id },
          update: {
            date: slot.date,
            day: slot.day,
            time: slot.time,
            available: slot.available,
            bookedBy: slot.bookedBy || null,
            bookedAt: slot.bookedAt ? new Date(slot.bookedAt) : null,
            googleEventId: slot.googleEventId || null
          },
          create: {
            id: slot.id,
            date: slot.date,
            day: slot.day,
            time: slot.time,
            available: slot.available,
            bookedBy: slot.bookedBy || null,
            bookedAt: slot.bookedAt ? new Date(slot.bookedAt) : null,
            googleEventId: slot.googleEventId || null
          }
        });
      }
      
      logger.info('Time slots saved successfully');
    } catch (error) {
      logger.error('Error saving time slots:', error);
      throw error;
    }
  }

  /**
   * Synchronizuje s Google Calendar
   */
  async syncWithGoogleCalendar(): Promise<void> {
    try {
      logger.info('Syncing with Google Calendar...');
      
      if (!googleCalendarService.isReady()) {
        logger.warn('Google Calendar service not ready, skipping sync');
        return;
      }
      
      // Získať sloty z databázy
      const dbSlots = await prisma.timeSlot.findMany();
      
      // Získať eventy z Google Calendar
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 28);
      
      const calendarResponse = await googleCalendarService.getEvents(startDate, endDate);
      
      if (!calendarResponse.success) {
        logger.error('Failed to get Google Calendar events:', calendarResponse.error);
        return;
      }
      
      const calendarEvents = calendarResponse.events;
      
      // Aktualizovať sloty podľa Google Calendar
      for (const slot of dbSlots) {
        const slotStart = new Date(slot.date + 'T' + slot.time + ':00');
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 1);
        
        const matchingEvent = calendarEvents.find(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          return eventStart < slotEnd && eventEnd > slotStart;
        });
        
        if (matchingEvent) {
          // Slot je obsadený
          await prisma.timeSlot.update({
            where: { id: slot.id },
            data: {
              available: false,
              bookedBy: matchingEvent.attendees?.[0]?.displayName || 'Neznámy',
              bookedAt: new Date(),
              googleEventId: matchingEvent.id
            }
          });
        } else {
          // Slot je dostupný
          await prisma.timeSlot.update({
            where: { id: slot.id },
            data: {
              available: true,
              bookedBy: null,
              bookedAt: null,
              googleEventId: null
            }
          });
        }
      }
      
      logger.info('Sync with Google Calendar completed');
    } catch (error) {
      logger.error('Error syncing with Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Rezervuje časové okno
   */
  async bookSlot(day: string, time: string, bookedBy: string): Promise<boolean> {
    try {
      const timeSlots = await this.getTimeSlots();
      const slot = timeSlots.find(s => s.day === day && s.time === time);
      
      if (!slot) {
        throw new Error(`Slot not found: ${day} ${time}`);
      }
      
      if (!slot.available) {
        return false; // Slot už je obsadený
      }
      
      // Rezervovať slot
      slot.available = false;
      slot.bookedBy = bookedBy;
      slot.bookedAt = new Date().toISOString();
      
      await this.saveTimeSlots(timeSlots);
      
      logger.info('Slot booked:', { day, time, bookedBy });
      return true;
      
    } catch (error) {
      logger.error('Error booking slot:', error);
      throw error;
    }
  }

  /**
   * Zruší rezerváciu
   */
  async cancelBooking(day: string, time: string): Promise<boolean> {
    try {
      const timeSlots = await this.getTimeSlots();
      const slot = timeSlots.find(s => s.day === day && s.time === time);
      
      if (!slot || slot.available) {
        return false; // Slot neexistuje alebo je už voľný
      }
      
      // Zrušiť rezerváciu
      slot.available = true;
      slot.bookedBy = null;
      slot.bookedAt = null;
      slot.googleEventId = null;
      
      await this.saveTimeSlots(timeSlots);
      
      logger.info('Booking cancelled:', { day, time });
      return true;
      
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Rezervuje časové okno v Google Calendar
   */
  async bookSlotInGoogleCalendar(slotId: string, attendeeInfo: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
  }): Promise<boolean> {
    try {
      logger.info('Booking slot in Google Calendar:', { slotId, attendeeInfo });

      // Získať slot z generovaných slotov
      const timeSlots = await this.getTimeSlots();
      const slot = timeSlots.find(s => s.id === slotId);

      if (!slot) {
        logger.error('Slot not found:', { slotId });
        return false;
      }

      if (!slot.available) {
        logger.error('Slot is not available:', { slotId });
        return false;
      }

      // Ak slot už má Google event ID, aktualizovať ho
      logger.info('Checking slot for booking:', { slotId, hasGoogleEventId: !!slot.googleEventId });
      if (slot.googleEventId) {
        const slotDate = new Date(slot.date + 'T' + slot.time + ':00');
        const endDate = new Date(slotDate);
        endDate.setHours(endDate.getHours() + 1);

        const eventTitle = `Rezervovaný termín - ${attendeeInfo.name}`;
        const eventDescription = `
Rezervácia konzultácie

Zákazník: ${attendeeInfo.name}
Email: ${attendeeInfo.email}
Telefón: ${attendeeInfo.phone || 'Neuvedený'}
Firma: ${attendeeInfo.company || 'Neuvedená'}

Správa: ${attendeeInfo.message || 'Žiadna správa'}

Rezervované cez Biz-Agent systém.
        `.trim();

        logger.info('Updating existing Google Calendar event:', { eventId: slot.googleEventId });
        const event = await googleCalendarService.updateEvent(slot.googleEventId, {
          title: eventTitle,
          description: eventDescription,
          startTime: slotDate,
          endTime: endDate,
          attendees: [attendeeInfo.email]
        });

        if (event?.success) {
          logger.info('Google Calendar event updated successfully, updating database...');
          logger.info('Upserting slot in database:', { slotId, date: slot.date, time: slot.time });
          
          // Skontrolovať, či slot už existuje v databáze
          const existingSlot = await prisma.timeSlot.findUnique({
            where: { id: slotId }
          });
          
          // Skontrolovať, či existuje slot s rovnakým dátumom a časom
          const existingSlotByDate = await prisma.timeSlot.findFirst({
            where: { 
              date: slot.date,
              time: slot.time
            }
          });
          
          logger.info('Existing slot in database:', { 
            exists: !!existingSlot, 
            slotId,
            existsByDate: !!existingSlotByDate,
            dateTimeId: existingSlotByDate?.id
          });
          
          // Aktualizovať slot v databáze
          if (existingSlotByDate) {
            // Aktualizovať existujúci slot
            await prisma.timeSlot.update({
              where: { id: existingSlotByDate.id },
              data: {
                available: false,
                bookedBy: attendeeInfo.name,
                bookedAt: new Date(),
                googleEventId: slot.googleEventId
              }
            });
            logger.info('Updated existing slot in database:', { slotId: existingSlotByDate.id });
          } else {
            // Vytvoriť nový slot
            await prisma.timeSlot.create({
              data: {
                id: slotId,
                date: slot.date,
                day: slot.day,
                time: slot.time,
                available: false,
                bookedBy: attendeeInfo.name,
                bookedAt: new Date(),
                googleEventId: slot.googleEventId
              }
            });
            logger.info('Created new slot in database:', { slotId });
          }

          logger.info('Slot booked successfully in Google Calendar:', {
            slotId,
            eventId: slot.googleEventId,
            attendee: attendeeInfo.name
          });

          return true;
        } else {
          logger.error('Failed to update Google Calendar event:', {
            slotId,
            error: event?.error
          });
          return false;
        }
      } else {
        // Vytvoriť nový event v Google Calendar s attendee
        const slotDate = new Date(slot.date + 'T' + slot.time + ':00');
        const endDate = new Date(slotDate);
        endDate.setHours(endDate.getHours() + 1);

        const eventTitle = `Rezervovaný termín - ${attendeeInfo.name}`;
        const eventDescription = `
Rezervácia konzultácie

Zákazník: ${attendeeInfo.name}
Email: ${attendeeInfo.email}
Telefón: ${attendeeInfo.phone || 'Neuvedený'}
Firma: ${attendeeInfo.company || 'Neuvedená'}

Správa: ${attendeeInfo.message || 'Žiadna správa'}

Rezervované cez Biz-Agent systém.
        `.trim();

        const event = await googleCalendarService.createEvent({
          title: eventTitle,
          description: eventDescription,
          startTime: slotDate,
          endTime: endDate,
          attendees: [attendeeInfo.email]
        });

      if (event?.success && event?.eventId) {
        // Aktualizovať slot v databáze
        await prisma.timeSlot.upsert({
          where: { id: slotId },
          update: {
            available: false,
            bookedBy: attendeeInfo.name,
            bookedAt: new Date(),
            googleEventId: event.eventId
          },
          create: {
            id: slotId,
            date: slot.date,
            day: slot.day,
            time: slot.time,
            available: false,
            bookedBy: attendeeInfo.name,
            bookedAt: new Date(),
            googleEventId: event.eventId
          }
        });

        logger.info('Slot booked successfully in Google Calendar:', {
          slotId,
          eventId: event.eventId,
          attendee: attendeeInfo.name
        });

        return true;
      } else {
        logger.error('Failed to create Google Calendar event:', {
          slotId,
          error: event?.error
        });
        return false;
      }
      }
    } catch (error) {
      logger.error('Error booking slot in Google Calendar:', error);
      return false;
    }
  }


  /**
   * Formátuje čas
   */
  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Parsuje čas
   */
  private parseTime(time: string): { hour: number; minute: number } {
    const parts = time.split(':');
    const hour = parseInt(parts[0] || '0', 10);
    const minute = parseInt(parts[1] || '0', 10);
    return { hour, minute };
  }


}

export const timeSlotService = new TimeSlotService();
