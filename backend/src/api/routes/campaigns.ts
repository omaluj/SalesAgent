import { Router } from 'express';
import { campaignService } from '../../modules/campaigns/campaign.service.js';
import { enhancedTemplateService } from '../../modules/templates/enhanced-template.service.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/campaigns - Get all campaigns
 */
router.get('/', async (req, res) => {
  try {
    console.log('🔍 DEBUG: GET /api/campaigns called');
    
    const filters = {
      status: req.query.status as string,
      isActive: req.query.isActive === 'true',
      templateId: req.query.templateId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    console.log('🔍 DEBUG: Filters:', filters);
    console.log('🔍 DEBUG: About to call campaignService.getCampaigns...');
    
    const campaigns = await campaignService.getCampaigns(filters);
    
    console.log('🔍 DEBUG: Campaign service returned:', campaigns.length, 'campaigns');
    if (campaigns.length > 0) {
      console.log('🔍 DEBUG: First campaign:', campaigns[0].name);
    }
    
    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in GET /api/campaigns:', error);
    logger.error('Failed to get campaigns', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get campaigns',
    });
  }
});

export default router;
