import http from 'http';
import app, { setupRoutes } from './app.js';
import logger from '@video-stream/shared/config/logger.js';
import { Config } from '@video-stream/shared/config/index.js';
import mongoose from 'mongoose';
import s3Client from '@video-stream/shared/config/s3.js';

// Models (Cross-service or duplicated import for shared DB access)
import { Video } from './models/video.model.js';
// We need User model for AuthMiddleware if we keep it stateful
// import { User } from '../../identity-service/src/models/user.model.js';
// Use relative path to Identity Service for now to avoid duplication code drift

// Repositories
import VideoRepository from './repositories/video.repository.js';

// Services
import VideoService from './services/video.service.js';
import ProcessingService from './services/processing.service.js';
import StorageService from './services/storage.service.js';
import SensitivityAnalysisService from './services/sensitivityanalysis.service.js';

// Controllers
import VideoController from './controllers/video.controller.js';

// Middleware
// import { AuthMiddleware } from '@video-stream/shared/middleware/auth.middleware.js';
// For Media Service, we might need a simplified Auth flow or link to Identity DB.
// Assuming we wire basic dependencies for now.
import { TenantMiddleware } from '@video-stream/shared/middleware/tenant.middleware.js';

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
    const authMiddleware = {
      authenticate: (req, res, next) => {
        // Simplified JWT verify here or allow all for dev?
        // Ideally we import the real AuthMiddleware and give it the real UserRepo (connected to shared DB)
        return next();
      },
      requirePermission: () => (req, res, next) => next()
    };

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
