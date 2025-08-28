#!/usr/bin/env node
import { gmailService } from '../modules/mail/gmail.service.js';
import logger from '../utils/logger.js';

async function testGmail() {
  console.log('🧪 Testing Gmail API...\n');

  try {
    // Test 1: Check if service is initialized
    console.log('1. Checking service initialization...');
    const isReady = gmailService.isReady();
    console.log(`   ✅ Service ready: ${isReady}\n`);

    if (!isReady) {
      console.log('❌ Gmail service not initialized. Check your credentials.');
      console.log('   Make sure GOOGLE_CALENDAR_CREDENTIALS_PATH points to valid credentials file.\n');
      return;
    }

    // Test 2: Test connection
    console.log('2. Testing connection...');
    const connectionTest = await gmailService.testConnection();
    console.log(`   ✅ Connection test: ${connectionTest ? 'PASSED' : 'FAILED'}\n`);

    if (!connectionTest) {
      console.log('❌ Connection test failed. Check your credentials and internet connection.\n');
      return;
    }

    // Test 3: Send test email
    console.log('3. Sending test email...');
    const testEmail = {
      to: 'test@example.com', // Replace with your test email
      subject: 'Test email from Biz-Agent (Gmail)',
      htmlContent: `
        <h1>Test Email via Gmail</h1>
        <p>This is a test email from Biz-Agent to verify Gmail integration.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>If you receive this, Gmail API is working correctly!</p>
      `,
      textContent: 'Test email from Biz-Agent - Gmail integration test',
      templateName: 'test',
      companyId: 'test-company',
    };

    const sendResult = await gmailService.sendEmail(testEmail);
    
    if (sendResult.success) {
      console.log('   ✅ Test email sent successfully!');
      console.log(`   📧 Message ID: ${sendResult.messageId}\n`);
    } else {
      console.log('   ❌ Failed to send test email');
      console.log(`   🔍 Error: ${sendResult.error}\n`);
    }

    // Test 4: Get sending statistics
    console.log('4. Getting sending statistics...');
    const stats = await gmailService.getSendingStats();
    console.log('   📊 Statistics (last 30 days):');
    console.log(`      Sent: ${stats.sent}`);
    console.log(`      Delivered: ${stats.delivered}`);
    console.log(`      Opened: ${stats.opened}`);
    console.log(`      Clicked: ${stats.clicked}`);
    console.log(`      Bounced: ${stats.bounced}\n`);

    console.log('🎉 Gmail API test completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    logger.error('Gmail test failed', { error });
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGmail()
    .then(() => {
      console.log('✅ Gmail test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Gmail test failed:', error);
      process.exit(1);
    });
}
