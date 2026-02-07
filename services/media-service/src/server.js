import http from 'http';
import mongoose from 'mongoose';
import app, { setupRoutes } from './app.js';
import {
  logger,
  Config,
  s3Client,
  AuthMiddleware,
  verifyToken,
  TenantMiddleware
} from '@video-stream/shared';

// Models (Cross-service or duplicated import for shared DB access)
import { Video } from './models/video.model.js';

// Repositories
import VideoRepository from './repositories/video.repository.js';

// Services
import VideoService from './services/video.service.js';
import ProcessingService from './services/processing.service.js';
import StorageService from './services/storage.service.js';
import SensitivityAnalysisService from './services/sensitivityanalysis.service.js';

// Controllers
import VideoController from './controllers/video.controller.js';

const StartServer = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected successfully');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io (Moved to Media Service)
    const { initializeSocket } = await import('./socket/index.js');
    const io = initializeSocket(server);

    // Dependency Injection Wiring

    // Repositories
    const videoRepository = new VideoRepository(Video);

    // External Services
    const aiService = new SensitivityAnalysisService(Config.GEMINI_API_KEY, logger);
    const storageService = new StorageService(s3Client, Config.AWS.BUCKET_NAME, Config);

    // Internal Services
    const processingService = new ProcessingService(videoRepository, aiService, io, logger);
    const videoService = new VideoService(
      videoRepository,
      null, // userRepository - Needs decision. Pass null? Logic might break if it tries to fetch user.
      processingService,
      storageService,
      logger
    );

    // Controllers
    const videoController = new VideoController(videoService, logger);

    // Middleware
    // Mock Auth Middleware or full stack?
    // Using a placeholder that MUST be fixed in "Fix Impacts" phase
    // Proxy Auth Service for Stateless Verification
    const proxyAuthService = {
      verifyToken: async token => {
        return verifyToken(token);
      }
    };

    // Middleware - Stateless Mode
    const authMiddleware = new AuthMiddleware(proxyAuthService, null, null);

    // Tenant Repo is needed for TenantMiddleware
    const tenantRepository = { findById: async () => ({ isActive: true }) }; // Mock
    const tenantMiddleware = new TenantMiddleware(tenantRepository);

    const dependencies = {
      videoController,
      authMiddleware,
      tenantMiddleware,
      storageService
    };

    // Setup routes
    setupRoutes(dependencies);

    // Start server
    const PORT = process.env.PORT || 3002;
    server.listen(PORT, () => {
      logger.info(`Media Service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
};

StartServer();
