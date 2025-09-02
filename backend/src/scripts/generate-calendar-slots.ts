#!/usr/bin/env tsx

import logger from '../utils/logger.js';

/**
 * Script na postupné generovanie všetkých Google Calendar slotov
 * S rate limiting 1 sekunda medzi eventmi
 */
async function generateAllCalendarSlots() {
  try {
    logger.info('🚀 Začínam generovanie všetkých Google Calendar slotov...');
    
    // Získať sloty cez API
    const response = await fetch('http://localhost:3001/api/calendar/settings');
    const data = await response.json();
    
    if (!data.success) {
      logger.error('❌ Chyba pri získavaní slotov z API');
      return;
    }
    
    const allSlots = data.data.timeSlots || [];
    
    logger.info(`📅 Našiel som ${allSlots.length} slotov na generovanie`);
    
    // Filtrovať len dostupné sloty (bez Google event ID)
    const availableSlots = allSlots.filter((slot: any) => !slot.googleEventId);
    
    logger.info(`✅ ${availableSlots.length} slotov potrebuje Google Calendar event`);
    
    if (availableSlots.length === 0) {
      logger.info('🎉 Všetky sloty už majú Google Calendar eventy!');
      return;
    }
    
    // Postupne vytvoriť eventy s rate limiting
    let createdCount = 0;
    let errorCount = 0;
    
    for (const slot of availableSlots) {
      try {
        logger.info(`⏳ Vytváram event pre: ${slot.date} ${slot.time} (${slot.day})`);
        
        // Vytvoriť event cez API
        const eventResponse = await fetch('http://localhost:3001/api/calendar/create-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slotId: slot.id,
            title: `Dostupné časové okno - ${slot.day} ${slot.time}`,
            description: 'Časové okno pre konzultáciu. Rezervujte si termín cez náš web.',
            startTime: `${slot.date}T${slot.time}:00`,
            endTime: `${slot.date}T${parseInt(slot.time.split(':')[0]) + 1}:00`
          })
        });
        
        const eventData = await eventResponse.json();
        
        if (eventData.success) {
          createdCount++;
          logger.info(`✅ Event vytvorený: ${eventData.eventId} (${createdCount}/${availableSlots.length})`);
        } else {
          errorCount++;
          logger.error(`❌ Chyba pri vytváraní eventu: ${eventData.error}`);
        }
        
        // Rate limiting - pauza 1 sekunda
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        errorCount++;
        logger.error(`❌ Chyba pri vytváraní eventu pre ${slot.date} ${slot.time}:`, error);
        
        // Pokračovať s ďalším slotom aj pri chybe
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info(`🎉 Generovanie dokončené!`);
    logger.info(`✅ Úspešne vytvorené: ${createdCount} eventov`);
    logger.info(`❌ Chyby: ${errorCount} eventov`);
    logger.info(`📊 Celkovo: ${availableSlots.length} slotov spracovaných`);
    
  } catch (error) {
    logger.error('❌ Chyba pri generovaní slotov:', error);
  }
}

// Spustiť script
generateAllCalendarSlots()
  .then(() => {
    logger.info('🏁 Script dokončený');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Script zlyhal:', error);
    process.exit(1);
  });
