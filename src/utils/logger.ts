import winston from 'winston';
import path from 'path';
import { config } from '@/config/index.js';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.dirname(config.logging.file);
import fs from 'fs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { 
    service: 'biz-agent',
    environment: config.app.nodeEnv,
  },
  transports: [
    // Console transport for development
    ...(config.app.nodeEnv === 'development' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    ] : []),
    
    // File transport for all environments
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: parseInt(config.logging.maxSize),
      maxFiles: config.logging.maxFiles,
      tailable: true,
    }),
    
    // Error file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: parseInt(config.logging.maxSize),
      maxFiles: config.logging.maxFiles,
      tailable: true,
    }),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: parseInt(config.logging.maxSize),
      maxFiles: config.logging.maxFiles,
    }),
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: parseInt(config.logging.maxSize),
      maxFiles: config.logging.maxFiles,
    }),
  ],
});

// Add request ID to logs if available
export const addRequestId = (requestId: string) => {
  return logger.child({ requestId });
};

// Log levels with custom methods
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Custom logger methods
export const logError = (message: string, error?: Error, meta?: Record<string, any>) => {
  logger.error(message, { 
    error: error?.message, 
    stack: error?.stack,
    ...meta 
  });
};

export const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: Record<string, any>) => {
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    operation,
    ...meta,
  });
};

// API logging
export const logApiCall = (method: string, url: string, statusCode: number, duration: number) => {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level](`API Call: ${method} ${url}`, {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  });
};

// Email logging
export const logEmailSent = (to: string, template: string, success: boolean, meta?: Record<string, any>) => {
  const level = success ? 'info' : 'error';
  logger[level](`Email ${success ? 'sent' : 'failed'}: ${template}`, {
    to,
    template,
    success,
    ...meta,
  });
};

// Calendar logging
export const logCalendarEvent = (action: 'created' | 'updated' | 'deleted', eventId: string, meta?: Record<string, any>) => {
  logger.info(`Calendar event ${action}`, {
    action,
    eventId,
    ...meta,
  });
};

export default logger;
