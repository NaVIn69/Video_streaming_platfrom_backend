import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { verifyToken, PermissionChecker, Config, redisClient } from '@video-stream/shared/index.js';
import morgan from 'morgan';

const PORT = Config.PORT || 4000;

const app = express();

// Security & Logging
app.use(helmet());
app.use(cors({ origin: true, credentials: true })); // Enable credentials for cookies
app.use(cookieParser());
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'API Gateway' });
});

// --- Centralized Authentication Middleware ---
const authenticateRequest =
  (type = 'USER') =>
    async (req, res, next) => {
    // Check Authorization header first, then cookies
      let token = req.headers.authorization?.split(' ')[1];

      if (!token) {
      // Fallback to cookies
        token = req.cookies?.token;
      }

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      try {
      // Verify with the correct secret based on type
        const decoded = verifyToken(token, type);

        // --- REDIS SECURITY CHECK ---
        const tenantId = decoded.tenantId;
        const userId = decoded.userId || decoded.adminId;

        const [isTenantBanned, isUserBanned] = await Promise.all([
          redisClient.exists(`blacklist:tenant:${tenantId}`),
          redisClient.exists(`blacklist:user:${userId}`)
        ]);

        if (isTenantBanned) {
          return res.status(403).json({ error: 'Tenant access has been revoked.' });
        }

        if (isUserBanned) {
          return res.status(401).json({ error: 'User access has been revoked.' });
        }

        req.headers['x-user-id'] = userId; // Handle both user and admin IDs
        req.headers['x-tenant-id'] = tenantId;

        if (decoded.role === 'SUPER_ADMIN') {
          req.headers['x-user-role'] = 'SUPER_ADMIN';
          req.user = { role: 'SUPER_ADMIN' };
        } else if (decoded.roles) {
          req.headers['x-user-roles'] = JSON.stringify(decoded.roles);
          req.user = { roles: decoded.roles };
        }

        next();
      } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };

const checkPermission = (resource, action) => (req, res, next) => {
  try {
    if (req.user?.role === 'SUPER_ADMIN') {
      return next(); // Super Admin has access to everything
    }

    const userRoles = req.user?.roles || [];
    // Use the shared PermisisonChecker to verify access
    const hasPermission = PermissionChecker.hasPermission(userRoles, resource, action);

    if (!hasPermission) {
      return res
        .status(403)
        .json({ error: `Access denied: Missing permission ${resource}.${action}` });
    }

    next();
  } catch {
    return res.status(403).json({ error: 'Access denied' });
  }
};

// --- Proxy Routes ---

// 1. Auth Service (Public Routes - No Auth Check)
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/api/auth' // Keep prefix if service expects it, or strip if needed.
      // Usually Identity Service expects /api/auth/login. Check routes.
      // Identity Service server.js -> app.js -> routes/index.js -> /api/auth
    }
  })
);

// 2. Tenant Management (Protected - Super Admin Only)
app.use(
  '/api/tenants',
  authenticateRequest('SUPER_ADMIN'),
  createProxyMiddleware({
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true
  })
);

// 3. User Management (Protected - User/Admin)
app.use(
  '/api/users',
  authenticateRequest('USER'),
  createProxyMiddleware({
    target: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true
  })
);

// 4. Media Service - Upload (Protected - User + Permission Check)
app.use(
  '/api/videos/upload',
  authenticateRequest('USER'),
  checkPermission('videos', 'upload'),
  createProxyMiddleware({
    target: process.env.MEDIA_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true
  })
);

// 5. Media Service - Process (Protected - User + Permission Check)
app.use(
  '/api/videos/process',
  authenticateRequest('USER'),
  checkPermission('videos', 'upload'),
  createProxyMiddleware({
    target: process.env.MEDIA_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true
  })
);

// 6. Stream Service (Protected - User)
app.use(
  '/api/videos',
  authenticateRequest('USER'),
  createProxyMiddleware({
    target: process.env.STREAM_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true
  })
);

// Start Server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`- Identity Service: ${process.env.IDENTITY_SERVICE_URL}`);
  console.log(`- Media Service: ${process.env.MEDIA_SERVICE_URL}`);
  console.log(`- Stream Service: ${process.env.STREAM_SERVICE_URL}`);
});
