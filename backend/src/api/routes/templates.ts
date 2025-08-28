import { Router } from 'express';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/templates
 * Získa všetky email templates
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Email templates endpoint - coming soon'
      }
    });
  } catch (error) {
    logger.error('Error in templates endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
