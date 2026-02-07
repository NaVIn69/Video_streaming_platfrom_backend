import http from 'http';
import app, { setupRoutes } from './app.js';
import logger from '@video-stream/shared/config/logger.js';
import { Config } from '@video-stream/shared/config/index.js'; // Verify shared config path
import mongoose from 'mongoose';

// Models
import { Video } from './models/video.model.js';

// Repositories
import VideoRepository from './repositories/video.repository.js';

// Services
import VideoService from './services/video.service.js';
// Ideally duplicate StorageService logic if simple, or import.
// For now, I'll assume we duplicated it or import it from Media Service directly.

// Controllers
import VideoController from './controllers/video.controller.js';

const StartServer = async () => {
  try {
    await mongoose.connect(Config.MONGO_URI);
    logger.info('MongoDB connected successfully');

    const server = http.createServer(app);

    const videoRepository = new VideoRepository(Video);

    // Mock Services not needed for Streaming (Processing, AI)
    const processingService = {};
    const storageService = { getVideoStream: () => {} }; // Needs actual implementation logic

    const videoService = new VideoService(
      videoRepository,
      null,
      processingService,
      storageService,
      logger
    );

    const videoController = new VideoController(videoService, logger);

    const authMiddleware = {
      authenticate: (req, res, next) => next(), // Implement JWT verification
      requirePermission: () => (req, res, next) => next()
    };

    const tenantMiddleware = { extractTenant: (req, res, next) => next() };

    const dependencies = {
      videoController,
      authMiddleware,
      tenantMiddleware,
      storageService
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
