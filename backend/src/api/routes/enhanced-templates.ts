import { Router } from 'express';
import { enhancedTemplateService } from '../../modules/templates/enhanced-template.service.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/enhanced-templates - Get all templates with filters
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      category: req.query.category as string,
      active: req.query.active === 'true',
      isSeasonal: req.query.isSeasonal === 'true',
      targetIndustries: req.query.targetIndustries ? (req.query.targetIndustries as string).split(',') : undefined,
      targetSizes: req.query.targetSizes ? (req.query.targetSizes as string).split(',') : undefined,
    };

    const templates = await enhancedTemplateService.getTemplates(filters);
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Failed to get templates', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get templates',
    });
  }
});

/**
 * GET /api/enhanced-templates/:id - Get template by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await enhancedTemplateService.getTemplateById(id);
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Failed to get template by ID', { error, templateId: req.params.id });
    res.status(404).json({
      success: false,
      error: 'Template not found',
    });
  }
});

/**
 * POST /api/enhanced-templates - Create new template
 */
router.post('/', async (req, res) => {
  try {
    const template = await enhancedTemplateService.createTemplate(req.body);
    
    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Failed to create template', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: 'Failed to create template',
    });
  }
});

/**
 * PUT /api/enhanced-templates/:id - Update template
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await enhancedTemplateService.updateTemplate(id, req.body);
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Failed to update template', { error, templateId: req.params.id, body: req.body });
    res.status(400).json({
      success: false,
      error: 'Failed to update template',
    });
  }
});

/**
 * DELETE /api/enhanced-templates/:id - Delete template
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await enhancedTemplateService.deleteTemplate(id);
    
    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete template', { error, templateId: req.params.id });
    res.status(400).json({
      success: false,
      error: 'Failed to delete template',
    });
  }
});

/**
 * GET /api/enhanced-templates/category/:category - Get templates by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const templates = await enhancedTemplateService.getTemplatesByCategory(category);
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Failed to get templates by category', { error, category: req.params.category });
    res.status(500).json({
      success: false,
      error: 'Failed to get templates by category',
    });
  }
});

/**
 * GET /api/enhanced-templates/seasonal/current - Get current seasonal templates
 */
router.get('/seasonal/current', async (req, res) => {
  try {
    const templates = await enhancedTemplateService.getSeasonalTemplates();
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Failed to get seasonal templates', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get seasonal templates',
    });
  }
});

/**
 * GET /api/enhanced-templates/company/:companyId - Get templates suitable for company
 */
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // TODO: Get company data from company service
    const company = {
      id: companyId,
      industry: req.query.industry as string,
      size: req.query.size as string,
    };

    const templates = await enhancedTemplateService.getTemplatesForCompany(company);
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Failed to get templates for company', { error, companyId: req.params.companyId });
    res.status(500).json({
      success: false,
      error: 'Failed to get templates for company',
    });
  }
});

/**
 * GET /api/enhanced-templates/:id/stats - Get template usage statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await enhancedTemplateService.getTemplateStats(id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get template stats', { error, templateId: req.params.id });
    res.status(400).json({
      success: false,
      error: 'Failed to get template stats',
    });
  }
});

/**
 * POST /api/enhanced-templates/:id/duplicate - Duplicate template
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({
        success: false,
        error: 'newName is required',
      });
    }

    const duplicated = await enhancedTemplateService.duplicateTemplate(id, newName);
    
    res.json({
      success: true,
      data: duplicated,
    });
  } catch (error) {
    logger.error('Failed to duplicate template', { error, templateId: req.params.id, body: req.body });
    res.status(400).json({
      success: false,
      error: 'Failed to duplicate template',
    });
  }
});

/**
 * POST /api/enhanced-templates/:id/toggle - Toggle template active status
 */
router.post('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await enhancedTemplateService.getTemplateById(id);
    
    const updated = await enhancedTemplateService.updateTemplate(id, {
      active: !template.active,
    });
    
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Failed to toggle template status', { error, templateId: req.params.id });
    res.status(400).json({
      success: false,
      error: 'Failed to toggle template status',
    });
  }
});

export default router;
