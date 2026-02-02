import http from 'http';
import { Server } from 'socket.io';
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
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
      }
    });

    // Socket.io connection handling
    io.on('connection', socket => {
      logger.info(`Socket connected: ${socket.id}`);

      // Join tenant room for real-time updates
      socket.on('join:tenant', tenantId => {
        socket.join(`tenant:${tenantId}`);
        logger.info(`Socket ${socket.id} joined tenant: ${tenantId}`);
      });

      // Join user room for private updates
      socket.on('join:user', userId => {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined user: ${userId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

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
