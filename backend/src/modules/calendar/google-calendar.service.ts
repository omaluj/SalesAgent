import { google } from 'googleapis';
import logger from '../../utils/logger.js';
import { config } from '../../config/index.js';
import { errorHandler } from '../../utils/errors.js';
import fs from 'fs';
import path from 'path';

export interface CalendarEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  meetingLink?: string;
  companyId?: string;
}

export interface CalendarEventResponse {
  success: boolean;
  eventId?: string;
  meetingLink?: string;
  error?: string;
}

export class GoogleCalendarService {
  private calendar: any = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Google Calendar client
   */
  private async initialize(): Promise<void> {
    try {
      if (!config.googleCalendar.credentialsPath) {
        logger.warn('Google Calendar credentials not configured, using mock mode');
        return;
      }

      // Load credentials from file
      const credentialsPath = path.resolve(config.googleCalendar.credentialsPath);
      
      if (!fs.existsSync(credentialsPath)) {
        logger.error('Google Calendar credentials file not found', { path: credentialsPath });
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

      // Create auth client
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
      });

      // Create calendar client
      this.calendar = google.calendar({ version: 'v3', auth });
      this.isInitialized = true;

      logger.info('Google Calendar service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Google Calendar service', { error });
      errorHandler.handleError(error as Error, { context: 'google_calendar_init' });
    }
  }

  /**
   * Create calendar event
   */
  async createEvent(eventData: CalendarEventData): Promise<CalendarEventResponse> {
    try {
      if (!this.isInitialized || !this.calendar) {
        logger.warn('Google Calendar not initialized, skipping event creation');
        return {
          success: false,
          error: 'Google Calendar not initialized',
        };
      }

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: 'Europe/Bratislava',
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: 'Europe/Bratislava',
        },
        attendees: eventData.attendees?.map(email => ({ email })) || [],
        location: eventData.location || '',
        conferenceData: {
          createRequest: {
            requestId: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
        extendedProperties: {
          private: {
            companyId: eventData.companyId || 'unknown',
            source: 'biz-agent',
          },
        },
      };

      logger.info('Creating Google Calendar event', {
        title: eventData.title,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        attendees: eventData.attendees,
        companyId: eventData.companyId,
      });

      const response = await this.calendar.events.insert({
        calendarId: config.googleCalendar.calendarId || 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });

      if (response.data.id) {
        const meetingLink = response.data.conferenceData?.entryPoints?.[0]?.uri;
        
        logger.info('Google Calendar event created successfully', {
          eventId: response.data.id,
          meetingLink,
          title: eventData.title,
          companyId: eventData.companyId,
        });

        return {
          success: true,
          eventId: response.data.id,
          meetingLink,
        };
      } else {
        logger.error('Failed to create Google Calendar event - no event ID returned');
        return {
          success: false,
          error: 'No event ID returned from Google Calendar',
        };
      }
    } catch (error) {
      logger.error('Exception while creating Google Calendar event', {
        error,
        title: eventData.title,
        companyId: eventData.companyId,
      });

      errorHandler.handleError(error as Error, {
        context: 'google_calendar_create',
        eventData,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEventData>): Promise<CalendarEventResponse> {
    try {
      if (!this.isInitialized || !this.calendar) {
        logger.warn('Google Calendar not initialized, skipping event update');
        return {
          success: false,
          error: 'Google Calendar not initialized',
        };
      }

      const event: any = {};

      if (updates.title) event.summary = updates.title;
      if (updates.description) event.description = updates.description;
      if (updates.startTime) event.start = { dateTime: updates.startTime.toISOString(), timeZone: 'Europe/Bratislava' };
      if (updates.endTime) event.end = { dateTime: updates.endTime.toISOString(), timeZone: 'Europe/Bratislava' };
      if (updates.attendees) event.attendees = updates.attendees.map(email => ({ email }));
      if (updates.location) event.location = updates.location;

      logger.info('Updating Google Calendar event', {
        eventId,
        updates: Object.keys(updates),
      });

      const response = await this.calendar.events.update({
        calendarId: config.googleCalendar.calendarId || 'primary',
        eventId,
        resource: event,
        sendUpdates: 'all',
      });

      if (response.data.id) {
        logger.info('Google Calendar event updated successfully', {
          eventId: response.data.id,
          title: response.data.summary,
        });

        return {
          success: true,
          eventId: response.data.id,
        };
      } else {
        logger.error('Failed to update Google Calendar event - no event ID returned');
        return {
          success: false,
          error: 'No event ID returned from Google Calendar',
        };
      }
    } catch (error) {
      logger.error('Exception while updating Google Calendar event', {
        error,
        eventId,
      });

      errorHandler.handleError(error as Error, {
        context: 'google_calendar_update',
        eventId,
        updates,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(eventId: string): Promise<CalendarEventResponse> {
    try {
      if (!this.isInitialized || !this.calendar) {
        logger.warn('Google Calendar not initialized, skipping event deletion');
        return {
          success: false,
          error: 'Google Calendar not initialized',
        };
      }

      logger.info('Deleting Google Calendar event', { eventId });

      await this.calendar.events.delete({
        calendarId: config.googleCalendar.calendarId || 'primary',
        eventId,
        sendUpdates: 'all',
      });

      logger.info('Google Calendar event deleted successfully', { eventId });

      return {
        success: true,
        eventId,
      };
    } catch (error) {
      logger.error('Exception while deleting Google Calendar event', {
        error,
        eventId,
      });

      errorHandler.handleError(error as Error, {
        context: 'google_calendar_delete',
        eventId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get calendar events
   */
  async getEvents(startDate: Date, endDate: Date): Promise<{
    success: boolean;
    events: any[];
    error?: string;
  }> {
    try {
      if (!this.isInitialized || !this.calendar) {
        logger.warn('Google Calendar not initialized, cannot get events');
        return {
          success: false,
          events: [],
          error: 'Google Calendar not initialized',
        };
      }

      logger.info('Getting Google Calendar events', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await this.calendar.events.list({
        calendarId: config.googleCalendar.calendarId || 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      logger.info('Retrieved Google Calendar events', { count: events.length });

      return {
        success: true,
        events,
      };
    } catch (error) {
      logger.error('Exception while getting Google Calendar events', { error });

      errorHandler.handleError(error as Error, {
        context: 'google_calendar_list',
        startDate,
        endDate,
      });

      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test Google Calendar connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.calendar) {
        logger.warn('Google Calendar not initialized, cannot test connection');
        return false;
      }

      // Test by getting calendar list
      const response = await this.calendar.calendarList.list();
      
      if (response.data.items && response.data.items.length > 0) {
        logger.info('Google Calendar connection test successful', {
          calendarCount: response.data.items.length,
          primaryCalendar: response.data.items.find((cal: any) => cal.primary)?.summary,
        });
        return true;
      } else {
        logger.error('Google Calendar connection test failed - no calendars found');
        return false;
      }
    } catch (error) {
      logger.error('Google Calendar connection test failed', { error });
      return false;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.calendar !== null;
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
