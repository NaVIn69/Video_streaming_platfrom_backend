import express from 'express';
import logger from './config/logger.js';
import createAuthRoutes from './routes/auth.routes.js';
import createVideoRoutes from './routes/video.routes.js';
import createUserRoutes from './routes/user.routes.js';
import createRoleRoutes from './routes/role.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Video Streaming API' });
});

// Initialize routes with dependencies
export function setupRoutes(dependencies) {
  app.use('/api/auth', createAuthRoutes(dependencies));
  app.use('/api/videos', createVideoRoutes(dependencies));
  app.use('/api/users', createUserRoutes(dependencies));
  app.use('/api/roles', createRoleRoutes(dependencies));
}

// Error handling middleware
app.use((err, req, res, _next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      type: err.name || 'Error',
      message,
      ...(process.env.NODE_ENV === 'dev' && { stack: err.stack })
    }
  });
});

// 404 handler
// app.use((err,req, res) => {
//   res.status(404).json({
//     success: false,
//     error: {
//       message: err
//     }
//     });
// });

export default app;
