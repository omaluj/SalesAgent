#!/usr/bin/env tsx

import express from 'express';
import { campaignService } from '../src/modules/campaigns/campaign.service.js';
import logger from '../src/utils/logger.js';

const app = express();
const port = 3002;

// Test route
app.get('/test-campaigns', async (req, res) => {
  try {
    console.log('🔍 Testing campaign service directly...');
    
    // Test 1: Direct service call
    const campaigns = await campaignService.getCampaigns();
    console.log('✅ Service call successful:', campaigns.length, 'campaigns found');
    
    // Test 2: With filters
    const activeCampaigns = await campaignService.getCampaigns({ status: 'ACTIVE' });
    console.log('✅ Filtered call successful:', activeCampaigns.length, 'active campaigns found');
    
    // Test 3: Get specific campaign
    if (campaigns.length > 0) {
      const firstCampaign = campaigns[0];
      console.log('✅ First campaign:', firstCampaign.name, firstCampaign.status);
      
      const campaignDetails = await campaignService.getCampaignById(firstCampaign.id);
      console.log('✅ Campaign details:', campaignDetails.name, campaignDetails.template.name);
    }
    
    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
      activeCount: activeCampaigns.length
    });
    
  } catch (error) {
    console.error('❌ Error in test route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`🧪 Debug server running on port ${port}`);
  console.log(`🔍 Test URL: http://localhost:${port}/test-campaigns`);
});
