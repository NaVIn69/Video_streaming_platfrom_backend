import createError from 'http-errors';
import { PermissionChecker } from '../utils/permissions.js';

export class AuthMiddleware {
  constructor(authService, userRepository, tenantRepository) {
    this.authService = authService;
    this.userRepository = userRepository;
    this.tenantRepository = tenantRepository;
  }

  authenticate = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

      if (!token) {
        throw createError(401, 'No token provided');
      }

      const decoded = await this.authService.verifyToken(token);

      // Verify user still exists and is active
      const user = await this.userRepository.findById(decoded.userId, decoded.tenantId);

      if (!user || !user.isActive) {
        throw createError(401, 'User not found or inactive');
      }

      // Verify tenant is active
      const tenant = await this.tenantRepository.findById(decoded.tenantId);
      if (!tenant || !tenant.isActive) {
        throw createError(401, 'Tenant not found or inactive');
      }

      // Attach user and tenant to request
      req.user = user;
      req.tenant = tenant;
      req.userId = decoded.userId;
      req.tenantId = decoded.tenantId;

      next();
    } catch (error) {
      next(error);
    }
  };

  requirePermission = (resource, action) => {
    return (req, res, next) => {
      try {
        if (!req.user || !req.user.roles) {
          throw createError(403, 'Access denied: No roles assigned');
        }

        const hasPermission = PermissionChecker.hasPermission(req.user.roles, resource, action);

        if (!hasPermission) {
          throw createError(
            403,
            `Access denied: Insufficient permissions for ${resource}:${action}`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };

  requireTenantAccess = () => {
    return (req, res, next) => {
      try {
        // Ensure user can only access their tenant's data
        if (req.params.tenantId) {
          if (req.params.tenantId !== req.tenantId.toString()) {
            throw createError(403, 'Access denied: Tenant mismatch');
          }
        }

        // Ensure tenantId in body matches user's tenant
        if (req.body.tenantId) {
          if (req.body.tenantId !== req.tenantId.toString()) {
            throw createError(403, 'Access denied: Tenant mismatch');
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}

export default AuthMiddleware;
