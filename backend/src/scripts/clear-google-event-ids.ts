#!/usr/bin/env tsx

import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

/**
 * Script na vyčistenie googleEventId z databázy
 */
async function clearGoogleEventIds() {
  try {
    logger.info('🧹 Začínam vyčistenie googleEventId z databázy...');
    
    const prisma = new PrismaClient();
    
    // Krok 1: Získať všetky sloty s googleEventId
    const slotsWithEventId = await prisma.timeSlot.findMany({
      where: {
        googleEventId: {
          not: null
        }
      }
    });
    
    logger.info(`📊 Našiel som ${slotsWithEventId.length} slotov s googleEventId`);
    
    if (slotsWithEventId.length === 0) {
      logger.info('✅ Žiadne sloty s googleEventId neexistujú');
      return;
    }
    
    // Krok 2: Vymazať googleEventId zo všetkých slotov
    logger.info('🗑️  Mažem googleEventId zo všetkých slotov...');
    
    const result = await prisma.timeSlot.updateMany({
      where: {
        googleEventId: {
          not: null
        }
      },
      data: {
        googleEventId: null
      }
    });
    
    logger.info(`✅ Vyčistené googleEventId z ${result.count} slotov`);
    
    // Krok 3: Overiť výsledok
    const remainingSlotsWithEventId = await prisma.timeSlot.findMany({
      where: {
        googleEventId: {
          not: null
        }
      }
    });
    
    logger.info(`📊 Po vyčistení: ${remainingSlotsWithEventId.length} slotov s googleEventId`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('❌ Chyba pri vyčistení googleEventId:', error);
  }
}

// Spustiť script
clearGoogleEventIds()
  .then(() => {
    logger.info('🏁 Script dokončený');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Script zlyhal:', error);
    process.exit(1);
  });

