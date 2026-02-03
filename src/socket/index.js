import { Server } from 'socket.io';
import logger from '../config/logger.js';
import { socketAuthMiddleware } from '../middleware/socket.middleware.js';
import Config from '../config/index.js';
let io;

export const initializeSocket = server => {
  io = new Server(server, {
    cors: {
      origin: Config.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication Middleware
  io.use(socketAuthMiddleware);

  io.on('connection', socket => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.user.userId}`);

    // Auto-join User Room
    const userRoom = `user:${socket.user.userId}`;
    socket.join(userRoom);
    logger.info(`Socket ${socket.id} joined ${userRoom}`);

    // Join Tenant Room
    socket.on('join:tenant', tenantId => {
      // Security check: ensure user belongs to this tenant
      if (socket.user.tenantId === tenantId) {
        socket.join(`tenant:${tenantId}`);
        logger.info(`Socket ${socket.id} joined tenant room: ${tenantId}`);
      } else {
        logger.warn(`Socket ${socket.id} attempted to join unauthorized tenant: ${tenantId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
