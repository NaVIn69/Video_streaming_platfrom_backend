import multer from 'multer';
import createError from 'http-errors';
import { Config } from '../config/index.js';

// Memory storage for processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = Config.ALLOWED_MIME_TYPES || ['video/mp4', 'video/webm', 'video/quicktime'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: parseInt(Config.MAX_FILE_SIZE) || 1073741824 // 1GB default
  },
  fileFilter
});

export const singleVideoUpload = uploadMiddleware.single('video');
