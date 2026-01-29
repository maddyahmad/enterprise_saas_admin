import { ROLE_PERMISSIONS } from '../db/models/User';

export function hasPermission(userRole, permission) {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

export function canAccessResource(userRole, resource, action) {
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    user: 1
  };

  // Admins can access everything
  if (userRole === 'admin') {
    return true;
  }

  // Managers can manage their team and access user resources
  if (userRole === 'manager' && ['read', 'write', 'manage_team'].includes(action)) {
    return true;
  }

  // Users can only read
  if (userRole === 'user' && action === 'read') {
    return true;
  }

  return false;
}

export function requireRole(allowedRoles) {
  return (userRole) => {
    return allowedRoles.includes(userRole);
  };
}
