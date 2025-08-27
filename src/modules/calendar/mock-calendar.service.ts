import logger from '@/utils/logger.js';
import { logCalendarEvent } from '@/utils/logger.js';

export interface CalendarEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

export interface CalendarEventResponse {
  success: boolean;
  eventId?: string;
  error?: string;
}

export class MockCalendarService {
  private static instance: MockCalendarService;
  private eventCount = 0;
  private events: Map<string, CalendarEventData> = new Map();

  private constructor() {}

  public static getInstance(): MockCalendarService {
    if (!MockCalendarService.instance) {
      MockCalendarService.instance = new MockCalendarService();
    }
    return MockCalendarService.instance;
  }

  public async createEvent(eventData: CalendarEventData): Promise<CalendarEventResponse> {
    this.eventCount++;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Simulate occasional failures (3% chance)
    const shouldFail = Math.random() < 0.03;
    
    if (shouldFail) {
      const error = 'Mock Google Calendar API error';
      logger.warn('Mock calendar event creation failed', {
        title: eventData.title,
        startTime: eventData.startTime,
        error,
        eventCount: this.eventCount,
      });
      
      return {
        success: false,
        error,
      };
    }
    
    const eventId = `mock_event_${Date.now()}_${this.eventCount}`;
    this.events.set(eventId, eventData);
    
    logger.info('Mock calendar event created successfully', {
      title: eventData.title,
      startTime: eventData.startTime,
      eventId,
      eventCount: this.eventCount,
      mock: true,
    });
    
    logCalendarEvent('created', eventId, {
      title: eventData.title,
      mock: true,
    });
    
    return {
      success: true,
      eventId,
    };
  }

  public async updateEvent(eventId: string, eventData: Partial<CalendarEventData>): Promise<CalendarEventResponse> {
    if (!this.events.has(eventId)) {
      return {
        success: false,
        error: 'Event not found',
      };
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));
    
    const existingEvent = this.events.get(eventId)!;
    const updatedEvent = { ...existingEvent, ...eventData };
    this.events.set(eventId, updatedEvent);
    
    logger.info('Mock calendar event updated successfully', {
      eventId,
      title: updatedEvent.title,
      mock: true,
    });
    
    logCalendarEvent('updated', eventId, {
      title: updatedEvent.title,
      mock: true,
    });
    
    return {
      success: true,
      eventId,
    };
  }

  public async deleteEvent(eventId: string): Promise<CalendarEventResponse> {
    if (!this.events.has(eventId)) {
      return {
        success: false,
        error: 'Event not found',
      };
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 150));
    
    const event = this.events.get(eventId)!;
    this.events.delete(eventId);
    
    logger.info('Mock calendar event deleted successfully', {
      eventId,
      title: event.title,
      mock: true,
    });
    
    logCalendarEvent('deleted', eventId, {
      title: event.title,
      mock: true,
    });
    
    return {
      success: true,
      eventId,
    };
  }

  public async getEvent(eventId: string): Promise<CalendarEventData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    return this.events.get(eventId) || null;
  }

  public async listEvents(startDate: Date, endDate: Date): Promise<CalendarEventData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const events: CalendarEventData[] = [];
    
    for (const event of this.events.values()) {
      if (event.startTime >= startDate && event.startTime <= endDate) {
        events.push(event);
      }
    }
    
    logger.info('Mock calendar events listed', {
      startDate,
      endDate,
      count: events.length,
      mock: true,
    });
    
    return events;
  }

  public getStats(): { eventCount: number; totalEvents: number } {
    return {
      eventCount: this.eventCount,
      totalEvents: this.events.size,
    };
  }

  public resetStats(): void {
    this.eventCount = 0;
    this.events.clear();
    logger.info('Mock Calendar stats reset');
  }
}

export const mockCalendarService = MockCalendarService.getInstance();
