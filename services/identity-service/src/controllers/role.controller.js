export default class RoleController {
  constructor(roleService, logger) {
    this.roleService = roleService;
    this.logger = logger;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req, res, next) {
    try {
      const role = await this.roleService.createRole(req.body, req.tenantId);
      this.logger.info(`Role created: ${role.name}`);
      res.status(201).json({
        success: true,
        data: role
      });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const roles = await this.roleService.getRolesByTenant(req.tenantId);
      res.json({
        success: true,
        data: roles
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const role = await this.roleService.getRoleById(req.params.id, req.tenantId);
      res.json({
        success: true,
        data: role
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const role = await this.roleService.updateRole(req.params.id, req.body, req.tenantId);
      this.logger.info(`Role updated: ${req.params.id}`);
      res.json({
        success: true,
        data: role
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await this.roleService.deleteRole(req.params.id, req.tenantId);
      this.logger.info(`Role deleted: ${req.params.id}`);
      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
