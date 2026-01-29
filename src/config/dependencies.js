import mongoose from 'mongoose';
import { Config } from './index.js';
import logger from './logger.js';

// Models
import { User } from '../models/user.model.js';
import { Tenant } from '../models/tenant.model.js';
import { Role } from '../models/role.model.js';
import { Video } from '../models/video.model.js';

// Repositories
import UserRepository from '../repositories/user.repository.js';
import TenantRepository from '../repositories/tenant.repository.js';
import RoleRepository from '../repositories/role.repository.js';
import VideoRepository from '../repositories/video.repository.js';

// Services
import AuthService from '../services/auth.service.js';
import UserService from '../services/user.service.js';
import TenantService from '../services/tenant.service.js';
import RoleService from '../services/role.service.js';
import VideoService from '../services/video.service.js';

// Controllers
import AuthController from '../controllers/auth.controller.js';
import UserController from '../controllers/user.controller.js';
import RoleController from '../controllers/role.controller.js';
import VideoController from '../controllers/video.controller.js';

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

// Initialize dependencies with dependency injection
export function initializeDependencies(io = null) {
  // Repositories
  const userRepository = new UserRepository(User);
  const tenantRepository = new TenantRepository(Tenant);
  const roleRepository = new RoleRepository(Role);
  const videoRepository = new VideoRepository(Video);

  // Services
  const authService = new AuthService(userRepository, tenantRepository, roleRepository, logger);
  const userService = new UserService(userRepository, roleRepository, logger);
  const tenantService = new TenantService(tenantRepository, logger);
  const roleService = new RoleService(roleRepository, logger);
  const videoService = new VideoService(videoRepository, userRepository, logger, io);

  // Controllers
  const authController = new AuthController(authService, logger);
  const userController = new UserController(userService, logger);
  const roleController = new RoleController(roleService, logger);
  const videoController = new VideoController(videoService, logger);

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

    // Controllers
    authController,
    userController,
    roleController,
    videoController,

    // Middleware
    authMiddleware,
    tenantMiddleware
  };
}
