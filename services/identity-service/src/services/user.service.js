import createError from 'http-errors';
import bcrypt from 'bcryptjs';
import { redisClient } from '@video-stream/shared';

export default class UserService {
  constructor(userRepository, roleRepository, logger) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.logger = logger;
  }

  async createUser(data, tenantId) {
    const { email, password, firstName, lastName, roleIds } = data;

    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(email, tenantId);
    if (existingUser) {
      throw createError(409, 'User with this email already exists');
    }

    // Validate roles belong to tenant
    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        const role = await this.roleRepository.findById(roleId, tenantId);
        if (!role || role.tenantId.toString() !== tenantId.toString()) {
          throw createError(400, `Invalid role: ${roleId}`);
        }
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userRepository.create({
      tenantId,
      email,
      passwordHash,
      firstName,
      lastName,
      roles: roleIds || [],
      isActive: true
    });

    await user.populate('roles');

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return userObj;
  }

  async getUserById(userId, tenantId) {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return userObj;
  }

  async getUsers(tenantId, options) {
    const result = await this.userRepository.findByTenant(tenantId, options);
    const users = result.users.map(user => {
      const userObj = user.toObject();
      delete userObj.passwordHash;
      return userObj;
    });

    return {
      users,
      pagination: result.pagination
    };
  }

  async updateUser(userId, data, tenantId) {
    const { password, roleIds, ...updateData } = data;

    // Validate roles if provided
    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        const role = await this.roleRepository.findById(roleId, tenantId);
        if (!role || role.tenantId.toString() !== tenantId.toString()) {
          throw createError(400, `Invalid role: ${roleId}`);
        }
      }
      updateData.roles = roleIds;
    }

    // Hash password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await this.userRepository.updateById(userId, updateData, tenantId);

    if (!user) {
      throw createError(404, 'User not found');
    }

    await user.populate('roles');

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return userObj;
  }

  async assignRoleToUser(email, roleName, tenantId) {
    // 1. Find user
    const user = await this.userRepository.findByEmail(email, tenantId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    // 2. Find role
    const role = await this.roleRepository.findByName(roleName, tenantId);
    if (!role) {
      throw createError(404, `Role '${roleName}' not found`);
    }

    // 3. Update user roles (REPLACE existing roles)
    // The requirement is to keep only the updated permission (e.g., upgrade Viewer -> Admin)
    const newRoles = [role._id];
    await this.userRepository.updateById(user._id, { roles: newRoles }, tenantId);

    // Return updated user
    const updatedUser = await this.userRepository.findById(user._id, tenantId);
    const userObj = updatedUser.toObject();
    return userObj;
  }

  async deleteUser(userId, tenantId) {
    try {
      await redisClient.setex(`blacklist:user:${userId}`, 86400 * 7, 'deleted');
    } catch (err) {
      this.logger.error(`Failed to ban user ${userId} in Redis: ${err.message}`);
    }

    const user = await this.userRepository.deleteById(userId, tenantId);
    if (!user) {
      throw createError(404, 'User not found');
    }

    return { message: 'User deleted successfully' };
  }
}
