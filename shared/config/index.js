import dotenv from 'dotenv';
import path from 'path';

// Enterprise Best Practice: Cascading Config
// 1. Load Service .env FIRST (Local overrides Root)
dotenv.config({ path: path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

// 2. Load Root .env SECOND (Fallback for shared secrets)
const rootDir = path.resolve(process.cwd(), '../../');
dotenv.config({ path: path.join(rootDir, `.env.${process.env.NODE_ENV || 'dev'}`) });

export const Config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'dev',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/video_streaming',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 1073741824, // 1GB in bytes
  ALLOWED_MIME_TYPES: (
    process.env.ALLOWED_MIME_TYPES || 'video/mp4,video/webm,video/quicktime'
  ).split(','),
  AWS: {
    BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    REGION: process.env.AWS_REGION,
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
  },
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SUPER_ADMIN: {
    EMAIL: process.env.SUPER_ADMIN_EMAIL || 'superadmin@video.com',
    PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'supersecret',
    JWT_SECRET: process.env.SUPER_ADMIN_JWT_SECRET || 'super-admin-secret-key-change-me'
  }
};

/**
 *
 * AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
 */
