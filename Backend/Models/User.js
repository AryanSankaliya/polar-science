/**
 * User Model Schema & Roles (RBAC: student, researcher, admin)
 */

const UserRoles = {
  ADMIN: 'admin',
  RESEARCHER: 'researcher',
  STUDENT: 'student',
  // Backwards compatibility mappings
  Admin: 'admin',
  Researcher: 'researcher',
  Student: 'student',
  User: 'student',
  REVIEWER: 'researcher'
};

function normalizeRole(role) {
  if (!role) return UserRoles.STUDENT;
  const r = String(role).toLowerCase().trim();
  if (r === 'admin') return UserRoles.ADMIN;
  if (r === 'researcher') return UserRoles.RESEARCHER;
  return UserRoles.STUDENT;
}

function formatUserResponse(user) {
  if (!user) return null;
  const { password_hash, refresh_tokens, ...safeUser } = user;
  const userId = safeUser._id ? safeUser._id.toString() : (safeUser.userId || safeUser.id);
  const normalizedRole = normalizeRole(safeUser.role);
  return {
    id: userId,
    userId: userId,
    email: safeUser.email,
    name: safeUser.name,
    role: normalizedRole,
    institution: safeUser.institution || '',
    designation: safeUser.designation || '',
    created_at: safeUser.created_at || new Date().toISOString(),
    updated_at: safeUser.updated_at || new Date().toISOString()
  };
}

module.exports = {
  UserRoles,
  normalizeRole,
  formatUserResponse
};
