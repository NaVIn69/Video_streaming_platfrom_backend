import { body, param, validationResult } from 'express-validator';
import createError from 'http-errors';

export const validateRoleCreate = [
  body('name')
    .isIn(['viewer', 'editor', 'admin'])
    .withMessage('Role name must be viewer, editor, or admin'),
  body('permissions').optional().isObject(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateRoleUpdate = [
  param('id').isMongoId().withMessage('Invalid role ID'),
  body('permissions').optional().isObject(),
  body('isActive').optional().isBoolean(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];

export const validateRoleId = [
  param('id').isMongoId().withMessage('Invalid role ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg));
    }
    next();
  }
];
