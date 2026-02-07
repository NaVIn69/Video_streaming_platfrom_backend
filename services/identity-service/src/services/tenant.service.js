import createError from 'http-errors';
import slugify from 'slugify';

export default class TenantService {
  constructor(tenantRepository, roleService, userRepository, logger) {
    this.tenantRepository = tenantRepository;
    this.roleService = roleService;
    this.userRepository = userRepository;
    this.logger = logger;
  }

  async createTenant(data) {
    const { name, contactEmail, metadata } = data;

    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });

    // Check if slug exists
    const existingTenant = await this.tenantRepository.findBySlug(slug);
    if (existingTenant) {
      throw createError(409, 'Tenant with this name already exists');
    }

    const tenant = await this.tenantRepository.create({
      name,
      slug,
      contactEmail,
      metadata,
      isActive: true
    });

    // Automatically provision default roles
    await this.roleService.createDefaultRoles(tenant._id);

    return tenant;
  }
  async;

  async getTenantById(id) {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw createError(404, 'Tenant not found');
    }
    return tenant;
  }

  async getTenantBySlug(slug) {
    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) {
      throw createError(404, 'Tenant not found');
    }
    return tenant;
  }

  async getAllTenants(options) {
    return this.tenantRepository.findAll(options);
  }

  async updateTenant(id, data) {
    const tenant = await this.tenantRepository.updateById(id, data);
    if (!tenant) {
      throw createError(404, 'Tenant not found');
    }
    return tenant;
  }

  async assignTenantAdmin(tenantId, adminData) {
    const { email, password, firstName, lastName } = adminData;

    // Verify tenant exists
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw createError(404, 'Tenant not found');
    }

    // Find admin role
    const adminRole = await this.roleService.getRoleByName('admin', tenantId);
    if (!adminRole) {
      throw createError(500, 'Admin role not found for this tenant');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email, tenantId);
    if (existingUser) {
      throw createError(409, 'User with this email already exists in this tenant');
    }

    // Create Admin User
    // Note: Password hashing is handled by User Model virtual/pre-save hook
    const adminUser = await this.userRepository.create({
      tenantId,
      email,
      password,
      firstName,
      lastName,
      roles: [adminRole._id],
      isActive: true,
      isEmailVerified: true // Assume auto-verified for manually assigned admins
    });

    // Populate roles for response
    await adminUser.populate('roles');

    const userObj = adminUser.toObject();
    delete userObj.passwordHash;

    return userObj;
  }

  async deleteTenant(id) {
    const tenant = await this.tenantRepository.deleteById(id);
    if (!tenant) {
      throw createError(404, 'Tenant not found');
    }
    return { message: 'Tenant deleted successfully' };
  }
}
