import createError from 'http-errors';
import slugify from 'slugify';

export default class TenantService {
  constructor(tenantRepository, roleService, logger) {
    this.tenantRepository = tenantRepository;
    this.roleService = roleService;
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

  async deleteTenant(id) {
    const tenant = await this.tenantRepository.deleteById(id);
    if (!tenant) {
      throw createError(404, 'Tenant not found');
    }
    return { message: 'Tenant deleted successfully' };
  }
}
