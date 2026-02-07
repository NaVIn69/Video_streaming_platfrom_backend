import express from 'express';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';

export default function createAuthRoutes(dependencies) {
  const router = express.Router();
  const { authController, tenantMiddleware, authMiddleware } = dependencies;

  // Public routes
  router.post(
    '/register',
    tenantMiddleware.extractTenant,
    validateRegister,
    authController.register
  );

  router.post('/login', validateLogin, authController.login);

  // Superadmin Login
  router.post('/admin/login', authController.superAdminLogin);

  // Protected route
  router.get('/me', authMiddleware.authenticate, authController.getProfile);

  return router;
}
