import { body, validationResult } from 'express-validator';
import createError from 'http-errors';

export const validateRegister = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters')
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('tenantSlug').optional().trim().isLength({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('tenantSlug').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];
