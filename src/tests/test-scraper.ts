#!/usr/bin/env node
import { contactScraperService } from '../modules/scraper/contact-scraper.service.js';
import logger from '../utils/logger.js';

async function testScraper() {
  console.log('🧪 Testing Contact Scraper...\n');

  try {
    // Test 1: Scrape a real website
    console.log('1. Testing website scraping...');
    const testWebsite = 'https://domelia.sk'; // Replace with a real website
    
    console.log(`   🔍 Scraping: ${testWebsite}`);
    const contactInfo = await contactScraperService.scrapeWebsite(testWebsite);
    
    console.log(`   📧 Emails found: ${contactInfo.emails.length}`);
    console.log(`   📞 Phones found: ${contactInfo.phones.length}`);
    console.log(`   📍 Addresses found: ${contactInfo.addresses.length}`);
    
    if (contactInfo.emails.length > 0) {
      console.log(`   📧 Sample emails: ${contactInfo.emails.slice(0, 3).join(', ')}`);
    }
    
    if (contactInfo.phones.length > 0) {
      console.log(`   📞 Sample phones: ${contactInfo.phones.slice(0, 3).join(', ')}`);
    }
    
    if (contactInfo.addresses.length > 0) {
      console.log(`   📍 Sample address: ${contactInfo.addresses[0]}`);
    }
    
    if (contactInfo.contactPerson) {
      console.log(`   👤 Contact person: ${contactInfo.contactPerson}`);
    }
    
    console.log();

    // Test 2: Test multiple websites
    console.log('2. Testing multiple websites...');
    const testWebsites = [
      'https://domelia.sk',
      // Add more test websites here
    ];
    
    const scrapedCompanies = await contactScraperService.scrapeMultipleWebsites(testWebsites);
    
    console.log(`   🏢 Companies scraped: ${scrapedCompanies.length}\n`);
    
    for (const company of scrapedCompanies) {
      console.log(`      - ${company.companyName}`);
      console.log(`        🌐 ${company.website}`);
      console.log(`        📧 ${company.contactInfo.emails.length} emails`);
      console.log(`        📞 ${company.contactInfo.phones.length} phones\n`);
    }

    console.log('🎉 Contact Scraper test completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    logger.error('Contact Scraper test failed', { error });
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testScraper()
    .then(() => {
      console.log('✅ Contact Scraper test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Contact Scraper test failed:', error);
      process.exit(1);
    });
}
