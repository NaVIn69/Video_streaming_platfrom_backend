export default class AuthController {
  constructor(authService, logger) {
    this.authService = authService;
    this.logger = logger;

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.getProfile = this.getProfile.bind(this);
  }

  async register(req, res, next) {
    try {
      const user = await this.authService.register(req.body);
      this.logger.info(`User registered: ${user.email}`);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const tenantSlug = req.tenantSlug || req.body.tenantSlug || 'default';
      const result = await this.authService.login(req.body.email, req.body.password, tenantSlug);
      this.logger.info(`User logged in: ${req.body.email}`);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  getProfile(req, res, next) {
    try {
      const userObj = req.user.toObject();
      delete userObj.passwordHash;
      res.json({
        success: true,
        data: {
          user: userObj,
          tenant: req.tenant
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
