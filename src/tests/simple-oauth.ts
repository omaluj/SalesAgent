import { oauthService } from '../modules/auth/oauth.service.js';
import logger from '../utils/logger.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function simpleOAuthFlow() {
  logger.info('🔐 Simple OAuth Flow...');

  try {
    // 1. Získať authorization URL
    const authUrl = oauthService.getAuthUrl();
    logger.info('\n📋 OAuth Authorization URL:');
    logger.info(authUrl);
    
    logger.info('\n📝 Instructions:');
    logger.info('1. Copy the URL above and paste it in your browser');
    logger.info('2. Sign in with sales@domelia.sk');
    logger.info('3. Grant permissions to Biz-Agent');
    logger.info('4. You will be redirected to localhost (which will fail)');
    logger.info('5. Copy the authorization code from the URL');
    logger.info('6. Paste it here when prompted');

    // 2. Počkať na authorization code
    const code = await new Promise<string>((resolve) => {
      rl.question('\n🔑 Enter authorization code: ', (answer) => {
        resolve(answer.trim());
      });
    });

    if (!code) {
      logger.error('No authorization code provided');
      rl.close();
      return;
    }

    // 3. Spracovať authorization code
    logger.info('\n🔄 Processing authorization code...');
    const success = await oauthService.handleCallback(code);
    
    if (success) {
      logger.info('✅ OAuth authorization successful!');
      
      // 4. Test pripojenie
      logger.info('\n🧪 Testing connection...');
      const connectionTest = await oauthService.testConnection();
      logger.info(`Connection test: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (connectionTest) {
        logger.info('\n🎉 OAuth setup completed successfully!');
        logger.info('You can now use Gmail and Calendar APIs.');
      }
    } else {
      logger.error('❌ OAuth authorization failed');
    }

  } catch (error) {
    logger.error('❌ OAuth flow failed:', error);
  } finally {
    rl.close();
  }
}

// Spustiť ak je súbor spustený priamo
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleOAuthFlow();
}

export { simpleOAuthFlow };
