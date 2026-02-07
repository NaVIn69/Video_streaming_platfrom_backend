import http from 'http';
import app, { setupRoutes } from './app.js';
import {
  logger,
  Config,
  AuthMiddleware,
  TenantMiddleware,
  verifyToken
} from '@video-stream/shared';
import mongoose from 'mongoose';

// Models
import { Video } from './models/video.model.js';

// Repositories
import VideoRepository from './repositories/video.repository.js';

// Services
import VideoService from './services/video.service.js';

// Controllers
import VideoController from './controllers/video.controller.js';

const StartServer = async () => {
  try {
    await mongoose.connect(Config.MONGO_URI);
    logger.info('MongoDB connected successfully');

    const server = http.createServer(app);

    const videoRepository = new VideoRepository(Video);

    const videoService = new VideoService(videoRepository, logger);

    const videoController = new VideoController(videoService, logger);

    // 3. Auth & Tenant Middleware (Stateless/Gateway Mode)
    // Pass minimal dependencies. AuthMiddleware uses verifyToken from shared.
    // TenantMiddleware will trust x-tenant-id header from Gateway.

    const proxyAuthService = { verifyToken };
    const authMiddleware = new AuthMiddleware(proxyAuthService, null, null);
    const tenantMiddleware = new TenantMiddleware(null); // No repository needed for stream service

    const dependencies = {
      videoController,
      authMiddleware,
      tenantMiddleware
    };

    setupRoutes(dependencies);

    const PORT = Config.PORT;
    server.listen(PORT, () => {
      logger.info(`Stream Service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
};

StartServer();
