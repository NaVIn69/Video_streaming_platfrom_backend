import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import { Config } from '../config/index.js';
import logger from '../config/logger.js';

export const authenticateSuperAdmin = (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.token || req.cookies.superadmintoken)) {
      token = req.cookies.token || req.cookies.superadmintoken;
    } else {
      throw createError(401, 'Authentication token required');
    }

    try {
      const decoded = jwt.verify(token, Config.SUPER_ADMIN.JWT_SECRET);

      if (decoded.role !== 'SUPER_ADMIN') {
        throw createError(403, 'Insufficient permissions');
      }

      req.superAdmin = decoded;
      next();
    } catch (err) {
      logger.warn(`Superadmin auth failed: ${err.message}`);
      throw createError(403, 'Invalid or expired superadmin token');
    }
  } catch (error) {
    next(error);
  }
};
