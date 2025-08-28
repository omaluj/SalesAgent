import { Router } from 'express';
import { z } from 'zod';
import { timeSlotService } from '../../modules/calendar/time-slot.service.js';
import logger from '../../utils/logger.js';
import { prisma } from '../../database/prisma.js';

const router = Router();

// Schema pre rezerváciu termínu
const bookSlotSchema = z.object({
  slotId: z.string(),
  name: z.string().min(2, 'Meno musí mať aspoň 2 znaky'),
  email: z.string().email('Neplatný email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional()
});

/**
 * GET /api/public/calendar/slots
 * Získa dostupné sloty pre verejný kalendár
 */
router.get('/slots', async (req, res) => {
  try {
    const timeSlots = await timeSlotService.getTimeSlots();
    
    // Filtrovať len dostupné sloty a budúce termíny
    const availableSlots = timeSlots.filter(slot => {
      if (!slot.available) return false;
      
      const slotDate = new Date(slot.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return slotDate >= today;
    });

    res.json({
      success: true,
      data: {
        slots: availableSlots,
        total: availableSlots.length
      }
    });
  } catch (error) {
    logger.error('Error getting public calendar slots:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri načítaní kalendára'
    });
  }
});

/**
 * POST /api/public/calendar/book
 * Rezervuje termín v Google Calendar
 */
router.post('/book', async (req, res) => {
  try {
    const { slotId, name, email, phone, company, message } = bookSlotSchema.parse(req.body);

    // Skontrolovať, či je slot stále dostupný
    const timeSlots = await timeSlotService.getTimeSlots();
    const slot = timeSlots.find(s => s.id === slotId);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Termín nebol nájdený'
      });
    }

    if (!slot.available) {
      return res.status(400).json({
        success: false,
        error: 'Termín už nie je dostupný'
      });
    }

    // Rezervovať slot - vytvoriť event v Google Calendar
    const updatedSlot = {
      ...slot,
      available: false,
      bookedBy: name,
      bookedAt: new Date().toISOString()
    };

    await timeSlotService.saveTimeSlots([updatedSlot]);

    // TODO: Poslať email potvrdenie
    logger.info('Slot booked successfully in Google Calendar:', {
      slotId,
      name,
      email,
      date: slot.date,
      time: slot.time
    });

    res.json({
      success: true,
      data: {
        message: 'Termín bol úspešne rezervovaný v Google Calendar',
        booking: {
          slotId,
          date: slot.date,
          time: slot.time,
          name,
          email
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Neplatné údaje',
        details: error.errors
      });
    }

    logger.error('Error booking slot:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri rezervácii termínu'
    });
  }
});

/**
 * GET /api/public/calendar/availability
 * Získa dostupnosť pre konkrétny deň
 */
router.get('/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validácia formátu dátumu
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Neplatný formát dátumu (YYYY-MM-DD)'
      });
    }

    const timeSlots = await timeSlotService.getTimeSlots();
    const daySlots = timeSlots.filter(slot => slot.date === date);

    res.json({
      success: true,
      data: {
        date,
        slots: daySlots,
        available: daySlots.filter(s => s.available).length,
        total: daySlots.length
      }
    });
  } catch (error) {
    logger.error('Error getting availability:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri načítaní dostupnosti'
    });
  }
});

export default router;
