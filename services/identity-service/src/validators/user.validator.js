import { body, param, query, validationResult } from 'express-validator';
import createError from 'http-errors';

export const validateUserCreate = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('roleIds').optional().isArray().withMessage('roleIds must be an array'),
  body('roleIds.*').optional().isMongoId().withMessage('Invalid role ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateUserUpdate = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 8 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('roleIds').optional().isArray(),
  body('roleIds.*').optional().isMongoId(),
  body('isActive').optional().isBoolean(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateUserId = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateUserQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];
