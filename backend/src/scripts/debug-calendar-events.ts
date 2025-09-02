#!/usr/bin/env tsx

import logger from '../utils/logger.js';

/**
 * Debug script na kontrolu eventov v Google Calendar
 */
async function debugCalendarEvents() {
  try {
    logger.info('🔍 Debug: Kontrolujem eventy v Google Calendar...');
    
    // Test 1: Získať eventy pre rôzne časové rozsahy
    const testRanges = [
      { name: 'Dnes + 7 dní', start: new Date(), end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Dnes + 30 dní', start: new Date(), end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { name: 'Dnes + 60 dní', start: new Date(), end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
      { name: 'August 2025', start: new Date('2025-08-01'), end: new Date('2025-08-31') },
      { name: 'September 2025', start: new Date('2025-09-01'), end: new Date('2025-09-30') },
    ];
    
    for (const range of testRanges) {
      logger.info(`📅 Testujem rozsah: ${range.name}`);
      
      try {
        const response = await fetch(`http://localhost:3001/api/calendar/get-events?startDate=${range.start.toISOString()}&endDate=${range.end.toISOString()}`);
        const data = await response.json();
        
        if (data.success) {
          const events = data.data.events || [];
          logger.info(`   ✅ Našiel som ${events.length} eventov`);
          
          if (events.length > 0) {
            logger.info(`   📋 Prvých 5 eventov:`);
            events.slice(0, 5).forEach((event: any, index: number) => {
              logger.info(`      ${index + 1}. ${event.summary} (${event.start?.dateTime || event.start?.date})`);
            });
          }
        } else {
          logger.error(`   ❌ Chyba: ${data.error}`);
        }
      } catch (error) {
        logger.error(`   ❌ Chyba pri volaní API:`, error);
      }
      
      // Pauza medzi testmi
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test 2: Skontrolovať konfiguráciu
    logger.info('🔧 Kontrolujem konfiguráciu...');
    
    const configResponse = await fetch('http://localhost:3001/api/calendar/settings');
    const configData = await configResponse.json();
    
    if (configData.success) {
      const slots = configData.data.timeSlots || [];
      const slotsWithEvents = slots.filter((slot: any) => slot.googleEventId);
      
      logger.info(`📊 Konfigurácia:`);
      logger.info(`   - Celkovo slotov: ${slots.length}`);
      logger.info(`   - Slotov s Google event ID: ${slotsWithEvents.length}`);
      
      if (slotsWithEvents.length > 0) {
        logger.info(`   📋 Prvých 5 slotov s event ID:`);
        slotsWithEvents.slice(0, 5).forEach((slot: any, index: number) => {
          logger.info(`      ${index + 1}. ${slot.date} ${slot.time} (${slot.day}) - ID: ${slot.googleEventId}`);
        });
      }
    }
    
  } catch (error) {
    logger.error('❌ Chyba pri debugovaní:', error);
  }
}

// Spustiť script
debugCalendarEvents()
  .then(() => {
    logger.info('🏁 Debug script dokončený');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Debug script zlyhal:', error);
    process.exit(1);
  });

