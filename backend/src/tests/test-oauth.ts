import { oauthService } from '../modules/auth/oauth.service.js';
import logger from '../utils/logger.js';

async function testOAuth() {
  logger.info('🔐 Testing OAuth Service...');

  try {
    // Test 1: Inicializácia
    logger.info('\n1️⃣ Testing initialization...');
    const authUrl = oauthService.getAuthUrl();
    logger.info(`OAuth authorization URL: ${authUrl}`);

    // Test 2: Skontrolovať autentifikáciu
    logger.info('\n2️⃣ Testing authentication status...');
    const isAuthenticated = await oauthService.isAuthenticated();
    logger.info(`Is authenticated: ${isAuthenticated ? '✅ YES' : '❌ NO'}`);

    if (!isAuthenticated) {
      logger.info('\n📝 OAuth Setup Instructions:');
      logger.info('1. Visit the authorization URL above');
      logger.info('2. Sign in with sales@domelia.sk');
      logger.info('3. Grant permissions to Biz-Agent');
      logger.info('4. Copy the authorization code from the redirect URL');
      logger.info('5. Run: npm run test:oauth-callback <code>');
    }

    // Test 3: Test pripojenia (ak je autentifikovaný)
    if (isAuthenticated) {
      logger.info('\n3️⃣ Testing connection...');
      const connectionTest = await oauthService.testConnection();
      logger.info(`Connection test: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}`);
    }

    // Test 4: Token management
    logger.info('\n4️⃣ Testing token management...');
    const tokens = await oauthService.loadTokens();
    if (tokens) {
      logger.info('Tokens loaded successfully');
      logger.info(`Expires at: ${tokens.expiresAt.toLocaleString()}`);
      logger.info(`Scopes: ${tokens.scope.join(', ')}`);
    } else {
      logger.info('No tokens found in database');
    }

    logger.info('\n✅ OAuth test completed successfully!');

  } catch (error) {
    logger.error('❌ OAuth test failed:', error);
  }
}

// Test OAuth callback
async function testOAuthCallback(code: string) {
  logger.info('🔄 Testing OAuth callback...');

  try {
    const success = await oauthService.handleCallback(code);
    
    if (success) {
      logger.info('✅ OAuth callback successful!');
      
      // Test pripojenie po autentifikácii
      const connectionTest = await oauthService.testConnection();
      logger.info(`Connection test: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}`);
    } else {
      logger.error('❌ OAuth callback failed');
    }
  } catch (error) {
    logger.error('❌ OAuth callback error:', error);
  }
}

// Spustiť test ak je súbor spustený priamo
if (import.meta.url === `file://${process.argv[1]}`) {
  const code = process.argv[2];
  
  if (code) {
    testOAuthCallback(code);
  } else {
    testOAuth();
  }
}

export { testOAuth, testOAuthCallback };
