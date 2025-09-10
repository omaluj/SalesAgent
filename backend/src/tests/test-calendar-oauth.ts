import { oauthService } from '../modules/auth/oauth.service.js';
import logger from '../utils/logger.js';

async function testCalendarWithOAuth() {
  logger.info('🧪 Testing Calendar with OAuth...');

  try {
    // Test 1: OAuth status
    logger.info('\n1️⃣ Testing OAuth status...');
    const isAuthenticated = await oauthService.isAuthenticated();
    logger.info(`OAuth authenticated: ${isAuthenticated ? '✅ YES' : '❌ NO'}`);

    if (!isAuthenticated) {
      logger.error('OAuth not authenticated. Please run OAuth setup first.');
      return;
    }

    // Test 2: OAuth connection
    logger.info('\n2️⃣ Testing OAuth connection...');
    const connectionTest = await oauthService.testConnection();
    logger.info(`OAuth connection: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (!connectionTest) {
      logger.error('OAuth connection failed.');
      return;
    }

    // Test 3: Calendar API test
    logger.info('\n3️⃣ Testing Calendar API...');
    const { google } = await import('googleapis');
    const oauthClient = oauthService.getOAuthClient();
    
    const calendar = google.calendar({ version: 'v3', auth: oauthClient as any });
    
    // Test calendar list
    const calendarList = await calendar.calendarList.list();
    logger.info(`Found ${calendarList.data.items?.length || 0} calendars`);
    
    if (calendarList.data.items) {
      calendarList.data.items.forEach(cal => {
        logger.info(`Calendar: ${cal.summary} (${cal.id})`);
      });
    }

    // Test specific calendar
    const calendarId = 'c_be1d69240ee32df2924e7ad486abc555655f9a344b72c11b835d0c3da21f2426@group.calendar.google.com';
    
    try {
      const calendarInfo = await calendar.calendars.get({ calendarId });
      logger.info(`Calendar info: ${calendarInfo.data.summary}`);
      logger.info(`Calendar access role: ${(calendarInfo.data as any).accessRole}`);
      logger.info(`Calendar primary: ${(calendarInfo.data as any).primary}`);
    } catch (error) {
      logger.error(`Failed to get calendar info: ${(error as any).message}`);
    }

    // Test 4: Create test event
    logger.info('\n4️⃣ Testing event creation...');
    
    const testEvent = {
      summary: 'Test event from Biz-Agent OAuth',
      description: 'This is a test event created via OAuth 2.0',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        timeZone: 'Europe/Bratislava',
      },
      end: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        timeZone: 'Europe/Bratislava',
      },
      attendees: [
        { email: 'sales@domelia.sk' },
        { email: 'test@example.com' }
      ],
      location: 'Online / Domelia.sk',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24 hours
          { method: 'popup', minutes: 30 },   // 30 minutes
        ],
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: testEvent,
        sendUpdates: 'all'
      });

      logger.info(`Event created successfully! Event ID: ${response.data.id}`);
      logger.info(`Event link: ${response.data.htmlLink}`);
      
      // Test 5: Delete test event
      logger.info('\n5️⃣ Cleaning up test event...');
      await calendar.events.delete({
        calendarId,
        eventId: response.data.id!
      });
      logger.info('Test event deleted successfully');
      
    } catch (error) {
      logger.error(`Failed to create event: ${(error as any).message}`);
      if ((error as any).response?.data?.error) {
        logger.error(`Error details: ${JSON.stringify((error as any).response.data.error)}`);
      }
    }

    logger.info('\n✅ Calendar OAuth test completed successfully!');

  } catch (error) {
    logger.error('❌ Calendar OAuth test failed:', error);
  }
}

// Spustiť test ak je súbor spustený priamo
if (import.meta.url === `file://${process.argv[1]}`) {
  testCalendarWithOAuth();
}

export { testCalendarWithOAuth };
