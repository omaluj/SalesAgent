import logger from '../../utils/logger.js';
import { googleCalendarService } from './google-calendar.service.js';
import { prisma } from '../../database/prisma.js';

export interface TimeSlot {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  day: string; // Day name (Pondelok, Utorok, etc.)
  time: string; // Time (10:00, 11:00, etc.)
  available: boolean;
  bookedBy?: string;
  bookedAt?: string;
  googleEventId?: string;
}

export class TimeSlotService {
  private static instance: TimeSlotService;

  public static getInstance(): TimeSlotService {
    if (!TimeSlotService.instance) {
      TimeSlotService.instance = new TimeSlotService();
    }
    return TimeSlotService.instance;
  }

  /**
   * Získa všetky časové okná z Google Calendar
   */
  async getTimeSlots(): Promise<TimeSlot[]> {
    try {
      logger.info('Loading time slots from Google Calendar...');
      
      // Skontrolovať, či je Google Calendar service pripravený
      if (!googleCalendarService.isReady()) {
        logger.warn('Google Calendar service not ready, returning empty slots');
        return [];
      }

      // Získať nasledujúcich 4 týždňov
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 28); // 4 týždne

      // Získať všetky eventy z Google Calendar
      const calendarResponse = await googleCalendarService.getEvents(startDate, endDate);
      
      if (!calendarResponse.success) {
        logger.error('Failed to get Google Calendar events:', calendarResponse.error);
        return [];
      }

      const calendarEvents = calendarResponse.events;
      logger.info('Retrieved events from Google Calendar:', { count: calendarEvents.length });

      // Získať všetky dostupné sloty z Google Calendar
      const slots: TimeSlot[] = [];
      const times = ['10:00', '11:00', '13:00', '14:00', '15:00'];

      // Pre každý deň v nasledujúcich 4 týždňoch
      for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + dayOffset);
        currentDate.setHours(0, 0, 0, 0);
        
        const dayOfWeek = currentDate.getDay(); // 0 = nedeľa, 1 = pondelok, ...
        
        // Len pracovné dni (pondelok = 1, piatok = 5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
          const dayName = dayNames[dayOfWeek];
          const dateString = currentDate.toISOString().split('T')[0];
          
