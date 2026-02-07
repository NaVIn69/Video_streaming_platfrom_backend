import express from 'express';
import logger from '@video-stream/shared/config/logger.js';
import createVideoRoutes from './routes/video.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Stream Service' });
});

export function setupRoutes(dependencies) {
  app.use('/api/videos', createVideoRoutes(dependencies)); // Includes Stream
}

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

export default app;
