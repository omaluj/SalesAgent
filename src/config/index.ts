import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schemas
const databaseSchema = z.object({
  url: z.string().url('Invalid database URL'),
});

const mailjetSchema = z.object({
  apiKey: z.string().min(1, 'Mailjet API key is required').optional(),
  apiSecret: z.string().min(1, 'Mailjet API secret is required').optional(),
  senderEmail: z.string().email('Invalid sender email').optional(),
  senderName: z.string().min(1, 'Sender name is required').optional(),
});

const googleCalendarSchema = z.object({
  calendarId: z.string().default('primary'),
  credentialsPath: z.string().min(1, 'Google credentials path is required').optional(),
});

const rateLimitingSchema = z.object({
  maxEmailsPerHour: z.number().min(1).max(100).default(6),
  maxRequestsPerMinute: z.number().min(1).max(100).default(10),
  emailDelaySeconds: z.number().min(60).max(3600).default(600),
});

const loggingSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  file: z.string().default('logs/biz-agent.log'),
  maxSize: z.string().default('10m'),
  maxFiles: z.number().min(1).max(10).default(5),
});

const appSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().min(1).max(65535).default(3000),
  cronSchedule: z.string().default('*/10 * * * *'),
  debugMode: z.boolean().default(false),
  skipRateLimiting: z.boolean().default(false),
});

const securitySchema = z.object({
  encryptionKey: z.string().min(32, 'Encryption key must be at least 32 characters').optional(),
  jwtSecret: z.string().min(1, 'JWT secret is required').optional(),
});

const externalApisSchema = z.object({
  googleSearchApiKey: z.string().optional(),
  googleSearchEngineId: z.string().optional(),
  googleOauthClientId: z.string().optional(),
  googleOauthClientSecret: z.string().optional(),
  googleOauthRedirectUri: z.string().optional(),
});

const monitoringSchema = z.object({
  sentryDsn: z.string().optional(),
  metricsPort: z.number().min(1).max(65535).default(9090),
});

// Main configuration schema
const configSchema = z.object({
  database: databaseSchema,
  mailjet: mailjetSchema,
  googleCalendar: googleCalendarSchema,
  rateLimiting: rateLimitingSchema,
  logging: loggingSchema,
  app: appSchema,
  security: securitySchema,
  externalApis: externalApisSchema,
  monitoring: monitoringSchema,
});

// Parse and validate configuration
const parseConfig = () => {
  try {
    const config = configSchema.parse({
      database: {
        url: process.env.DATABASE_URL,
      },
      mailjet: {
        apiKey: process.env.MAILJET_API_KEY,
        apiSecret: process.env.MAILJET_API_SECRET,
        senderEmail: process.env.MAILJET_SENDER_EMAIL,
        senderName: process.env.MAILJET_SENDER_NAME,
      },
      googleCalendar: {
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        credentialsPath: process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH,
      },
      rateLimiting: {
        maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '6'),
        maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '10'),
        emailDelaySeconds: parseInt(process.env.EMAIL_DELAY_SECONDS || '600'),
      },
      logging: {
        level: process.env.LOG_LEVEL as any,
        file: process.env.LOG_FILE,
        maxSize: process.env.LOG_MAX_SIZE,
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
      },
      app: {
        nodeEnv: process.env.NODE_ENV as any,
        port: parseInt(process.env.APP_PORT || '3000'),
        cronSchedule: process.env.CRON_SCHEDULE,
        debugMode: process.env.DEBUG_MODE === 'true',
        skipRateLimiting: process.env.SKIP_RATE_LIMITING === 'true',
      },
      security: {
        encryptionKey: process.env.ENCRYPTION_KEY,
        jwtSecret: process.env.JWT_SECRET,
      },
      externalApis: {
        googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY,
        googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
        googleOauthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        googleOauthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        googleOauthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
      },
      monitoring: {
        sentryDsn: process.env.SENTRY_DSN,
        metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
      },
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid configuration');
  }
};

// Export validated configuration
export const config = parseConfig();

// Type exports
export type Config = z.infer<typeof configSchema>;
export type DatabaseConfig = z.infer<typeof databaseSchema>;
export type MailjetConfig = z.infer<typeof mailjetSchema>;
export type GoogleCalendarConfig = z.infer<typeof googleCalendarSchema>;
export type RateLimitingConfig = z.infer<typeof rateLimitingSchema>;
export type LoggingConfig = z.infer<typeof loggingSchema>;
export type AppConfig = z.infer<typeof appSchema>;
export type SecurityConfig = z.infer<typeof securitySchema>;
export type ExternalApisConfig = z.infer<typeof externalApisSchema>;
export type MonitoringConfig = z.infer<typeof monitoringSchema>;