          // Pre každý časový slot
          times.forEach(time => {
            const slotStart = new Date(currentDate);
            const [hour, minute] = time.split(':').map(Number);
            slotStart.setHours(hour, minute, 0, 0);
            
            const slotEnd = new Date(slotStart);
            slotEnd.setHours(slotStart.getHours() + 1);

            // Skontrolovať, či existuje event v Google Calendar pre tento slot
            const matchingEvent = calendarEvents.find(event => {
              const eventStart = new Date(event.start.dateTime || event.start.date);
              const eventEnd = new Date(event.end.dateTime || event.end.date);
              
              // Event sa prekrýva so slotom
              return eventStart < slotEnd && eventEnd > slotStart;
            });

            const slot: TimeSlot = {
              id: `${dateString}-${time}`,
              date: dateString,
              day: dayName,
              time,
              available: !matchingEvent,
              bookedBy: matchingEvent?.attendees?.[0]?.displayName || undefined,
              bookedAt: matchingEvent?.created ? new Date(matchingEvent.created).toISOString() : undefined,
              googleEventId: matchingEvent?.id || undefined
            };

            slots.push(slot);
          });
        }
      }

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
   * Uloží časové okná - synchronizuje s Google Calendar
   */
  async saveTimeSlots(timeSlots: TimeSlot[]): Promise<void> {
    try {
      logger.info('Synchronizing time slots with Google Calendar:', { count: timeSlots.length });
      
      // Skontrolovať, či je Google Calendar service pripravený
      if (!googleCalendarService.isReady()) {
        logger.warn('Google Calendar service not ready, skipping sync');
        return;
      }

      // Pre každý slot skontrolovať Google Calendar zmeny
      for (const slot of timeSlots) {
        if (!slot.available && !slot.googleEventId) {
          // Slot je nedostupný ale nemá Google event - vytvoriť event
          await this.createGoogleCalendarEvent(slot);
        } else if (slot.available && slot.googleEventId) {
          // Slot je dostupný ale má Google event - vymazať event
          await this.deleteGoogleCalendarEvent(slot);
        }
      }
      
      logger.info('Time slots synchronized with Google Calendar successfully');
    } catch (error) {
      logger.error('Error synchronizing time slots with Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Vytvorí event v Google Calendar
   */
  private async createGoogleCalendarEvent(slot: TimeSlot): Promise<void> {
    try {
      // Použiť dátum zo slotu
      const slotDate = new Date(slot.date + 'T' + slot.time + ':00');
      const endDate = new Date(slotDate);
      endDate.setHours(endDate.getHours() + 1); // 1 hodina trvanie
      
      const eventTitle = `Konzultácia - ${slot.day} ${slot.time}`;
      const eventDescription = 'Časové okno pre konzultáciu';
      
      const event = await googleCalendarService.createEvent({
        summary: eventTitle,
        description: eventDescription,
        startTime: slotDate,
        endTime: endDate,
        attendees: []
      });
      
      if (event?.googleEventId) {
        slot.googleEventId = event.googleEventId;
        
        // Aktualizovať googleEventId v databáze
        await prisma.timeSlot.update({
          where: {
            date_time: {
              date: slot.date,
              time: slot.time
            }
          },
          data: {
            googleEventId: event.googleEventId
          }
        });
        
        logger.info('Created Google Calendar event:', {
          date: slot.date,
          day: slot.day,
          time: slot.time,
          eventId: event.googleEventId
        });
      }
      
    } catch (error) {
      logger.error('Error creating Google Calendar event:', error);
    }
  }

  /**
   * Vymaže event z Google Calendar
   */
  private async deleteGoogleCalendarEvent(slot: TimeSlot): Promise<void> {
    try {
      if (slot.googleEventId) {
        await googleCalendarService.deleteEvent(slot.googleEventId);
        
        logger.info('Deleted Google Calendar event:', {
          day: slot.day,
          time: slot.time,
          eventId: slot.googleEventId
        });
        
        slot.googleEventId = undefined;
        
        // Aktualizovať googleEventId v databáze
        await prisma.timeSlot.update({
          where: {
            date_time: {
              date: slot.date,
              time: slot.time
            }
          },
          data: {
            googleEventId: null
          }
        });
      }
      
    } catch (error) {
      logger.error('Error deleting Google Calendar event:', error);
    }
  }



  /**
   * Synchronizuje s Google Calendar
   */
  async syncWithGoogleCalendar(): Promise<void> {
    try {
      logger.info('Syncing with Google Calendar...');
      
      // Získať eventy z Google Calendar
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + 30); // Next 30 days
      
      // Skontrolovať, či je googleCalendarService inicializovaný
      if (!googleCalendarService.isReady()) {
        logger.warn('Google Calendar service not initialized, skipping sync');
        return;
      }
      
      const calendarResponse = await googleCalendarService.getEvents(now, endDate);
      
      if (!calendarResponse.success) {
        logger.warn('Failed to get Google Calendar events:', calendarResponse.error);
        return;
      }
      
      const calendarEvents = calendarResponse.events;
      
      // Aktualizovať sloty podľa Google Calendar
      const timeSlots = await this.getTimeSlots();
      let updatedCount = 0;

      // Pre každý slot skontrolovať, či má zodpovedajúci event v Google Calendar
      for (const slot of timeSlots) {
        const slotDate = new Date(slot.date + 'T' + slot.time + ':00');
        const slotEndDate = new Date(slotDate);
        slotEndDate.setHours(slotEndDate.getHours() + 1); // 1 hodina trvanie
        
        // Hľadať event v Google Calendar pre tento slot
        const matchingEvent = calendarEvents.find(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          
          // Event sa prekrýva so slotom
          return eventStart < slotEndDate && eventEnd > slotDate;
        });
        
        if (matchingEvent) {
          // Event existuje v Google Calendar - slot je obsadený
          if (slot.available) {
            logger.info('Event found in Google Calendar, marking slot as unavailable:', {
              day: slot.day,
              time: slot.time,
              eventId: matchingEvent.googleEventId
            });
            
            slot.available = false;
            slot.googleEventId = matchingEvent.googleEventId;
            updatedCount++;
          }
        } else {
          // Event neexistuje v Google Calendar - slot je dostupný
          if (!slot.available && slot.googleEventId) {
            logger.info('Event not found in Google Calendar, marking slot as available:', {
              day: slot.day,
              time: slot.time
            });
            
            slot.available = true;
            slot.bookedBy = undefined;
            slot.bookedAt = undefined;
            slot.googleEventId = undefined;
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0) {
        await this.saveTimeSlots(timeSlots);
        logger.info('Updated slots from Google Calendar:', { count: updatedCount });
      } else {
        logger.info('No changes needed from Google Calendar sync');
      }

    } catch (error) {
      logger.error('Error syncing with Google Calendar:', error);
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
      slot.bookedBy = undefined;
      slot.bookedAt = undefined;
      slot.googleEventId = undefined;
      
      await this.saveTimeSlots(timeSlots);
      
      logger.info('Booking cancelled:', { day, time });
      return true;
      
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw error;
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

export const timeSlotService = TimeSlotService.getInstance();
