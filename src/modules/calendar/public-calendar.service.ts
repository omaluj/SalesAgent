import { google } from 'googleapis';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/errors.js';
import { oauthService } from '../auth/oauth.service.js';

export interface AvailableSlot {
  start: Date;
  end: Date;
  available: boolean;
  bookedBy?: string;
}

export interface BookingRequest {
  email: string;
  name: string;
  company: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  attendees: string[];
  location?: string;
}

export class PublicCalendarService {
  private calendar: any;
  private isInitialized = false;
  private calendarId: string;

  constructor() {
    this.calendarId = config.googleCalendar.calendarId || 'primary';
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Check if OAuth is available
      const isOAuthAuthenticated = await oauthService.isAuthenticated();
      logger.info(`OAuth authentication status: ${isOAuthAuthenticated}`);
      
      if (isOAuthAuthenticated) {
        logger.info('Using OAuth 2.0 authentication for Calendar');
        
        // Use OAuth client
        const oauthClient = oauthService.getOAuthClient();
        this.calendar = google.calendar({ version: 'v3', auth: oauthClient });
        this.isInitialized = true;
        
        logger.info('Public Calendar Service initialized with OAuth 2.0');
        return;
      }
      
      // Fallback to Service Account if OAuth is not available
      logger.info('OAuth not available, trying Service Account...');
      
      if (!config.googleCalendar.credentialsPath) {
        logger.warn('Google Calendar credentials not configured. Using mock mode.');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: config.googleCalendar.credentialsPath,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      this.isInitialized = true;
      logger.info('Public Calendar Service initialized with Service Account');
    } catch (error) {
      logger.error('Failed to initialize Public Calendar Service:', error);
      ErrorHandler.handle(error);
    }
  }

