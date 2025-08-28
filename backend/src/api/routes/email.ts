import { Router } from 'express';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/email/queue
 * Získa stav email queue
 */
router.get('/queue', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Email queue endpoint - coming soon'
      }
    });
  } catch (error) {
    logger.error('Error in email queue endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
