import { google } from 'googleapis';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

export class OAuthService {
  private oauth2Client: any;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeOAuthClient();
  }

  private initializeOAuthClient(): void {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        config.externalApis.googleOauthClientId,
        config.externalApis.googleOauthClientSecret,
        config.externalApis.googleOauthRedirectUri
      );

      logger.info('OAuth client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OAuth client:', error);
    }
  }

  /**
   * Získa URL pre OAuth autorizáciu
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Vždy požiada o consent pre refresh token
    });

    logger.info('Generated OAuth authorization URL');
    return authUrl;
  }

  /**
   * Spracuje OAuth callback a uloží tokens
   */
  async handleCallback(code: string): Promise<boolean> {
    try {
      logger.info('Processing OAuth callback...');

      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        logger.error('Invalid tokens received from OAuth callback');
        return false;
      }

      // Uložiť tokens do databázy
      await this.saveTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000), // 1 hodina
        scope: tokens.scope?.split(' ') || []
      });

      // Nastaviť credentials pre OAuth client
      this.oauth2Client.setCredentials(tokens);

      logger.info('OAuth tokens saved successfully');
      return true;
    } catch (error) {
      logger.error('Failed to handle OAuth callback:', error);
      return false;
    }
  }

  /**
   * Uloží OAuth tokens do databázy
   */
  private async saveTokens(tokens: OAuthTokens): Promise<void> {
    try {
      // Upsert tokens - ak existujú, aktualizuje ich
      await this.prisma.oAuthTokens.upsert({
        where: { id: 1 }, // Používame ID 1 pre hlavný token
        update: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          scope: tokens.scope,
          updatedAt: new Date()
        },
        create: {
          id: 1,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          scope: tokens.scope,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info('OAuth tokens saved to database');
    } catch (error) {
      logger.error('Failed to save OAuth tokens:', error);
      throw error;
    }
  }

  /**
   * Načíta tokens z databázy
   */
  async loadTokens(): Promise<OAuthTokens | null> {
    try {
      const dbTokens = await this.prisma.oAuthTokens.findUnique({
        where: { id: 1 }
      });

      if (!dbTokens) {
        logger.warn('No OAuth tokens found in database');
        return null;
      }

      const tokens: OAuthTokens = {
        accessToken: dbTokens.accessToken,
        refreshToken: dbTokens.refreshToken,
        expiresAt: dbTokens.expiresAt,
        scope: dbTokens.scope
      };

      // Nastaviť credentials pre OAuth client
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiresAt.getTime()
      });

      logger.info('OAuth tokens loaded from database');
      return tokens;
    } catch (error) {
      logger.error('Failed to load OAuth tokens:', error);
      return null;
    }
  }

  /**
   * Obnoví access token pomocou refresh token
   */
  async refreshToken(): Promise<boolean> {
    try {
      logger.info('Refreshing OAuth token...');

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        logger.error('Failed to refresh access token');
        return false;
      }

      // Aktualizovať tokens v databáze
      await this.prisma.oAuthTokens.update({
        where: { id: 1 },
        data: {
          accessToken: credentials.access_token,
          expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000),
          updatedAt: new Date()
        }
      });

      // Aktualizovať OAuth client
      this.oauth2Client.setCredentials(credentials);

      logger.info('OAuth token refreshed successfully');
      return true;
    } catch (error) {
      logger.error('Failed to refresh OAuth token:', error);
      return false;
    }
  }

  /**
   * Skontroluje, či máme validné OAuth tokens
   */
  async hasValidTokens(): Promise<boolean> {
    try {
      const tokens = await this.loadTokens();
      
      if (!tokens) {
        return false;
      }

      // Skontrolovať, či token neexpiroval
      if (tokens.expiresAt <= new Date()) {
        logger.info('OAuth token expired, attempting refresh...');
        return await this.refreshToken();
      }

      return true;
    } catch (error) {
      logger.error('Failed to check if tokens are valid:', error);
      return false;
    }
  }

  /**
   * Získa OAuth client pre použitie v Gmail/Calendar services
   */
  async getOAuthClient(): Promise<any> {
    try {
      // Skontrolovať, či máme validné tokens
      if (!await this.hasValidTokens()) {
        logger.warn('No valid OAuth tokens, cannot provide OAuth client');
        return null;
      }

      // Načítať tokens a nastaviť credentials
      const tokens = await this.loadTokens();
      if (tokens) {
        this.oauth2Client.setCredentials({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expiry_date: tokens.expiresAt.getTime()
        });
      }

      return this.oauth2Client;
    } catch (error) {
      logger.error('Failed to get OAuth client:', error);
      return null;
    }
  }

  /**
   * Vymaže všetky tokens (logout)
   */
  async logout(): Promise<void> {
    try {
      await this.prisma.oAuthTokens.delete({
        where: { id: 1 }
      });

      this.oauth2Client.revokeCredentials();
      logger.info('OAuth tokens cleared successfully');
    } catch (error) {
      logger.error('Failed to logout:', error);
    }
  }

  /**
   * Skontroluje či je používateľ autentifikovaný
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await this.loadTokens();
      return tokens !== null && tokens.accessToken !== null;
    } catch (error) {
      logger.error('Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Testuje OAuth pripojenie
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!await this.isAuthenticated()) {
        logger.warn('Not authenticated, cannot test connection');
        return false;
      }

      // Test Gmail API
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.getProfile({ userId: 'me' });

      logger.info('OAuth connection test: SUCCESS');
      return true;
    } catch (error) {
      logger.error('OAuth connection test: FAILED', error);
      return false;
    }
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
