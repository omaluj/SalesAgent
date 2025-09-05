#!/usr/bin/env tsx

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testCampaignAPI() {
  try {
    console.log('🧪 Testing Campaign API endpoints...\n');

    // Test 1: Get all campaigns
    console.log('1️⃣ Testing GET /api/campaigns');
    try {
      const response = await axios.get(`${API_BASE}/campaigns`);
      console.log('✅ GET /api/campaigns - Success');
      console.log(`   Found ${response.data.data?.length || 0} campaigns`);
    } catch (error: any) {
      console.log('❌ GET /api/campaigns - Failed:', error.response?.data?.error || error.message);
    }

    // Test 2: Get available templates
    console.log('\n2️⃣ Testing GET /api/campaigns/templates/available');
    try {
      const response = await axios.get(`${API_BASE}/campaigns/templates/available`);
      console.log('✅ GET /api/campaigns/templates/available - Success');
      console.log(`   Found ${response.data.data?.length || 0} available templates`);
    } catch (error: any) {
      console.log('❌ GET /api/campaigns/templates/available - Failed:', error.response?.data?.error || error.message);
    }

    // Test 3: Get seasonal templates
    console.log('\n3️⃣ Testing GET /api/campaigns/templates/seasonal');
    try {
      const response = await axios.get(`${API_BASE}/campaigns/templates/seasonal`);
      console.log('✅ GET /api/campaigns/templates/seasonal - Success');
      console.log(`   Found ${response.data.data?.length || 0} seasonal templates`);
    } catch (error: any) {
      console.log('❌ GET /api/campaigns/templates/seasonal - Failed:', error.response?.data?.error || error.message);
    }

    // Test 4: Get enhanced templates
    console.log('\n4️⃣ Testing GET /api/enhanced-templates');
    try {
      const response = await axios.get(`${API_BASE}/enhanced-templates`);
      console.log('✅ GET /api/enhanced-templates - Success');
      console.log(`   Found ${response.data.data?.length || 0} enhanced templates`);
    } catch (error: any) {
      console.log('❌ GET /api/enhanced-templates - Failed:', error.response?.data?.error || error.message);
    }

    // Test 5: Get templates by category
    console.log('\n5️⃣ Testing GET /api/enhanced-templates/category/skolky');
    try {
      const response = await axios.get(`${API_BASE}/enhanced-templates/category/skolky`);
      console.log('✅ GET /api/enhanced-templates/category/skolky - Success');
      console.log(`   Found ${response.data.data?.length || 0} school templates`);
    } catch (error: any) {
      console.log('❌ GET /api/enhanced-templates/category/skolky - Failed:', error.response?.data?.error || error.message);
    }

    // Test 6: Get current seasonal templates
    console.log('\n6️⃣ Testing GET /api/enhanced-templates/seasonal/current');
    try {
      const response = await axios.get(`${API_BASE}/enhanced-templates/seasonal/current`);
      console.log('✅ GET /api/enhanced-templates/seasonal/current - Success');
      console.log(`   Found ${response.data.data?.length || 0} current seasonal templates`);
    } catch (error: any) {
      console.log('❌ GET /api/enhanced-templates/seasonal/current - Failed:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Campaign API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testCampaignAPI();
