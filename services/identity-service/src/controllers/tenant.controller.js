export default class TenantController {
  constructor(tenantService, logger) {
    this.tenantService = tenantService;
    this.logger = logger;

    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.get = this.get.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.assignAdmin = this.assignAdmin.bind(this);
  }

  async assignAdmin(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const tenantId = req.params.id;

      const admin = await this.tenantService.assignTenantAdmin(tenantId, {
        email,
        password,
        firstName,
        lastName
      });

      this.logger.info(`Admin assigned to tenant ${tenantId}: ${email}`);
      res.status(201).json({
        success: true,
        data: admin
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const tenant = await this.tenantService.createTenant(req.body);
      this.logger.info(`Tenant created by superadmin: ${tenant.slug}`);
      res.status(201).json({
        success: true,
        data: tenant
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const result = await this.tenantService.getAllTenants(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const tenant = await this.tenantService.getTenantById(req.params.id);
      res.json({
        success: true,
        data: tenant
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const tenant = await this.tenantService.updateTenant(req.params.id, req.body);
      this.logger.info(`Tenant updated: ${req.params.id}`);
      res.json({
        success: true,
        data: tenant
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await this.tenantService.deleteTenant(req.params.id);
      this.logger.info(`Tenant deleted: ${req.params.id}`);
      res.json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
