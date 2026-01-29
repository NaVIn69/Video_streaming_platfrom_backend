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

  router.post('/login', tenantMiddleware.extractTenant, validateLogin, authController.login);

  // Protected route
  router.get('/profile', authMiddleware.authenticate, authController.getProfile);

  return router;
}
