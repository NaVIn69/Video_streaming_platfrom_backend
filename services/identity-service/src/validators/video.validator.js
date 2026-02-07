import { body, param, query, validationResult } from 'express-validator';
import createError from 'http-errors';

export const validateVideoUpload = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateVideoUpdate = [
  param('id').isMongoId().withMessage('Invalid video ID'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateVideoId = [
  param('id').isMongoId().withMessage('Invalid video ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateVideoQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['uploading', 'processing', 'completed', 'failed', 'flagged']),
  query('isSafe').optional().isBoolean().withMessage('isSafe must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];
