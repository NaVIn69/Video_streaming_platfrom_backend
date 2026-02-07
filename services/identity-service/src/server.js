import http from 'http';
import app, { setupRoutes } from './app.js';
import { logger, Config, AuthMiddleware, TenantMiddleware } from '@video-stream/shared';
import mongoose from 'mongoose';

// Models
import { User } from './models/user.model.js';
import { Tenant } from './models/tenant.model.js';
import { Role } from './models/role.model.js';
import { SuperAdmin } from './models/superadmin.model.js';

// Repositories
import UserRepository from './repositories/user.repository.js';
import TenantRepository from './repositories/tenant.repository.js';
import RoleRepository from './repositories/role.repository.js';
import SuperAdminRepository from './repositories/superadmin.repository.js';

// Services
import AuthService from './services/auth.service.js';
import UserService from './services/user.service.js';
import TenantService from './services/tenant.service.js';
import RoleService from './services/role.service.js';

// Controllers
import AuthController from './controllers/auth.controller.js';
import UserController from './controllers/user.controller.js';
import RoleController from './controllers/role.controller.js';
import TenantController from './controllers/tenant.controller.js';
import SuperAdminController from './controllers/superadmin.controller.js';

const StartServer = async () => {
  try {
    // Connect to database
    await mongoose.connect(Config.MONGO_URI);
    logger.info('MongoDB connected successfully');

    // Create HTTP server
    const server = http.createServer(app);

    // Dependency Injection Wiring
    // Repositories
    const userRepository = new UserRepository(User);
    const tenantRepository = new TenantRepository(Tenant);
    const roleRepository = new RoleRepository(Role);
    const superAdminRepository = new SuperAdminRepository(SuperAdmin);

    // Services
    const roleService = new RoleService(roleRepository, logger);
    const tenantService = new TenantService(tenantRepository, roleService, userRepository, logger);
    const authService = new AuthService(
      userRepository,
      tenantService,
      roleRepository,
      superAdminRepository,
      logger
    );
    const userService = new UserService(userRepository, roleRepository, logger);

    // Controllers
    const authController = new AuthController(authService, logger);
    const userController = new UserController(userService, logger);
    const roleController = new RoleController(roleService, logger);
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

    const dependencies = {
      authController,
      userController,
      roleController,
      tenantController,
      superAdminController,
      authMiddleware,
      tenantMiddleware
    };

    // Setup routes
    setupRoutes(dependencies);

    // Start server
    const PORT = Config.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`Identity Service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
};

StartServer();
