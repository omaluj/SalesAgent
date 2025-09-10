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

/**
 * POST /api/campaigns/:id/companies - Add companies to campaign
 */
router.post('/:id/companies', async (req, res): Promise<void> => {
  try {
    console.log('🔍 DEBUG: POST /api/campaigns/:id/companies called');
    console.log('🔍 DEBUG: Campaign ID:', req.params.id);
    console.log('🔍 DEBUG: Request body:', req.body);
    
    const { companyIds } = req.body;
    
    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Company IDs array is required'
      });
      return;
    }

    const result = await campaignService.assignCompaniesToCampaign(req.params.id, companyIds);
    
    console.log('🔍 DEBUG: Companies added to campaign:', req.params.id);
    
    res.json({
      success: true,
      data: result,
      message: `Added ${result.count} companies to campaign`
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in POST /api/campaigns/:id/companies:', error);
    logger.error('Failed to add companies to campaign', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to add companies to campaign'
    });
  }
});

/**
 * POST /api/campaigns/:id/send-emails - Send emails to all companies in campaign
 */
router.post('/:id/send-emails', async (req, res): Promise<void> => {
  try {
    console.log('🔍 DEBUG: POST /api/campaigns/:id/send-emails called');
    console.log('🔍 DEBUG: Campaign ID:', req.params.id);
    
    const result = await campaignService.sendCampaignEmails(req.params.id);
    
    console.log('🔍 DEBUG: Campaign emails sent:', result.emailsQueued, 'emails queued');
    
    res.json({
      success: true,
      data: result,
      message: `Queued ${result.emailsQueued} emails for campaign`
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in POST /api/campaigns/:id/send-emails:', error);
    logger.error('Failed to send campaign emails', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to send campaign emails'
    });
  }
});

/**
 * GET /api/campaigns/:id/companies - Get companies in campaign
 */
router.get('/:id/companies', async (req, res): Promise<void> => {
  try {
    console.log('🔍 DEBUG: GET /api/campaigns/:id/companies called');
    console.log('🔍 DEBUG: Campaign ID:', req.params.id);
    
    const companies = await campaignService.getCampaignCompanies(req.params.id);
    
    console.log('🔍 DEBUG: Found', companies.length, 'companies in campaign');
    
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in GET /api/campaigns/:id/companies:', error);
    logger.error('Failed to get campaign companies', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get campaign companies'
    });
  }
});

/**
 * GET /api/campaigns/:id/analytics - Get campaign analytics
 */
router.get('/:id/analytics', async (req, res): Promise<void> => {
  try {
    console.log('🔍 DEBUG: GET /api/campaigns/:id/analytics called');
    console.log('🔍 DEBUG: Campaign ID:', req.params.id);
    
    const { startDate, endDate } = req.query;
    
    const analytics = await campaignService.getCampaignAnalytics(
      req.params.id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    console.log('🔍 DEBUG: Campaign analytics retrieved');
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in GET /api/campaigns/:id/analytics:', error);
    logger.error('Failed to get campaign analytics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get campaign analytics'
    });
  }
});

/**
 * POST /api/campaigns/:id/start-automation - Start campaign automation
 */
router.post('/:id/start-automation', async (req, res): Promise<void> => {
  try {
    console.log('🔍 DEBUG: POST /api/campaigns/:id/start-automation called');
    console.log('🔍 DEBUG: Campaign ID:', req.params.id);
    
    const campaign = await campaignService.getCampaignById(req.params.id);
    
    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
      return;
    }
    
    // Update campaign to active status
    await campaignService.updateCampaign(req.params.id, {
      isActive: true,
    } as any);
    
    console.log('🔍 DEBUG: Campaign automation started');
    
    res.json({
      success: true,
      message: 'Campaign automation started successfully'
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in POST /api/campaigns/:id/start-automation:', error);
    logger.error('Failed to start campaign automation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to start campaign automation'
    });
  }
});

/**
 * POST /api/campaigns/:id/stop-automation - Stop campaign automation
 */
router.post('/:id/stop-automation', async (req, res): Promise<void> => {
  try {
    console.log('🔍 DEBUG: POST /api/campaigns/:id/stop-automation called');
    console.log('🔍 DEBUG: Campaign ID:', req.params.id);
    
    const campaign = await campaignService.getCampaignById(req.params.id);
    
    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
      return;
    }
    
    // Update campaign to paused status
    await campaignService.updateCampaign(req.params.id, {
      isActive: false,
    } as any);
    
    console.log('🔍 DEBUG: Campaign automation stopped');
    
    res.json({
      success: true,
      message: 'Campaign automation stopped successfully'
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in POST /api/campaigns/:id/stop-automation:', error);
    logger.error('Failed to stop campaign automation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to stop campaign automation'
    });
  }
});

export default router;
