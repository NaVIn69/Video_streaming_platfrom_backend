export default class UserController {
  constructor(userService, logger) {
    this.userService = userService;
    this.logger = logger;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req, res, next) {
    try {
      const user = await this.userService.createUser(req.body, req.tenantId);
      this.logger.info(`User created: ${user.email}`);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search
      };

      const result = await this.userService.getUsers(req.tenantId, options);
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.params.id, req.tenantId);
      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body, req.tenantId);
      this.logger.info(`User updated: ${req.params.id}`);
      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await this.userService.deleteUser(req.params.id, req.tenantId);
      this.logger.info(`User deleted: ${req.params.id}`);
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
