import express from 'express';
import { authenticateSuperAdmin } from '@video-stream/shared/middleware/superadmin.middleware.js';

export default function createTenantRoutes(dependencies) {
  const router = express.Router();
  const { tenantController } = dependencies;

  // Protect all routes with SuperAdmin middleware
  router.use(authenticateSuperAdmin);

  router.post('/create', tenantController.create);
  router.get('/list', tenantController.list);
  router.get('/get/:id', tenantController.get);
  router.patch('/update/:id', tenantController.update);
  router.delete('/delete/:id', tenantController.delete);
  router.post('/:id/assign-admin', tenantController.assignAdmin);

  return router;
}
