import { publicCalendarService } from '../modules/calendar/public-calendar.service.js';
import logger from '../utils/logger.js';

async function testPublicCalendar() {
  logger.info('🧪 Testing Public Calendar Service...');

  try {
    // Test 1: Inicializácia
    logger.info('\n1️⃣ Testing initialization...');
    const isReady = publicCalendarService.isReady();
    logger.info(`Service ready: ${isReady ? '✅ YES' : '❌ NO'}`);

    // Test 2: Test pripojenia
    logger.info('\n2️⃣ Testing connection...');
    const connectionTest = await publicCalendarService.testConnection();
    logger.info(`Connection test: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Test 3: Získanie dostupných slotov
    logger.info('\n3️⃣ Testing available slots...');
    const availableSlots = await publicCalendarService.getAvailableSlots(3);
    logger.info(`Available slots found: ${availableSlots.length}`);
    
    if (availableSlots.length > 0) {
      const firstSlot = availableSlots[0];
      logger.info(`First slot: ${firstSlot?.start.toLocaleString()} - ${firstSlot?.end.toLocaleString()} (${firstSlot?.available ? 'Available' : 'Booked'})`);
    }

    // Test 4: Verejná URL kalendára
    logger.info('\n4️⃣ Testing public calendar URL...');
    const publicUrl = publicCalendarService.getPublicCalendarUrl();
    logger.info(`Public calendar URL: ${publicUrl}`);

    const embedUrl = publicCalendarService.getEmbedUrl();
    logger.info(`Embed URL: ${embedUrl}`);

    // Test 5: Štatistiky kalendára
    logger.info('\n5️⃣ Testing calendar stats...');
    const stats = await publicCalendarService.getCalendarStats();
    logger.info(`Calendar stats:`, {
      totalEvents: stats.totalEvents,
      upcomingEvents: stats.upcomingEvents,
      availableSlots: stats.availableSlots
    });

    // Test 6: Mock rezervácia stretnutia
    logger.info('\n6️⃣ Testing mock booking...');
    const mockBooking = {
      email: 'test@example.com',
      name: 'Test User',
      company: 'Test Company',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Zajtra
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Zajtra + 1 hodina
      notes: 'Test stretnutie cez Biz-Agent'
    };

    const bookedEvent = await publicCalendarService.bookMeeting(mockBooking);
    logger.info(`Mock booking created:`, {
      id: bookedEvent.id,
      summary: bookedEvent.summary,
      start: bookedEvent.start.toLocaleString(),
      attendees: bookedEvent.attendees
    });

    // Test 7: Filtrovanie dostupných slotov
    logger.info('\n7️⃣ Testing slot filtering...');
    const availableOnly = availableSlots.filter(slot => slot.available);
    const bookedOnly = availableSlots.filter(slot => !slot.available);
    
    logger.info(`Available slots: ${availableOnly.length}`);
    logger.info(`Booked slots: ${bookedOnly.length}`);

    // Test 8: Formátovanie pre email
    logger.info('\n8️⃣ Testing email formatting...');
    const calendarUrl = publicCalendarService.getPublicCalendarUrl();
    const emailTemplate = `
Ahoj,

nášli sme vašu firmu a myslíme si, že by sme vám mohli pomôcť s vašimi potrebami.

Môžete si vybrať čas na stretnutie tu: ${calendarUrl}

S pozdravom,
Biz-Agent tým
    `;
    
    logger.info('Email template with calendar link:');
    logger.info(emailTemplate);

    logger.info('\n✅ All Public Calendar tests completed successfully!');

  } catch (error) {
    logger.error('❌ Public Calendar test failed:', error);
  }
}

// Spustiť test ak je súbor spustený priamo
if (import.meta.url === `file://${process.argv[1]}`) {
  testPublicCalendar();
}

export { testPublicCalendar };