  /**
   * Získa dostupné časové sloty pre nasledujúcich X dní
   */
  async getAvailableSlots(days: number = 7): Promise<AvailableSlot[]> {
    try {
      if (!this.isInitialized) {
        return this.getMockAvailableSlots(days);
      }

      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + days);

      // Nastavenia pre dostupné časy
      const workStartHour = 9; // 9:00
      const workEndHour = 17; // 17:00
      const slotDuration = 60; // 60 minút
      const bufferTime = 30; // 30 minút buffer medzi stretnutiami

      const slots: AvailableSlot[] = [];
      const currentDate = new Date(now);

      while (currentDate <= endDate) {
        // Preskočiť víkendy (0 = nedeľa, 6 = sobota)
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const dayStart = new Date(currentDate);
          dayStart.setHours(workStartHour, 0, 0, 0);

          const dayEnd = new Date(currentDate);
          dayEnd.setHours(workEndHour, 0, 0, 0);

          // Vytvoriť sloty pre daný deň
          let slotStart = new Date(dayStart);
          while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotStart.getMinutes() + slotDuration);

            // Skontrolovať, či je slot dostupný
            const isAvailable = await this.isSlotAvailable(slotStart, slotEnd);
            
            slots.push({
              start: new Date(slotStart),
              end: new Date(slotEnd),
              available: isAvailable
            });

            // Posunúť na ďalší slot s bufferom
            slotStart.setMinutes(slotStart.getMinutes() + slotDuration + bufferTime);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return slots;
    } catch (error) {
      logger.error('Error getting available slots:', error);
      ErrorHandler.handle(error);
      return this.getMockAvailableSlots(days);
    }
  }

  /**
   * Skontroluje, či je časový slot dostupný
   */
  private async isSlotAvailable(start: Date, end: Date): Promise<boolean> {
    try {
      if (!this.isInitialized) return true;

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return !response.data.items || response.data.items.length === 0;
    } catch (error) {
      logger.error('Error checking slot availability:', error);
      return true; // V prípade chyby predpokladáme, že je dostupný
    }
  }

  /**
   * Rezervuje stretnutie
   */
  async bookMeeting(booking: BookingRequest): Promise<CalendarEvent> {
    try {
      if (!this.isInitialized) {
        return this.createMockBooking(booking);
      }

      const event = {
        summary: `Stretnutie s ${booking.name} (${booking.company})`,
        description: `Stretnutie s ${booking.name} z ${booking.company}\n\nPoznámky: ${booking.notes || 'Žiadne poznámky'}\n\nRezervováno cez Biz-Agent`,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: 'Europe/Bratislava'
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: 'Europe/Bratislava'
        },
        attendees: [
          { email: booking.email },
          { email: 'sales@domelia.sk' }
        ],
        location: 'Online / Domelia.sk',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 deň pred
            { method: 'popup', minutes: 30 } // 30 minút pred
          ]
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
        sendUpdates: 'all' // Poslať pozvánky všetkým účastníkom
      });

      const createdEvent = response.data;
      logger.info(`Meeting booked successfully: ${createdEvent.id}`);

      return {
        id: createdEvent.id!,
        summary: createdEvent.summary!,
        description: createdEvent.description!,
        start: new Date(createdEvent.start!.dateTime!),
        end: new Date(createdEvent.end!.dateTime!),
        attendees: createdEvent.attendees?.map(a => a.email!) || [],
        location: createdEvent.location
      };
    } catch (error) {
      logger.error('Error booking meeting:', error);
      ErrorHandler.handle(error);
      throw new Error('Failed to book meeting');
    }
  }

  /**
   * Získa verejnú URL kalendára
   */
  getPublicCalendarUrl(): string {
    const calendarId = config.googleCalendar.calendarId || 'c_be1d69240ee32df2924e7ad486abc555655f9a344b72c11b835d0c3da21f2426@group.calendar.google.com';
    return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;
  }

  /**
   * Získa embed URL pre webstránku
   */
  getEmbedUrl(): string {
    const calendarId = config.googleCalendar.calendarId || 'c_be1d69240ee32df2924e7ad486abc555655f9a344b72c11b835d0c3da21f2426@group.calendar.google.com';
    return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=Europe%2FBratislava`;
  }

  /**
   * Testuje pripojenie k kalendáru
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        logger.warn('Calendar service not initialized. Using mock mode.');
        return true;
      }

      const response = await this.calendar.calendars.get({
        calendarId: this.calendarId
      });

      logger.info(`Calendar connection test: SUCCESS - ${response.data.summary}`);
      return true;
    } catch (error) {
      logger.error('Calendar connection test: FAILED', error);
      return false;
    }
  }

  /**
   * Získa štatistiky kalendára
   */
  async getCalendarStats(): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    availableSlots: number;
  }> {
    try {
      if (!this.isInitialized) {
        return {
          totalEvents: 0,
          upcomingEvents: 0,
          availableSlots: 24 // Mock hodnota
        };
      }

      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: now.toISOString(),
        timeMax: endOfMonth.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      const availableSlots = await this.getAvailableSlots(7);

      return {
        totalEvents: events.length,
        upcomingEvents: events.filter(e => new Date(e.start!.dateTime!) > now).length,
        availableSlots: availableSlots.filter(s => s.available).length
      };
    } catch (error) {
      logger.error('Error getting calendar stats:', error);
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        availableSlots: 0
      };
    }
  }

  // Mock metódy pre development
  private getMockAvailableSlots(days: number): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      
      // Preskočiť víkendy
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        for (let hour = 9; hour < 17; hour++) {
          const start = new Date(date);
          start.setHours(hour, 0, 0, 0);
          
          const end = new Date(start);
          end.setHours(hour + 1, 0, 0, 0);
          
          slots.push({
            start,
            end,
            available: Math.random() > 0.3 // 70% šanca, že je dostupný
          });
        }
      }
    }
    
    return slots;
  }

  private createMockBooking(booking: BookingRequest): CalendarEvent {
    logger.info(`Mock booking created for ${booking.name} at ${booking.startTime}`);
    
    return {
      id: `mock-${Date.now()}`,
      summary: `Stretnutie s ${booking.name} (${booking.company})`,
      description: booking.notes || 'Mock stretnutie',
      start: booking.startTime,
      end: booking.endTime,
      attendees: [booking.email],
      location: 'Online / Mock'
    };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const publicCalendarService = new PublicCalendarService();
