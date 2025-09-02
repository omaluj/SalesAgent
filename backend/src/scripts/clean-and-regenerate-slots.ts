#!/usr/bin/env tsx

import logger from '../utils/logger.js';

/**
 * Script na vyčistenie Google Calendar a regeneráciu slotov
 */
async function cleanAndRegenerateSlots() {
  try {
    logger.info('🧹 Začínam vyčistenie a regeneráciu Google Calendar slotov...');
    
    // Krok 1: Získať všetky sloty cez API
    logger.info('📅 Získavam všetky sloty cez API...');
    
    const response = await fetch('http://localhost:3001/api/calendar/settings');
    const data = await response.json();
    
    if (!data.success) {
      logger.error('❌ Chyba pri získavaní slotov z API');
      return;
    }
    
    const allSlots = data.data.timeSlots || [];
    logger.info(`📊 Našiel som ${allSlots.length} slotov`);
    
    // Krok 2: Vymazať všetky existujúce Google Calendar eventy
    logger.info('🗑️  Mažem všetky existujúce Google Calendar eventy...');
    
    const slotsWithEvents = allSlots.filter((slot: any) => slot.googleEventId);
    logger.info(`📊 Našiel som ${slotsWithEvents.length} slotov s Google event ID`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const slot of slotsWithEvents) {
      try {
        logger.info(`🗑️  Mažem event pre: ${slot.date} ${slot.time} (${slot.googleEventId})`);
        
        // Vymazať event cez API
        const deleteResponse = await fetch(`http://localhost:3001/api/calendar/delete-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: slot.googleEventId
          })
        });
        
        const deleteData = await deleteResponse.json();
        
        if (deleteData.success) {
          deletedCount++;
          logger.info(`✅ Event vymazaný: ${slot.googleEventId}`);
        } else {
          errorCount++;
          logger.error(`❌ Chyba pri mazaní eventu: ${slot.googleEventId} - ${deleteData.error}`);
        }
        
        // Rate limiting - pauza 500ms medzi mazaním
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        logger.error(`❌ Chyba pri mazaní eventu ${slot.googleEventId}:`, error);
      }
    }
    
    logger.info(`🗑️  Mazanie dokončené: ${deletedCount} vymazaných, ${errorCount} chýb`);
    
    // Krok 3: Počkať chvíľu na synchronizáciu
    logger.info('⏳ Čakám 5 sekúnd na synchronizáciu...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Krok 4: Regenerovať všetky sloty
    logger.info('🔄 Regenerujem všetky sloty...');
    
    const regenerateResponse = await fetch('http://localhost:3001/api/calendar/generate-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const regenerateData = await regenerateResponse.json();
    
    if (regenerateData.success) {
      logger.info(`🎉 Regenerácia dokončená!`);
      logger.info(`✅ Vytvorené eventy: ${regenerateData.data.created}`);
      logger.info(`❌ Chyby: ${regenerateData.data.errors}`);
    } else {
      logger.error(`❌ Chyba pri regenerácii: ${regenerateData.error}`);
    }
    
  } catch (error) {
    logger.error('❌ Chyba pri vyčistení a regenerácii slotov:', error);
  }
}

// Spustiť script
cleanAndRegenerateSlots()
  .then(() => {
    logger.info('🏁 Script dokončený');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Script zlyhal:', error);
    process.exit(1);
  });
