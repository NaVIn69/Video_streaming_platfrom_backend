export default class SuperAdminController {
  constructor(userService, tenantService, authService, logger) {
    this.userService = userService;
    this.tenantService = tenantService;
    this.authService = authService;
    this.logger = logger;

    this.assignTenantAdmin = this.assignTenantAdmin.bind(this);
    this.create = this.create.bind(this);
  }

  async assignTenantAdmin(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { userEmail } = req.body;
      const role = 'admin';

      // Verify tenant exists
      const tenant = await this.tenantService.getTenantById(tenantId);
      if (!tenant) {
        // Technically getTenantById throws 404, but just in case
        throw new Error('Tenant not found');
      }

      // Assign 'admin' role to the user involved in that tenant
      // We need to pass the tenantId to ensure we are operating in the right context
      const result = await this.userService.assignRoleToUser(userEmail, role, tenantId);

      this.logger.info(`Superadmin assigned ${userEmail} as admin for tenant ${tenantId}`);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const superAdmin = await this.authService.createSuperAdmin(req.body);
      this.logger.info(`Superadmin created: ${superAdmin.email}`);
      res.status(201).json({
        success: true,
        data: superAdmin
      });
    } catch (err) {
      next(err);
    }
  }
}
