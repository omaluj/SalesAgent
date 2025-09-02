import { CronJob } from 'cron';
import logger from '../../utils/logger.js';
import { TimeSlotService } from './time-slot.service.js';
import { googleCalendarService } from './google-calendar.service.js';

export class SlotGeneratorService {
  private timeSlotService: TimeSlotService;
  private cronJob: CronJob | null = null;

  constructor() {
    this.timeSlotService = new TimeSlotService();
    this.initializeCronJob();
  }

  /**
   * Inicializuje cron job pre automatické generovanie slotov
   * Spúšťa sa každý deň o 2:00 ráno
   */
  private initializeCronJob(): void {
    // Cron expression: každý deň o 2:00 ráno
    const cronExpression = '0 2 * * *';
    
    this.cronJob = new CronJob(cronExpression, async () => {
      logger.info('🕐 Cron job: Začínam kontrolu a generovanie slotov...');
      await this.checkAndGenerateSlots();
    }, null, false, 'Europe/Bratislava');

    logger.info('📅 Slot generator cron job inicializovaný (každý deň o 2:00)');
  }

  /**
   * Spustiť cron job
   */
  startCronJob(): void {
    // TODO: Vypnuté automatické generovanie - bude sa spúšťať manuálne
    // this.cronJob.start();
    logger.info('⏸️  Automatický cron job je vypnutý - sloty sa budú generovať manuálne');
  }

  /**
   * Zastaví cron job
   */
  stopCronJob(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('🛑 Slot generator cron job zastavený');
    }
  }

  /**
   * Kontroluje a generuje sloty ak je potrebné
   */
  async checkAndGenerateSlots(): Promise<void> {
    try {
      logger.info('🔍 Kontrolujem dostupnosť slotov...');
      
      // Získať aktuálne sloty
      const currentSlots = await this.timeSlotService.getTimeSlots();
      
      // Filtrovať len dostupné sloty (bez Google event ID)
      const availableSlots = currentSlots.filter(slot => !slot.googleEventId);
      
      // Filtrovať sloty, ktoré sú v budúcnosti (aspoň 2 týždne dopredu)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14); // 2 týždne dopredu
      
      const futureSlots = availableSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate >= futureDate;
      });

      logger.info(`📊 Analýza slotov:`);
      logger.info(`   - Celkovo slotov: ${currentSlots.length}`);
      logger.info(`   - Bez Google event: ${availableSlots.length}`);
      logger.info(`   - V budúcnosti (2+ týždne): ${futureSlots.length}`);

      // Ak máme menej ako 25 dostupných slotov v budúcnosti, generovať nové
      if (futureSlots.length < 25) {
        logger.info(`⚠️  Málo slotov v budúcnosti (${futureSlots.length}/25), generujem nové...`);
        await this.generateNewSlots();
      } else {
        logger.info(`✅ Dostatočný počet slotov v budúcnosti (${futureSlots.length})`);
      }

    } catch (error) {
      logger.error('❌ Chyba pri kontrole slotov:', error);
    }
  }

  /**
   * Generuje nové sloty s rate limiting
   */
  private async generateNewSlots(): Promise<void> {
    try {
      logger.info('🚀 Začínam generovanie nových slotov...');
      
      // Získať všetky sloty
      const allSlots = await this.timeSlotService.getTimeSlots();
      
      // Filtrovať len sloty bez Google event ID
      const slotsToGenerate = allSlots.filter(slot => !slot.googleEventId);
      
      logger.info(`📅 Generujem ${slotsToGenerate.length} nových Google Calendar eventov...`);
      
      let createdCount = 0;
      let errorCount = 0;
      
      for (const slot of slotsToGenerate) {
        try {
          logger.info(`⏳ Vytváram event pre: ${slot.date} ${slot.time} (${slot.day})`);
          
          // Vytvoriť event
          const slotDate = new Date(slot.date + 'T' + slot.time + ':00');
          const endDate = new Date(slotDate);
          endDate.setHours(endDate.getHours() + 1);

          const eventTitle = `Dostupné časové okno - ${slot.day} ${slot.time}`;
          const eventDescription = 'Časové okno pre konzultáciu. Rezervujte si termín cez náš web.';

          const event = await googleCalendarService.createEvent({
            title: eventTitle,
            description: eventDescription,
            startTime: slotDate,
            endTime: endDate,
            attendees: []
          });

          if (event?.success && event?.eventId) {
            createdCount++;
            logger.info(`✅ Event vytvorený: ${event.eventId} (${createdCount}/${slotsToGenerate.length})`);
          } else {
            errorCount++;
            logger.error(`❌ Chyba pri vytváraní eventu: ${event?.error}`);
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
      
    } catch (error) {
      logger.error('❌ Chyba pri generovaní nových slotov:', error);
    }
  }

  /**
   * Manuálne spustí generovanie slotov (pre admin)
   */
  async manualGenerate(): Promise<{ success: boolean; message: string; created: number; errors: number }> {
    try {
      logger.info('🔧 Manuálne generovanie slotov spustené...');
      
      const allSlots = await this.timeSlotService.getTimeSlots();
      const slotsToGenerate = allSlots.filter(slot => !slot.googleEventId);
      
      if (slotsToGenerate.length === 0) {
        return {
          success: true,
          message: 'Všetky sloty už majú Google Calendar eventy',
          created: 0,
          errors: 0
        };
      }
      
      let createdCount = 0;
      let errorCount = 0;
      
      for (const slot of slotsToGenerate) {
        try {
          const slotDate = new Date(slot.date + 'T' + slot.time + ':00');
          const endDate = new Date(slotDate);
          endDate.setHours(endDate.getHours() + 1);

          const eventTitle = `Dostupné časové okno - ${slot.day} ${slot.time}`;
          const eventDescription = 'Časové okno pre konzultáciu. Rezervujte si termín cez náš web.';

          const event = await googleCalendarService.createEvent({
            title: eventTitle,
            description: eventDescription,
            startTime: slotDate,
            endTime: endDate,
            attendees: []
          });

          if (event?.success && event?.eventId) {
            createdCount++;
          } else {
            errorCount++;
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          errorCount++;
        }
      }
      
      return {
        success: true,
        message: `Generovanie dokončené: ${createdCount} vytvorených, ${errorCount} chýb`,
        created: createdCount,
        errors: errorCount
      };
      
    } catch (error) {
      logger.error('❌ Chyba pri manuálnom generovaní:', error);
      return {
        success: false,
        message: 'Chyba pri generovaní slotov',
        created: 0,
        errors: 0
      };
    }
  }
}

// Export singleton instance
export const slotGeneratorService = new SlotGeneratorService();
