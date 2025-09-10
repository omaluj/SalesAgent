import { Router } from 'express';
import { companyService } from '../../modules/companies/company-service.js';
import { companyDiscoveryService } from '../../modules/companies/company-discovery.service.js';
import { googleSearchService } from '../../modules/search/google-search.service.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/contacts/test - Test endpoint
 */
router.get('/test', (req, res) => {
  logger.info('🧪 TEST: /api/contacts/test called');
  res.json({ success: true, message: 'Contacts route works!' });
});

/**
 * GET /api/contacts/search - Search for companies with targeting criteria
 */
router.get('/search', async (req, res) => {
  try {
    const {
      industry,
      location = 'Slovakia',
      size,
      hasEmail,
      hasPhone,
      status = 'PENDING',
      limit = 20
    } = req.query;

    logger.info('Contact search request', {
      industry,
      location,
      size,
      hasEmail,
      hasPhone,
      status,
      limit
    });

    // Build filter object
    const filter: any = {};
    if (industry) filter.industry = industry as string;
    if (size) filter.size = size as string;
    if (hasEmail === 'true') filter.hasEmail = true;
    if (hasPhone === 'true') filter.hasPhone = true;
    if (status) filter.status = status as string;

    // Find companies with filters
    const companies = await companyService.findCompaniesToContact(filter, parseInt(limit as string));

    res.json({
      success: true,
      data: {
        companies,
        total: companies.length,
        filters: filter
      }
    });
  } catch (error) {
    logger.error('Failed to search contacts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to search contacts'
    });
  }
});

/**
 * POST /api/contacts/discover - Discover new companies by industry and location
 */
router.post('/discover', async (req, res): Promise<void> => {
  try {
    const {
      industries,
      location = 'Slovakia',
      maxCompaniesPerIndustry = 10
    } = req.body;

    if (!industries || !Array.isArray(industries) || industries.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Industries array is required'
      });
      return;
    }

    logger.info('Company discovery request', {
      industries,
      location,
      maxCompaniesPerIndustry
    });

    // Run discovery pipeline
    const results = await companyDiscoveryService.runDiscoveryPipeline(
      industries,
      location,
      maxCompaniesPerIndustry
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Failed to discover companies', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to discover companies'
    });
  }
});

/**
 * GET /api/contacts/industries - Get available industries for targeting
 */
router.get('/industries', async (req, res) => {
  try {
    // Get unique industries from existing companies
    const companies = await companyService.findCompaniesToContact({}, 1000);
    const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));

    // Add common industries if not present
    const commonIndustries = [
      'IT & Software',
      'E-commerce',
      'Manufacturing',
      'Healthcare',
      'Education',
      'Finance',
      'Real Estate',
      'Marketing & Advertising',
      'Consulting',
      'Retail',
      'Food & Beverage',
      'Automotive',
      'Construction',
      'Tourism & Hospitality',
      'Media & Entertainment'
    ];

    const allIndustries = Array.from(new Set([...industries, ...commonIndustries])).sort();

    res.json({
      success: true,
      data: allIndustries
    });
  } catch (error) {
    logger.error('Failed to get industries', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get industries'
    });
  }
});

/**
 * GET /api/contacts/locations - Get available locations for targeting
 */
router.get('/locations', async (req, res) => {
  try {
    const locations = [
      'Slovakia',
      'Czech Republic',
      'Poland',
      'Hungary',
      'Austria',
      'Germany',
      'Bratislava',
      'Košice',
      'Prešov',
      'Žilina',
      'Banská Bystrica',
      'Trnava',
      'Trenčín',
      'Nitra',
      'Prague',
      'Brno',
      'Ostrava',
      'Warsaw',
      'Krakow',
      'Budapest',
      'Vienna',
      'Berlin',
      'Munich'
    ];

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    logger.error('Failed to get locations', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get locations'
    });
  }
});

/**
 * GET /api/contacts/stats - Get contact discovery statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await companyDiscoveryService.getDiscoveryStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get contact stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get contact stats'
    });
  }
});

/**
 * POST /api/contacts/test-search - Test search functionality with mock data
 */
router.post('/test-search', async (req, res) => {
  try {
    const { query, industry, location } = req.body;

    logger.info('Test search request', { query, industry, location });

    // Test Google Search
    const searchResults = await googleSearchService.searchCompanies(query, industry, location);

    res.json({
      success: true,
      data: {
        searchResults,
        query,
        industry,
        location
      }
    });
  } catch (error) {
    logger.error('Failed to test search', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to test search'
    });
  }
});

export default router;
