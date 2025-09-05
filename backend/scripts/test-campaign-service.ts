#!/usr/bin/env tsx

import { campaignService } from '../src/modules/campaigns/campaign.service.js';

async function testCampaignService() {
  try {
    console.log('🧪 Testing Campaign Service directly...\n');

    // Test 1: Get all campaigns
    console.log('1️⃣ Testing getCampaigns()');
    try {
      const campaigns = await campaignService.getCampaigns();
      console.log('✅ getCampaigns() - Success');
      console.log(`   Found ${campaigns.length} campaigns`);
      
      if (campaigns.length > 0) {
        campaigns.forEach(campaign => {
          console.log(`   - ${campaign.name} (${campaign.status})`);
        });
      }
    } catch (error: any) {
      console.log('❌ getCampaigns() - Failed:', error.message);
    }

    // Test 2: Get campaigns with filters
    console.log('\n2️⃣ Testing getCampaigns() with filters');
    try {
      const campaigns = await campaignService.getCampaigns({ status: 'ACTIVE' });
      console.log('✅ getCampaigns({ status: "ACTIVE" }) - Success');
      console.log(`   Found ${campaigns.length} active campaigns`);
    } catch (error: any) {
      console.log('❌ getCampaigns({ status: "ACTIVE" }) - Failed:', error.message);
    }

    // Test 3: Get campaign by ID (if we have any)
    console.log('\n3️⃣ Testing getCampaignById()');
    try {
      const allCampaigns = await campaignService.getCampaigns();
      if (allCampaigns.length > 0) {
        const firstCampaign = allCampaigns[0];
        const campaign = await campaignService.getCampaignById(firstCampaign.id);
        console.log('✅ getCampaignById() - Success');
        console.log(`   Campaign: ${campaign.name}`);
        console.log(`   Template: ${campaign.template.name}`);
        console.log(`   Companies: ${campaign.campaignCompanies.length}`);
      } else {
        console.log('   ℹ️ No campaigns to test with');
      }
    } catch (error: any) {
      console.log('❌ getCampaignById() - Failed:', error.message);
    }

    // Test 4: Get campaign stats (if we have any)
    console.log('\n4️⃣ Testing getCampaignStats()');
    try {
      const allCampaigns = await campaignService.getCampaigns();
      if (allCampaigns.length > 0) {
        const firstCampaign = allCampaigns[0];
        const stats = await campaignService.getCampaignStats(firstCampaign.id);
        console.log('✅ getCampaignStats() - Success');
        console.log(`   Total: ${stats.total}`);
        console.log(`   Sent: ${stats.sent}`);
        console.log(`   Delivered: ${stats.delivered}`);
      } else {
        console.log('   ℹ️ No campaigns to test with');
      }
    } catch (error: any) {
      console.log('❌ getCampaignStats() - Failed:', error.message);
    }

    console.log('\n🎉 Campaign Service testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testCampaignService();
