const { ROLE_PERMISSIONS } = require("./roles");

function hasPermission(role, permission) {
  return Boolean(ROLE_PERMISSIONS[role]?.includes(permission));
}

function supplierScopeFor(session) {
  return session?.user?.supplier_id ? [session.user.supplier_id] : null;
}

module.exports = { hasPermission, supplierScopeFor };
