#!/usr/bin/env node

import { companyDiscoveryService } from '../modules/companies/company-discovery.service.js';
import { googleSearchService } from '../modules/search/google-search.service.js';
import { contactScraperService } from '../modules/scraper/contact-scraper.service.js';
import logger from '../utils/logger.js';

async function testDiscovery() {
  console.log('🧪 Testing Company Discovery Pipeline...\n');

  try {
    // Test 1: Google Search Service
    console.log('1. Testing Google Search Service...');
    const isSearchReady = googleSearchService.isReady();
    console.log(`   ✅ Google Search ready: ${isSearchReady}`);

    if (isSearchReady) {
      const searchResults = await googleSearchService.searchCompanies('IT companies Slovakia');
      console.log(`   📊 Found ${searchResults.length} companies via search\n`);
    } else {
      console.log('   ⚠️  Google Search not configured, using mock results\n');
    }

    // Test 2: Contact Scraper Service
    console.log('2. Testing Contact Scraper Service...');
    const testWebsite = 'https://example.com'; // Replace with real test website
    console.log(`   🔍 Scraping test website: ${testWebsite}`);
    
    try {
      const contactInfo = await contactScraperService.scrapeWebsite(testWebsite);
      console.log(`   📧 Emails found: ${contactInfo.emails.length}`);
      console.log(`   📞 Phones found: ${contactInfo.phones.length}`);
      console.log(`   📍 Addresses found: ${contactInfo.addresses.length}\n`);
    } catch (error) {
      console.log('   ⚠️  Scraping failed (expected for example.com)\n');
    }

    // Test 3: Company Discovery (small test)
    console.log('3. Testing Company Discovery (small test)...');
    const discoveryResults = await companyDiscoveryService.discoverCompaniesByIndustry(
      'IT',
      'Slovakia',
      2 // Only 2 companies for testing
    );

    console.log(`   🏢 Companies discovered: ${discoveryResults.length}`);
    
    for (const result of discoveryResults) {
      console.log(`      - ${result.companyName} (${result.website})`);
      console.log(`        Emails: ${result.emails.length}, Phones: ${result.phones.length}`);
    }
    console.log();

    // Test 4: Save to Database
    console.log('4. Testing Database Save...');
    const saveResults = await companyDiscoveryService.saveDiscoveredCompanies(discoveryResults);
    console.log(`   💾 Saved: ${saveResults.saved}`);
    console.log(`   ⏭️  Skipped: ${saveResults.skipped}`);
    console.log(`   ❌ Errors: ${saveResults.errors}\n`);

    // Test 5: Discovery Statistics
    console.log('5. Testing Discovery Statistics...');
    const stats = await companyDiscoveryService.getDiscoveryStats();
    console.log(`   📊 Total companies: ${stats.totalCompanies}`);
    console.log(`   🆕 Recent discoveries (24h): ${stats.recentDiscoveries}`);
    console.log(`   🏭 Companies by industry: ${Object.keys(stats.companiesByIndustry).length} industries`);
    console.log(`   📈 Companies by status: ${Object.keys(stats.companiesByStatus).length} statuses\n`);

    // Test 6: Full Pipeline (optional)
    console.log('6. Testing Full Discovery Pipeline...');
    console.log('   ⚠️  This will take some time and use API quotas');
    console.log('   💡 Run this manually: npm run test:discovery:full\n');

    console.log('🎉 Company Discovery Pipeline test completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    logger.error('Discovery test failed', { error });
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDiscovery()
    .then(() => {
      console.log('✅ Discovery test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Discovery test failed:', error);
      process.exit(1);
    });
}
