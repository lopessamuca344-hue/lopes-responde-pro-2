const ROLES = Object.freeze({
  ADMIN_MASTER: "ADMIN_MASTER",
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  SUPPORT: "SUPPORT",
  USER: "USER"
});

const ROLE_LEVELS = Object.freeze({
  ADMIN_MASTER: 100,
  ADMIN: 80,
  OPERATOR: 60,
  SUPPORT: 40,
  USER: 20
});

function isValidRole(role) {
  return Object.prototype.hasOwnProperty.call(ROLE_LEVELS, role);
}

function hasMinimumRole(userRole, requiredRole) {
  if (!isValidRole(userRole) || !isValidRole(requiredRole)) {
    return false;
  }

  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

module.exports = {
  ROLES,
  ROLE_LEVELS,
  isValidRole,
  hasMinimumRole
};
