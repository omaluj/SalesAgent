#!/usr/bin/env node

import { mailjetService } from '../modules/mail/mailjet.service.js';
import logger from '../utils/logger.js';

async function testMailjet() {
  console.log('🧪 Testing Mailjet API...\n');

  try {
    // Test 1: Check if service is initialized
    console.log('1. Checking service initialization...');
    const isReady = mailjetService.isReady();
    console.log(`   ✅ Service ready: ${isReady}\n`);

    if (!isReady) {
      console.log('❌ Mailjet service not initialized. Check your API keys in .env file.');
      console.log('   Make sure MAILJET_API_KEY and MAILJET_API_SECRET are set correctly.\n');
      return;
    }

    // Test 2: Test connection
    console.log('2. Testing connection...');
    const connectionTest = await mailjetService.testConnection();
    console.log(`   ✅ Connection test: ${connectionTest ? 'PASSED' : 'FAILED'}\n`);

    if (!connectionTest) {
      console.log('❌ Connection test failed. Check your API keys and internet connection.\n');
      return;
    }

    // Test 3: Send test email
    console.log('3. Sending test email...');
    const testEmail = {
      to: 'test@example.com', // Replace with your test email
      subject: 'Test email from Biz-Agent',
      htmlContent: `
        <h1>Test Email</h1>
        <p>This is a test email from Biz-Agent to verify Mailjet integration.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>If you receive this, Mailjet is working correctly!</p>
      `,
      textContent: 'Test email from Biz-Agent - Mailjet integration test',
      templateName: 'test',
      companyId: 'test-company',
    };

    const sendResult = await mailjetService.sendEmail(testEmail);
    
    if (sendResult.success) {
      console.log('   ✅ Test email sent successfully!');
      console.log(`   📧 Message ID: ${sendResult.messageId}\n`);
    } else {
      console.log('   ❌ Failed to send test email');
      console.log(`   🔍 Error: ${sendResult.error}\n`);
    }

    // Test 4: Get sending statistics
    console.log('4. Getting sending statistics...');
    const stats = await mailjetService.getSendingStats();
    console.log('   📊 Statistics (last 30 days):');
    console.log(`      Sent: ${stats.sent}`);
    console.log(`      Delivered: ${stats.delivered}`);
    console.log(`      Opened: ${stats.opened}`);
    console.log(`      Clicked: ${stats.clicked}`);
    console.log(`      Bounced: ${stats.bounced}\n`);

    console.log('🎉 Mailjet API test completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    logger.error('Mailjet test failed', { error });
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMailjet()
    .then(() => {
      console.log('✅ Mailjet test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Mailjet test failed:', error);
      process.exit(1);
    });
}
