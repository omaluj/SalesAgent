import { oauthService } from '../modules/auth/oauth.service.js';
import logger from '../utils/logger.js';

async function testGmailWithOAuth() {
  logger.info('🧪 Testing Gmail with OAuth...');

  try {
    // Test 1: OAuth status
    logger.info('\n1️⃣ Testing OAuth status...');
    const isAuthenticated = await oauthService.isAuthenticated();
    logger.info(`OAuth authenticated: ${isAuthenticated ? '✅ YES' : '❌ NO'}`);

    if (!isAuthenticated) {
      logger.error('OAuth not authenticated. Please run OAuth setup first.');
      return;
    }

    // Test 2: OAuth connection
    logger.info('\n2️⃣ Testing OAuth connection...');
    const connectionTest = await oauthService.testConnection();
    logger.info(`OAuth connection: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (!connectionTest) {
      logger.error('OAuth connection failed.');
      return;
    }

    // Test 3: Gmail API test
    logger.info('\n3️⃣ Testing Gmail API...');
    const { google } = await import('googleapis');
    const oauthClient = oauthService.getOAuthClient();
    
    const gmail = google.gmail({ version: 'v1', auth: oauthClient });
    
    // Test Gmail profile
    const profile = await gmail.users.getProfile({ userId: 'me' });
    logger.info(`Gmail profile: ${profile.data.emailAddress}`);
    logger.info(`Messages total: ${profile.data.messagesTotal}`);
    logger.info(`Threads total: ${profile.data.threadsTotal}`);

    // Test 4: Send test email
    logger.info('\n4️⃣ Testing email sending...');
    
    const testEmail = {
      to: 'sales@domelia.sk',
      subject: 'Test email from Biz-Agent OAuth',
      htmlContent: `
        <h1>Test Email</h1>
        <p>This is a test email sent via OAuth 2.0.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `,
      textContent: 'Test email from Biz-Agent OAuth'
    };

    // Create email message
    const message = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${testEmail.to}`,
      `Subject: ${testEmail.subject}`,
      '',
      testEmail.htmlContent
    ].join('\n');

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    logger.info(`Email sent successfully! Message ID: ${response.data.id}`);

    logger.info('\n✅ Gmail OAuth test completed successfully!');

  } catch (error) {
    logger.error('❌ Gmail OAuth test failed:', error);
  }
}

// Spustiť test ak je súbor spustený priamo
if (import.meta.url === `file://${process.argv[1]}`) {
  testGmailWithOAuth();
}

export { testGmailWithOAuth };
