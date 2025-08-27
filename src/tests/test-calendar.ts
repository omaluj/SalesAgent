#!/usr/bin/env node

import { googleCalendarService } from '../modules/calendar/google-calendar.service.js';
import logger from '../utils/logger.js';

async function testCalendar() {
  console.log('🧪 Testing Google Calendar API...\n');

  try {
    // Test 1: Check if service is initialized
    console.log('1. Checking service initialization...');
    const isReady = googleCalendarService.isReady();
    console.log(`   ✅ Service ready: ${isReady}\n`);

    if (!isReady) {
      console.log('❌ Google Calendar service not initialized. Check your credentials.');
      console.log('   Make sure GOOGLE_CALENDAR_CREDENTIALS_PATH points to valid credentials file.\n');
      return;
    }

    // Test 2: Test connection
    console.log('2. Testing connection...');
    const connectionTest = await googleCalendarService.testConnection();
    console.log(`   ✅ Connection test: ${connectionTest ? 'PASSED' : 'FAILED'}\n`);

    if (!connectionTest) {
      console.log('❌ Connection test failed. Check your credentials and internet connection.\n');
      return;
    }

    // Test 3: Create test event
    console.log('3. Creating test calendar event...');
    const testEvent = {
      title: 'Test Meeting - Biz-Agent',
      description: 'This is a test meeting created by Biz-Agent to verify Google Calendar integration.',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      attendees: ['test@example.com'], // Replace with your test email
      location: 'Online (Google Meet)',
      companyId: 'test-company',
    };

    const createResult = await googleCalendarService.createEvent(testEvent);
    
    if (createResult.success) {
      console.log('   ✅ Test event created successfully!');
      console.log(`   📅 Event ID: ${createResult.eventId}`);
      if (createResult.meetingLink) {
        console.log(`   🔗 Meeting Link: ${createResult.meetingLink}\n`);
      } else {
        console.log('   ⚠️  No meeting link generated\n');
      }

      // Test 4: Update event
      console.log('4. Updating test event...');
      const updateResult = await googleCalendarService.updateEvent(createResult.eventId!, {
        title: 'Updated Test Meeting - Biz-Agent',
        description: 'This test meeting has been updated by Biz-Agent.',
      });

      if (updateResult.success) {
        console.log('   ✅ Test event updated successfully!\n');
      } else {
        console.log('   ❌ Failed to update test event');
        console.log(`   🔍 Error: ${updateResult.error}\n`);
      }

      // Test 5: Get events
      console.log('5. Getting calendar events...');
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
      
      const eventsResult = await googleCalendarService.getEvents(startDate, endDate);
      
      if (eventsResult.success) {
        console.log(`   📊 Found ${eventsResult.events.length} events in the next 7 days\n`);
      } else {
        console.log('   ❌ Failed to get events');
        console.log(`   🔍 Error: ${eventsResult.error}\n`);
      }

      // Test 6: Delete test event
      console.log('6. Cleaning up - deleting test event...');
      const deleteResult = await googleCalendarService.deleteEvent(createResult.eventId!);
      
      if (deleteResult.success) {
        console.log('   ✅ Test event deleted successfully!\n');
      } else {
        console.log('   ❌ Failed to delete test event');
        console.log(`   🔍 Error: ${deleteResult.error}\n`);
      }

    } else {
      console.log('   ❌ Failed to create test event');
      console.log(`   🔍 Error: ${createResult.error}\n`);
    }

    console.log('🎉 Google Calendar API test completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    logger.error('Google Calendar test failed', { error });
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCalendar()
    .then(() => {
      console.log('✅ Google Calendar test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Google Calendar test failed:', error);
      process.exit(1);
    });
}
