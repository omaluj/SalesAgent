import { Router } from 'express';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/analytics/overview
 * Získa analytics overview
 */
router.get('/overview', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Analytics overview endpoint - coming soon'
      }
    });
  } catch (error) {
    logger.error('Error in analytics endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
