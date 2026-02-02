import express from 'express';
import { authenticateSuperAdmin } from '../middleware/superadmin.middleware.js';

export default function createSuperAdminRoutes(dependencies) {
  const router = express.Router();
  const { superAdminController } = dependencies;

  // All superadmin routes require superadmin authentication
  router.use(authenticateSuperAdmin);

  // Assign admin role to a user in a tenant
  router.post('/tenants/:tenantId/assign-admin', superAdminController.assignTenantAdmin);

  // Create a new superadmin (requires superadmin authentication)
  router.post('/', superAdminController.create);

  return router;
}
