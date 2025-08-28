import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function regenerateSlots() {
  try {
    console.log('🧹 Mažem staré sloty...');
    
    // Vymazať všetky existujúce sloty
    await prisma.timeSlot.deleteMany({});
    
    console.log('✅ Staré sloty vymazané');
    console.log('🔄 Reštartujem backend server pre regeneráciu slotov...');
    
    // Backend automaticky vygeneruje nové sloty pri ďalšom volaní getTimeSlots()
    
  } catch (error) {
    console.error('❌ Chyba pri regenerácii slotov:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateSlots();
