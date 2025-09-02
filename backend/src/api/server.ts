import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { errorHandler } from '../utils/errors.js';
import { slotGeneratorService } from '../modules/calendar/slot-generator.service.js';

// Import routes
import dashboardRoutes from './routes/dashboard.js';
import emailRoutes from './routes/email.js';
import calendarRoutes from './routes/calendar.js';
import publicCalendarRoutes from './routes/public-calendar.js';
import templateRoutes from './routes/templates.js';
import analyticsRoutes from './routes/analytics.js';

export class ApiServer {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.app.apiPort || 3001;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.app.nodeEnv === 'development' 
        ? ['http://localhost:3000', 'http://localhost:3001'] 
        : config.app.allowedOrigins || [],
      credentials: true
    }));

    // Logging middleware
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.app.nodeEnv,
        version: '1.0.0'
      });
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/dashboard', dashboardRoutes);
    this.app.use('/api/email', emailRoutes);
    this.app.use('/api/calendar', calendarRoutes);
    this.app.use('/api/public/calendar', publicCalendarRoutes);
    this.app.use('/api/templates', templateRoutes);
    this.app.use('/api/analytics', analyticsRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('API Error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });

      errorHandler.handleError(error, { context: 'api_server' });

      res.status(error.status || 500).json({
        error: config.app.nodeEnv === 'development' ? error.message : 'Internal server error',
        ...(config.app.nodeEnv === 'development' && { stack: error.stack })
      });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`API Server started on port ${this.port}`, {
        environment: config.app.nodeEnv,
        port: this.port
      });
      
      // Spustiť slot generator cron job
      slotGeneratorService.startCronJob();
      logger.info('📅 Slot generator service spustený s automatickým cron jobom');
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Export singleton instance
export const apiServer = new ApiServer();
