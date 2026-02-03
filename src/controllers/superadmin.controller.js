import createError from 'http-errors';

export default class SuperAdminController {
  constructor(userService, tenantService, authService, logger) {
    this.userService = userService;
    this.tenantService = tenantService;
    this.authService = authService;
    this.logger = logger;

    this.assignTenantAdmin = this.assignTenantAdmin.bind(this);
    this.createSuperAdmin = this.createSuperAdmin.bind(this);
    this.loginSuperAdmin = this.loginSuperAdmin.bind(this);
  }

  async assignTenantAdmin(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { email } = req.body;
      const role = 'admin';

      // Verify tenant exists
      const tenant = await this.tenantService.getTenantById(tenantId);
      if (!tenant) {
        // Technically getTenantById throws 404, but just in case
        throw createError(404, 'Tenant not found');
      }

      // Assign 'admin' role to the user involved in that tenant
      // We need to pass the tenantId to ensure we are operating in the right context
      const result = await this.userService.assignRoleToUser(email, role, tenantId);

      this.logger.info(`Superadmin assigned ${email} as admin for tenant ${tenantId}`);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async createSuperAdmin(req, res, next) {
    try {
      const superAdmin = await this.authService.createSuperAdmin(req.body);
      this.logger.info(`Superadmin created: ${superAdmin.email}`);
      res
        .status(200)
        .cookie('superadmintoken', superAdmin.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        })
        .json({
          success: true,
          data: superAdmin
        });
    } catch (err) {
      next(err);
    }
  }

  async loginSuperAdmin(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.loginSuperAdmin(email, password);
      this.logger.info(`Superadmin logged in: ${email}`);
      res
        .status(200)
        .cookie('superadmintoken', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        })
        .json({
          success: true,
          data: result
        });
    } catch (err) {
      next(err);
    }
  }
}
