const { error } = require('../Utilities/responseFormatter');
const { normalizeRole } = require('../Models/User');

/**
 * Role-based Authorization Guard Middleware (RBAC: student, researcher, admin)
 * @param {string|string[]} allowedRoles Array or rest list of allowed roles e.g. ['admin', 'researcher']
 */
function requireRole(...allowedRoles) {
  const flattenedRoles = allowedRoles.flat().map(r => String(r).toLowerCase().trim());
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required to access this resource.', 401);
    }

    const userRole = normalizeRole(req.user.role);
    // Admin has full universal access across all routes
    const hasPermission = userRole === 'admin' || flattenedRoles.includes(userRole);

    if (!hasPermission) {
      return error(
        res,
        `Forbidden. Your role '${userRole}' does not have permission to access this resource. Required role: [${flattenedRoles.join(', ')}]`,
        403
      );
    }

    next();
  };
}

module.exports = {
  requireRole
};
