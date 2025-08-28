#!/usr/bin/env node
import { googleSearchService } from '../modules/search/google-search.service.js';
import logger from '../utils/logger.js';

async function testSearch() {
  console.log('🧪 Testing Google Search API...\n');

  try {
    // Test 1: Check if service is initialized
    console.log('1. Checking service initialization...');
    const isReady = googleSearchService.isReady();
    console.log(`   ✅ Service ready: ${isReady}\n`);

    if (!isReady) {
      console.log('❌ Google Search service not initialized. Check your API key.');
      console.log('   Make sure GOOGLE_SEARCH_API_KEY is set correctly.\n');
      return;
    }

    // Test 2: Test connection
    console.log('2. Testing connection...');
    const connectionTest = await googleSearchService.testConnection();
    console.log(`   ✅ Connection test: ${connectionTest ? 'PASSED' : 'FAILED'}\n`);

    if (!connectionTest) {
      console.log('❌ Connection test failed. Check your API key and internet connection.\n');
      return;
    }

    // Test 3: Search for companies
    console.log('3. Searching for companies...');
    const searchResults = await googleSearchService.searchCompanies(
      'IT companies',
      'technology',
      'Slovakia'
    );

    console.log(`   📊 Found ${searchResults.length} companies\n`);
    
    for (let i = 0; i < Math.min(searchResults.length, 3); i++) {
      const result = searchResults[i];
      console.log(`      ${i + 1}. ${result.title}`);
      console.log(`         📍 ${result.displayLink}`);
      console.log(`         📝 ${result.snippet.substring(0, 100)}...\n`);
    }

    // Test 4: Search by industry
    console.log('4. Testing industry search...');
    const industryResults = await googleSearchService.searchCompaniesByIndustry(
      'IT',
      'Slovakia'
    );

    console.log(`   🏢 Found ${industryResults.length} companies in IT industry\n`);
    
    for (let i = 0; i < Math.min(industryResults.length, 2); i++) {
      const result = industryResults[i];
      console.log(`      ${i + 1}. ${result.companyName}`);
      console.log(`         🌐 ${result.website}`);
      console.log(`         📧 Emails: ${result.potentialEmails.length}`);
      console.log(`         📞 Phones: ${result.potentialPhones.length}\n`);
    }

    console.log('🎉 Google Search API test completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    logger.error('Google Search test failed', { error });
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSearch()
    .then(() => {
      console.log('✅ Google Search test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Google Search test failed:', error);
      process.exit(1);
    });
}
