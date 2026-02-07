import createError from 'http-errors';

export class TenantMiddleware {
  constructor(tenantRepository) {
    this.tenantRepository = tenantRepository;
  }

  // Extract tenant from subdomain or header
  extractTenant = async (req, res, next) => {
    try {
      // 1. Gateway Trusted Header (Fast Path)
      const gwTenantId = req.headers['x-tenant-id'];
      if (gwTenantId) {
        req.tenantId = gwTenantId;
        req.tenant = { _id: gwTenantId, isActive: true }; // Minimal tenant object
        return next();
      }

      // 2. Fallback: Slug Lookup (Requires Repository)
      if (!this.tenantRepository) {
        // If no repository and no header, we can't identify tenant securely in standalone mode without a DB.
        // For dev/mock, we might fallback to default.
        console.warn(
          'TenantMiddleware: No repository and no x-tenant-id header. Defaulting to mock.'
        );
        req.tenantId = 'default-tenant-id';
        req.tenant = { _id: 'default-tenant-id', name: 'Default', isActive: true };
        return next();
      }

      // Try to get tenant from subdomain
      const host = req.headers.host || '';
      const subdomain = host.split('.')[0];

      // Or from header
      const tenantSlug =
        req.body?.tenantSlug || req.headers['x-tenant-slug'] || req.query.tenant || subdomain;

      if (!tenantSlug || tenantSlug === 'localhost' || tenantSlug === 'www') {
        // Default tenant for development
        req.tenantSlug = 'default';
      } else {
        req.tenantSlug = tenantSlug;
      }

      // Find tenant
      const tenant = await this.tenantRepository.findBySlug(req.tenantSlug);
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant._id.toString();
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  // Ensure tenant isolation - users can only access their tenant's data
  enforceTenantIsolation = () => {
    return (req, res, next) => {
      try {
        if (!req.tenantId) {
          throw createError(400, 'Tenant context required');
        }

        // Ensure all queries are scoped to tenant
        // This is enforced at the repository level, but we add an extra check here
        if (req.params.tenantId && req.params.tenantId !== req.tenantId) {
          throw createError(403, 'Access denied: Tenant isolation violation');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}

export default TenantMiddleware;
