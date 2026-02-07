export class PermissionChecker {
  static hasPermission(userRoles, resource, action) {
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    // Check each role for the required permission
    for (const role of userRoles) {
      const permissions = role.permissions || {};
      // this is the roles like , {videos: {view: true, upload: true, edit: true, delete: true}, users: {view: true, create: true, edit: true, delete: true}, tenants: {manage: true}}
      const resourcePerms = permissions[resource];

      if (resourcePerms && resourcePerms[action] === true) {
        return true;
      }

      // Admin role has all permissions
      if (role.name === 'admin') {
        return true;
      }
    }

    return false;
  }

  static canViewVideos(userRoles) {
    return this.hasPermission(userRoles, 'videos', 'view');
  }

  static canUploadVideos(userRoles) {
    return this.hasPermission(userRoles, 'videos', 'upload');
  }

  static canEditVideos(userRoles) {
    return this.hasPermission(userRoles, 'videos', 'edit');
  }

  static canDeleteVideos(userRoles) {
    return this.hasPermission(userRoles, 'videos', 'delete');
  }

  static canViewUsers(userRoles) {
    return this.hasPermission(userRoles, 'users', 'view');
  }

  static canCreateUsers(userRoles) {
    return this.hasPermission(userRoles, 'users', 'create');
  }

  static canEditUsers(userRoles) {
    return this.hasPermission(userRoles, 'users', 'edit');
  }

  static canDeleteUsers(userRoles) {
    return this.hasPermission(userRoles, 'users', 'delete');
  }

  static canManageTenants(userRoles) {
    return this.hasPermission(userRoles, 'tenants', 'manage');
  }
}
