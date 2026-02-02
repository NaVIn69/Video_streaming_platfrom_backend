import createError from 'http-errors';

export default class RoleService {
  constructor(roleRepository, logger) {
    this.roleRepository = roleRepository;
    this.logger = logger;
  }

  async createRole(data, tenantId) {
    const { name, permissions } = data;

    // Check if role exists
    const existingRole = await this.roleRepository.findByName(name, tenantId);
    if (existingRole) {
      throw createError(409, 'Role with this name already exists');
    }

    const role = await this.roleRepository.create({
      tenantId,
      name,
      permissions: permissions || {},
      isActive: true
    });

    return role;
  }

  async createDefaultRoles(tenantId) {
    const roles = ['admin', 'editor', 'viewer'];
    const createdRoles = [];

    for (const roleName of roles) {
      try {
        // createRole will handle existing check
        // Permissions are set by the Role model pre-save hook based on name
        const role = await this.createRole(
          {
            name: roleName,
            permissions: {} // Default permissions are handled by model
          },
          tenantId
        );
        createdRoles.push(role);
      } catch (error) {
        // If role exists, just fetch it
        if (error.status === 409) {
          const existing = await this.roleRepository.findByName(roleName, tenantId);
          if (existing) {
            createdRoles.push(existing);
          }
        } else {
          this.logger.error(`Failed to create default role ${roleName}: ${error.message}`);
          throw error;
        }
      }
    }
    return createdRoles;
  }

  async getRoleById(roleId, tenantId) {
    const role = await this.roleRepository.findById(roleId, tenantId);
    if (!role) {
      throw createError(404, 'Role not found');
    }
    return role;
  }

  async getRolesByTenant(tenantId) {
    return this.roleRepository.findByTenant(tenantId);
  }

  async updateRole(roleId, data, tenantId) {
    const role = await this.roleRepository.updateById(roleId, data, tenantId);
    if (!role) {
      throw createError(404, 'Role not found');
    }
    return role;
  }

  async deleteRole(roleId, tenantId) {
    const role = await this.roleRepository.deleteById(roleId, tenantId);
    if (!role) {
      throw createError(404, 'Role not found');
    }
    return { message: 'Role deleted successfully' };
  }
}
