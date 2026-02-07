import express from 'express';

export default function createVideoRoutes(dependencies) {
  const router = express.Router();
  const { videoController, authMiddleware, tenantMiddleware, storageService } = dependencies;

  // Global middleware
  router.use(authMiddleware.authenticate);
  router.use(tenantMiddleware.extractTenant);

  // Upload Video (Editors/Admins only)
  router.post(
    '/upload',
    authMiddleware.requirePermission('videos', 'upload'),
    (req, res, next) => {
      // Initialize middleware lazily to handle eventual consistency of Config
      const upload = storageService.getUploadMiddleware();
      const uploadSingle = upload.single('video');
      uploadSingle(req, res, next);
    },
    videoController.upload
  );

  // List Videos (All roles)
  router.get('/', authMiddleware.requirePermission('videos', 'view'), videoController.list);

  // Stream Video (All roles)
  router.get(
    '/:id/stream',
    authMiddleware.requirePermission('videos', 'view'),
    videoController.stream
  );

  return router;
}
