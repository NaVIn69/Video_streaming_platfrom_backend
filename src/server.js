import http from 'http';
import app, { setupRoutes } from './app.js';
import logger from './config/logger.js';
import { Config } from './config/index.js';
import { connectDatabase, initializeDependencies } from './config/dependencies.js';

const StartServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    const { initializeSocket } = await import('./socket/index.js');
    const io = initializeSocket(server);

    // Initialize dependencies with Socket.io instance
    const dependencies = initializeDependencies(io);

    // Setup routes with dependencies
    setupRoutes(dependencies);

    // Start server
    const PORT = Number(Config.PORT) || 3000;
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${Config.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

StartServer()
  .then(() => {
    logger.info('Server started successfully');
  })
  .catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
