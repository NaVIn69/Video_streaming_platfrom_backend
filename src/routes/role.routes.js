import express from 'express';
import {
  validateRoleCreate,
  validateRoleUpdate,
  validateRoleId
} from '../validators/role.validator.js';

export default function createRoleRoutes(dependencies) {
  const router = express.Router();
  const { roleController, authMiddleware } = dependencies;

  // All role routes require authentication
  router.use(authMiddleware.authenticate);

  // Create role (requires tenant management permission)
  router.post(
    '/',
    authMiddleware.requirePermission('tenants', 'manage'),
    validateRoleCreate,
    roleController.create
  );

  // Get all roles for tenant
  router.get('/', roleController.getAll);

  // Get role by ID
  router.get('/:id', validateRoleId, roleController.getById);

  // Update role (requires tenant management permission)
  router.put(
    '/:id',
    authMiddleware.requirePermission('tenants', 'manage'),
    validateRoleId,
    validateRoleUpdate,
    roleController.update
  );

  // Delete role (requires tenant management permission)
  router.delete(
    '/:id',
    authMiddleware.requirePermission('tenants', 'manage'),
    validateRoleId,
    roleController.delete
  );

  return router;
}
