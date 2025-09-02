#!/usr/bin/env tsx

import logger from '../utils/logger.js';

/**
 * Script na manuálne vymazanie VŠETKÝCH eventov z Google Calendar
 * POZOR: Tento script vymaže všetky eventy, nie len "Dostupné časové okno"
 */
async function forceDeleteAllEvents() {
  try {
    logger.info('⚠️  POZOR: Začínam manuálne vymazanie VŠETKÝCH eventov z Google Calendar...');
    
    // Krok 1: Získať všetky eventy z Google Calendar cez API
    logger.info('📅 Získavam všetky eventy z Google Calendar...');
    
    const startDate = new Date('2025-08-01'); // Začiatok augusta
    const endDate = new Date('2025-12-31'); // Koniec roku
    
    const response = await fetch(`http://localhost:3001/api/calendar/get-events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    const data = await response.json();
    
    if (!data.success) {
      logger.error('❌ Chyba pri získavaní eventov z Google Calendar');
      return;
    }
    
    const events = data.data?.events || data.events || [];
    logger.info(`📊 Našiel som ${events.length} eventov v Google Calendar`);
    
    if (events.length === 0) {
      logger.info('✅ Google Calendar je už prázdny!');
      return;
    }
    
    // Krok 2: Vymazať všetky eventy
    logger.info('🗑️  Mažem VŠETKY eventy z Google Calendar...');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const event of events) {
      try {
        logger.info(`🗑️  Mažem event: ${event.summary || 'Bez názvu'} (${event.id})`);
        
        // Vymazať event cez API
        const deleteResponse = await fetch(`http://localhost:3001/api/calendar/delete-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: event.id
          })
        });
        
        const deleteData = await deleteResponse.json();
        
        if (deleteData.success) {
          deletedCount++;
          logger.info(`✅ Event vymazaný: ${event.id} (${deletedCount}/${events.length})`);
        } else {
          errorCount++;
          logger.error(`❌ Chyba pri mazaní eventu: ${event.id} - ${deleteData.error}`);
        }
        
        // Rate limiting - pauza 500ms medzi mazaním
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        logger.error(`❌ Chyba pri mazaní eventu ${event.id}:`, error);
      }
    }
    
    logger.info(`🎉 Manuálne mazanie dokončené!`);
    logger.info(`🗑️  Vymazané eventy: ${deletedCount}`);
    logger.info(`❌ Chyby: ${errorCount}`);
    
  } catch (error) {
    logger.error('❌ Chyba pri manuálnom mazaní eventov:', error);
  }
}

// Spustiť script
forceDeleteAllEvents()
  .then(() => {
    logger.info('🏁 Script dokončený');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Script zlyhal:', error);
    process.exit(1);
  });
