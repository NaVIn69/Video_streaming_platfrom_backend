import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import { Config } from '../config/index.js';

export default class AuthService {
  constructor(userRepository, tenantService, roleRepository, superAdminRepository, logger) {
    this.userRepository = userRepository;
    this.tenantService = tenantService;
    this.roleRepository = roleRepository;
    this.superAdminRepository = superAdminRepository;
    this.logger = logger;
  }

  async register(data) {
    const { email, password, firstName, lastName, tenantSlug } = data;

    // Find or create tenant via Service (handles roles)
    const tenant = await this.tenantService.getTenantBySlug(tenantSlug);
    if (!tenant) {
      throw createError(404, 'Tenant not found');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email, tenant._id);
    if (existingUser) {
      throw createError(409, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const role = await this.roleRepository.findByName('viewer', tenant._id);
    if (!role) {
      throw createError(500, 'Default roles not fully provisioned for tenant');
    }

    // Create user
    const user = await this.userRepository.create({
      tenantId: tenant._id,
      email,
      passwordHash,
      firstName,
      lastName,
      roles: [role._id],
      isActive: true
    });

    await user.populate('roles');

    // Remove sensitive data
    const userObj = user.toObject();
    delete userObj.passwordHash;

    return userObj;
  }

  async login(email, password, tenantSlug) {
    // Find tenant
    const tenant = await this.tenantService.getTenantBySlug(tenantSlug);
    if (!tenant || !tenant.isActive) {
      throw createError(404, 'Tenant not found or inactive');
    }

    // Find user
    const user = await this.userRepository.findByEmail(email, tenant._id);
    if (!user || !user.isActive) {
      throw createError(401, 'user is not active or Found');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw createError(401, 'Invalid credentials');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user._id);

    // Generate JWT token
    const token = this.generateToken(user, tenant);

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        roles: user.roles
      }
    };
  }

  generateToken(user, tenant) {
    const payload = {
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      email: user.email,
      roles: user.roles.map(r => r.name || r)
    };

    return jwt.sign(payload, Config.JWT_SECRET, {
      expiresIn: Config.JWT_EXPIRES_IN || '7d'
    });
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, Config.JWT_SECRET);
      return decoded;
    } catch {
      throw createError(401, 'Invalid or expired token');
    }
  }

  async loginSuperAdmin(email, password) {
    // 1. Check Config (Hardcoded SuperAdmin)
    if (email === Config.SUPER_ADMIN.EMAIL && password === Config.SUPER_ADMIN.PASSWORD) {
      const token = jwt.sign(
        {
          role: 'SUPER_ADMIN',
          email: Config.SUPER_ADMIN.EMAIL
        },
        Config.SUPER_ADMIN.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return {
        token,
        message: 'Superadmin logged in successfully'
      };
    }

    // 2. Check Database (Dynamic SuperAdmins)
    if (this.superAdminRepository) {
      const admin = await this.superAdminRepository.findByEmail(email);
      if (admin && admin.isActive) {
        const isValid = await bcrypt.compare(password, admin.passwordHash);
        if (isValid) {
          await this.superAdminRepository.updateLastLogin(admin._id);
          const token = jwt.sign(
            {
              role: 'SUPER_ADMIN',
              email: admin.email,
              id: admin._id
            },
            Config.SUPER_ADMIN.JWT_SECRET,
            { expiresIn: '1d' }
          );
          return {
            token,
            message: 'Superadmin logged in successfully'
          };
        }
      }
    }

    throw createError(401, 'Invalid superadmin credentials');
  }

  async createSuperAdmin(data) {
    const { email, password, firstName, lastName } = data;

    // Check if exists
    const existing = await this.superAdminRepository.findByEmail(email);
    if (existing) {
      throw createError(409, 'Superadmin with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await this.superAdminRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      isActive: true
    });

    // Return without password
    const adminObj = admin.toObject();
    delete adminObj.passwordHash;
    return adminObj;
  }
}
