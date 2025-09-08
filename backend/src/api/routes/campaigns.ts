import { Router } from 'express';
import { campaignService } from '../../modules/campaigns/campaign.service.js';
import { enhancedTemplateService } from '../../modules/templates/enhanced-template.service.js';
import logger from '../../utils/logger.js';

const router = Router();

// Test endpoint
router.get('/test', (req, res) => {
  logger.info('🧪 TEST: /api/campaigns/test called');
  res.json({ success: true, message: 'Campaigns route works!' });
});

/**
 * GET /api/campaigns - Get all campaigns
 */
router.get('/', async (req, res) => {
  try {
    console.log('🔍 DEBUG: GET /api/campaigns called');
    logger.info('🔍 DEBUG: GET /api/campaigns called');
    
    const filters: any = {};
    
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.templateId) {
      filters.templateId = req.query.templateId as string;
    }
    
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    console.log('🔍 DEBUG: Filters:', filters);
    console.log('🔍 DEBUG: About to call campaignService.getCampaigns...');
    console.log('🔍 DEBUG: campaignService:', typeof campaignService);
    console.log('🔍 DEBUG: campaignService.getCampaigns:', typeof campaignService.getCampaigns);
    
    const campaigns = await campaignService.getCampaigns(filters);
    
    console.log('🔍 DEBUG: Campaign service returned:', campaigns.length, 'campaigns');
    if (campaigns.length > 0) {
      console.log('🔍 DEBUG: First campaign:', campaigns[0]?.name);
    }
    
    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    logger.error('❌ DEBUG: Error in GET /api/campaigns:', error);
    logger.error('Failed to get campaigns', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get campaigns',
    });
  }
});

/**
 * POST /api/campaigns - Create a new campaign
 */
router.post('/', async (req, res) => {
  try {
    console.log('🔍 DEBUG: POST /api/campaigns called');
    console.log('🔍 DEBUG: Request body:', req.body);
    
    const campaignData = {
      name: req.body.name,
      description: req.body.description,
      templateId: req.body.templateId,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      maxEmailsPerDay: req.body.maxEmailsPerDay || 50,
      targetIndustries: req.body.targetIndustries || [],
      targetSizes: req.body.targetSizes || [],
      targetRegions: req.body.targetRegions || [],
      sendTime: req.body.sendTime || '09:00',
      timezone: req.body.timezone || 'Europe/Bratislava',
    };

    console.log('🔍 DEBUG: Campaign data:', campaignData);
    console.log('🔍 DEBUG: About to call campaignService.createCampaign...');
    
    const campaign = await campaignService.createCampaign(campaignData);
    
    console.log('🔍 DEBUG: Campaign created:', campaign.id, campaign.name);
    
    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in POST /api/campaigns:', error);
    logger.error('Failed to create campaign', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign',
    });
  }
});

/**
 * PUT /api/campaigns/:id - Update a campaign
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('🔍 DEBUG: PUT /api/campaigns/:id called');
    console.log('🔍 DEBUG: Campaign ID:', req.params.id);
    console.log('🔍 DEBUG: Request body:', req.body);
    
    const campaignData = {
      name: req.body.name,
      description: req.body.description,
      templateId: req.body.templateId,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      maxEmailsPerDay: req.body.maxEmailsPerDay || 50,
      targetIndustries: req.body.targetIndustries || [],
      targetSizes: req.body.targetSizes || [],
      targetRegions: req.body.targetRegions || [],
      sendTime: req.body.sendTime || '09:00',
      timezone: req.body.timezone || 'Europe/Bratislava',
    };

    console.log('🔍 DEBUG: Campaign data:', campaignData);
    console.log('🔍 DEBUG: About to call campaignService.updateCampaign...');
    
    const campaign = await campaignService.updateCampaign(req.params.id, campaignData);
    
    console.log('🔍 DEBUG: Campaign updated:', campaign.id, campaign.name);
    
    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in PUT /api/campaigns/:id:', error);
    logger.error('Failed to update campaign', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign',
    });
  }
});

export default router;
