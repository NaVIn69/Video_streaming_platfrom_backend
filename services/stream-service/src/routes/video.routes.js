import express from 'express';

export default function createVideoRoutes(dependencies) {
  const router = express.Router();
  const { videoController, authMiddleware, tenantMiddleware, storageService } = dependencies;

  // Global middleware
  router.use(authMiddleware.authenticate);
  router.use(tenantMiddleware.extractTenant);

  // Stream Video (All roles)
  router.get(
    '/:id/stream',
    authMiddleware.requirePermission('videos', 'view'),
    videoController.stream
  );

  return router;
}
