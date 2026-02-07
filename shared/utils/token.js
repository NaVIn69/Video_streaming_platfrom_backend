import jwt from 'jsonwebtoken';
import { Config } from '../config/index.js';
import createError from 'http-errors';

export const verifyToken = (token, type = 'USER') => {
  try {
    const secret = type === 'SUPER_ADMIN' ? Config.SUPER_ADMIN.JWT_SECRET : Config.JWT_SECRET;

    return jwt.verify(token, secret);
  } catch (error) {
    throw createError(401, `Invalid or expired token${error}`);
  }
};
