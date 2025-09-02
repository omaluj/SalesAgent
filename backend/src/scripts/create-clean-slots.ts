#!/usr/bin/env tsx

import logger from '../utils/logger.js';

/**
 * Script na vytvorenie čistých slotov bez duplicitov
 */
async function createCleanSlots() {
  try {
    logger.info('🎯 Začínam vytvorenie čistých slotov bez duplicitov...');
    
    // Krok 1: Vymazať všetky existujúce sloty z databázy
    logger.info('🧹 Vymazávam všetky existujúce sloty z databázy...');
    
    const clearResponse = await fetch('http://localhost:3001/api/calendar/clear-all-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const clearData = await clearResponse.json();
    
    if (clearData.success) {
      logger.info(`✅ Vymazané ${clearData.data.deleted} slotov z databázy`);
    } else {
      logger.error(`❌ Chyba pri mazaní slotov: ${clearData.error}`);
      return;
    }
    
    // Krok 2: Vytvoriť nových 100 čistých slotov
    logger.info('📅 Vytváram nových 100 čistých slotov...');
    
    const createResponse = await fetch('http://localhost:3001/api/calendar/create-clean-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count: 100
      })
    });
    
    const createData = await createResponse.json();
    
    if (createData.success) {
      logger.info(`✅ Vytvorené ${createData.data.created} slotov`);
      logger.info(`✅ Vytvorené ${createData.data.googleEvents} Google Calendar eventov`);
      logger.info(`❌ Chyby: ${createData.data.errors}`);
    } else {
      logger.error(`❌ Chyba pri vytváraní slotov: ${createData.error}`);
    }
    
  } catch (error) {
    logger.error('❌ Chyba pri vytváraní čistých slotov:', error);
  }
}

// Spustiť script
createCleanSlots()
  .then(() => {
    logger.info('🏁 Script dokončený');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Script zlyhal:', error);
    process.exit(1);
  });

