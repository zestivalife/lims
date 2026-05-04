const permissions = {
  ADMIN: ['*'],
  PATHOLOGIST: [
    'patients:read',
    'tests:read',
    'reports:read',
    'reports:sign',
    'reports:deliver',
    'dashboard:read',
    'compliance:read'
  ],
  TECHNICIAN: [
    'patients:read',
    'tests:read',
    'tests:write',
    'tests:results:manual',
    'orders:write',
    'dashboard:read'
  ],
  RECEPTION: [
    'patients:read',
    'patients:write',
    'orders:write',
    'billing:read',
    'billing:write',
    'dashboard:read'
  ],
  PATIENT: ['portal:self:read']
};

export function allow(requiredPermission) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const rolePerms = permissions[role] || [];
    if (rolePerms.includes('*') || rolePerms.includes(requiredPermission)) {
      return next();
    }
    return res.status(403).json({ message: `Access denied: ${requiredPermission}` });
  };
}

export function getRolePermissions(role) {
  return permissions[role] || [];
}
