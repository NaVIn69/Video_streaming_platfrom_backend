import mongoose from 'mongoose';
import { Config } from './index.js';
import logger from './logger.js';

// Models
import { User } from '../models/user.model.js';
import { Tenant } from '../models/tenant.model.js';
import { Role } from '../models/role.model.js';
import { Video } from '../models/video.model.js';
import { SuperAdmin } from '../models/superadmin.model.js';

// Repositories
import UserRepository from '../repositories/user.repository.js';
import TenantRepository from '../repositories/tenant.repository.js';
import RoleRepository from '../repositories/role.repository.js';
import VideoRepository from '../repositories/video.repository.js';
import SuperAdminRepository from '../repositories/superadmin.repository.js';

// Services
import AuthService from '../services/auth.service.js';
import UserService from '../services/user.service.js';
import TenantService from '../services/tenant.service.js';
import RoleService from '../services/role.service.js';
import VideoService from '../services/video.service.js';
import ProcessingService from '../services/processing.service.js';
import SensitivityAnalysisService from '../services/sensitivityanalysis.service.js';

// Controllers
import AuthController from '../controllers/auth.controller.js';
import UserController from '../controllers/user.controller.js';
import RoleController from '../controllers/role.controller.js';
import VideoController from '../controllers/video.controller.js';
import TenantController from '../controllers/tenant.controller.js';
import SuperAdminController from '../controllers/superadmin.controller.js';

// Middleware
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { TenantMiddleware } from '../middleware/tenant.middleware.js';

// Initialize database connection
export async function connectDatabase() {
  try {
    await mongoose.connect(Config.MONGO_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
}

import s3Client from './s3.js';
import StorageService from '../services/storage.service.js';

// Initialize dependencies with dependency injection
export function initializeDependencies(io = null) {
  // Repositories
  const userRepository = new UserRepository(User);
  const tenantRepository = new TenantRepository(Tenant);
  const roleRepository = new RoleRepository(Role);
  const videoRepository = new VideoRepository(Video);
  const superAdminRepository = new SuperAdminRepository(SuperAdmin);

  // Services
  const roleService = new RoleService(roleRepository, logger);
  const tenantService = new TenantService(tenantRepository, roleService, logger);

  // Inject s3Client and Bucket Name from Config
  const storageService = new StorageService(s3Client, Config.AWS.BUCKET_NAME, Config);

  // Services
  const authService = new AuthService(
    userRepository,
    tenantService,
    roleRepository,
    superAdminRepository,
    logger
  );
  const userService = new UserService(userRepository, roleRepository, logger);

  // Initialize AI Service
  const aiService = new SensitivityAnalysisService(Config.GEMINI_API_KEY, logger);

  const processingService = new ProcessingService(videoRepository, aiService, io, logger);
  const videoService = new VideoService(
    videoRepository,
    userRepository,
    processingService,
    storageService,
    logger
  );

  // Controllers
  const authController = new AuthController(authService, logger);
  const userController = new UserController(userService, logger);
  const roleController = new RoleController(roleService, logger);
  const videoController = new VideoController(videoService, logger);
  const tenantController = new TenantController(tenantService, logger);
  const superAdminController = new SuperAdminController(
    userService,
    tenantService,
    authService,
    logger
  );

  // Middleware
  const authMiddleware = new AuthMiddleware(authService, userRepository, tenantRepository);
  const tenantMiddleware = new TenantMiddleware(tenantRepository);

  return {
    // Repositories
    userRepository,
    tenantRepository,
    roleRepository,
    videoRepository,

    // Services
    authService,
    userService,
    tenantService,
    roleService,
    videoService,
    processingService,
    storageService,

    // Controllers
    authController,
    userController,
    roleController,
    videoController,
    tenantController,
    superAdminController,

    // Middleware
    authMiddleware,
    tenantMiddleware
  };
}
