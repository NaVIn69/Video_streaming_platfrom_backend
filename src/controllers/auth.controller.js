export default class AuthController {
  constructor(authService, logger) {
    this.authService = authService;
    this.logger = logger;

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.superAdminLogin = this.superAdminLogin.bind(this);
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
      /**
        {
        httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
      }
      //  */
      // res.status(200).cookie('token', result.token).json({
      //    success: true,
      //   data: result
      // })
      // res.cookie("token", "test123").json({ ok: true });
      res
        .status(200)
        .cookie('token', result.token, {
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

  async superAdminLogin(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.loginSuperAdmin(email, password);
      this.logger.info(`Superadmin logged in: ${email}`);

      res
        .status(200)
        .cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        })
        .json({
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
