import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import { Config } from '../config/index.js';

export default class AuthService {
  constructor(userRepository, tenantRepository, roleRepository, logger) {
    this.userRepository = userRepository;
    this.tenantRepository = tenantRepository;
    this.roleRepository = roleRepository;
    this.logger = logger;
  }

  async register(data) {
    const { email, password, firstName, lastName, tenantSlug } = data;

    // Find or create tenant
    let tenant = await this.tenantRepository.findBySlug(tenantSlug);
    if (!tenant) {
      tenant = await this.tenantRepository.create({
        name: tenantSlug,
        slug: tenantSlug,
        isActive: true
      });
      this.logger.info(`Created new tenant: ${tenantSlug}`);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email, tenant._id);
    if (existingUser) {
      throw createError(409, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get default role (viewer)
    let role = await this.roleRepository.findByName('viewer', tenant._id);
    if (!role) {
      role = await this.roleRepository.create({
        tenantId: tenant._id,
        name: 'viewer'
      });
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
    const tenant = await this.tenantRepository.findBySlug(tenantSlug);
    if (!tenant || !tenant.isActive) {
      throw createError(404, 'Tenant not found or inactive');
    }

    // Find user
    const user = await this.userRepository.findByEmail(email, tenant._id);
    if (!user || !user.isActive) {
      throw createError(401, 'Invalid credentials');
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
}
