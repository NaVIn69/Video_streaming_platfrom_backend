import express from 'express';
import {
  validateVideoUpload,
  validateVideoUpdate,
  validateVideoId,
  validateVideoQuery
} from '../validators/video.validator.js';

import { singleVideoUpload } from '../middleware/upload.middleware.js';

export default function createVideoRoutes(dependencies) {
  const router = express.Router();
  const { videoController, authMiddleware } = dependencies;

  // All video routes require authentication
  router.use(authMiddleware.authenticate);

  // Upload video (requires upload permission)
  router.post(
    '/',
    authMiddleware.requirePermission('videos', 'upload'),
    singleVideoUpload,
    validateVideoUpload,
    videoController.upload
  );

  // Get all videos (requires view permission)
  router.get(
    '/',
    authMiddleware.requirePermission('videos', 'view'),
    validateVideoQuery,
    videoController.getAll
  );

  // Get video by ID (requires view permission)
  router.get(
    '/:id',
    authMiddleware.requirePermission('videos', 'view'),
    validateVideoId,
    videoController.getById
  );

  // Stream video (requires view permission)
  router.get(
    '/:id/stream',
    authMiddleware.requirePermission('videos', 'view'),
    validateVideoId,
    videoController.stream
  );

  // Update video (requires edit permission)
  router.put(
    '/:id',
    authMiddleware.requirePermission('videos', 'edit'),
    validateVideoId,
    validateVideoUpdate,
    videoController.update
  );

  // Delete video (requires delete permission)
  router.delete(
    '/:id',
    authMiddleware.requirePermission('videos', 'delete'),
    validateVideoId,
    videoController.delete
  );

  return router;
}
