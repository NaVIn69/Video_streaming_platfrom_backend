import express from 'express';
import {
  validateUserCreate,
  validateUserUpdate,
  validateUserId,
  validateUserQuery
} from '../validators/user.validator.js';

export default function createUserRoutes(dependencies) {
  const router = express.Router();
  const { userController, authMiddleware } = dependencies;

  // All user routes require authentication
  router.use(authMiddleware.authenticate);

  // Create user (requires create permission)
  router.post(
    '/',
    authMiddleware.requirePermission('users', 'create'),
    validateUserCreate,
    userController.create
  );

  // Get all users (requires view permission)
  router.get(
    '/',
    authMiddleware.requirePermission('users', 'view'),
    validateUserQuery,
    userController.getAll
  );

  // Get user by ID (requires view permission)
  router.get(
    '/:id',
    authMiddleware.requirePermission('users', 'view'),
    validateUserId,
    userController.getById
  );

  // Update user (requires edit permission)
  router.put(
    '/:id',
    authMiddleware.requirePermission('users', 'edit'),
    validateUserId,
    validateUserUpdate,
    userController.update
  );

  // Delete user (requires delete permission)
  router.delete(
    '/:id',
    authMiddleware.requirePermission('users', 'delete'),
    validateUserId,
    userController.delete
  );

  return router;
}
