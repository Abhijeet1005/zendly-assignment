const express = require('express');
const { validateEnv, config } = require('./config/env');
const { initializeGemini } = require('./config/gemini');
const { checkConnection: checkDbConnection } = require('./config/database');
const { startGracePeriodJob, stopGracePeriodJob } = require('./jobs/gracePeriodJob');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Routes
const operatorRoutes = require('./routes/operators');
const conversationRoutes = require('./routes/conversations');
const inboxRoutes = require('./routes/inboxes');
const labelRoutes = require('./routes/labels');

// Validate environment variables
try {
  validateEnv();
  logger.info('Environment variables validated');
} catch (error) {
  logger.error('Environment validation failed', { error: error.message });
  process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDbConnection();
  
  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy ? 'up' : 'down',
    timestamp: new Date().toISOString()
  };

  res.status(dbHealthy ? 200 : 503).json(health);
});

// API routes
app.use('/api/operators', operatorRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/inboxes', inboxRoutes);
app.use('/api', labelRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize services and start server
async function start() {
  try {
    // Initialize Gemini AI
    initializeGemini();
    logger.info('Gemini AI initialized');

    // Start grace period background job
    startGracePeriodJob();

    // Start server
    const port = config.port;
    const server = app.listen(port, () => {
      logger.info(`Server started on port ${port}`, {
        environment: config.nodeEnv,
        port
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      stopGracePeriodJob();
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start application', { error: error.message });
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  start();
}

module.exports = app;
