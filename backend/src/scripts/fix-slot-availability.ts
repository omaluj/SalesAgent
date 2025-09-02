import { PrismaClient } from '@prisma/client'
import logger from '../utils/logger.js'

const prisma = new PrismaClient()

async function fixSlotAvailability() {
  try {
    logger.info('🔧 Opravujem dostupnosť slotov...')

    // Nastaviť všetky sloty ako dostupné
    const result = await prisma.timeSlot.updateMany({
      where: {
        available: false
      },
      data: {
        available: true
      }
    })

    logger.info(`✅ Opravené ${result.count} slotov na dostupné`)

    // Skontrolovať výsledok
    const availableSlots = await prisma.timeSlot.count({
      where: { available: true }
    })

    const totalSlots = await prisma.timeSlot.count()

    logger.info(`📊 Stav slotov:`)
    logger.info(`   - Celkom: ${totalSlots}`)
    logger.info(`   - Dostupné: ${availableSlots}`)
    logger.info(`   - Nedostupné: ${totalSlots - availableSlots}`)

  } catch (error) {
    logger.error('❌ Chyba pri oprave slotov:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSlotAvailability()

