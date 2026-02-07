import express from 'express';
import { AuthMiddleware, authenticateSuperAdmin } from '@video-stream/shared';

export default function createSuperAdminRoutes(dependencies) {
  const router = express.Router();
  const { superAdminController } = dependencies;

  // All superadmin routes require superadmin authentication
  router.post('/register', superAdminController.createSuperAdmin);
  router.post('/login', superAdminController.loginSuperAdmin);

  router.use(authenticateSuperAdmin);
  // Assign admin role to a user in a tenant
  router.post('/tenants/:tenantId/assign-admin', superAdminController.assignTenantAdmin);

  return router;
}
