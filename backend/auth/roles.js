const ROLES = Object.freeze({
  CP_ADMIN: "CP_ADMIN",
  CP_OPERATION: "CP_OPERATION",
  EXTERNAL_SUPPLIER: "EXTERNAL_SUPPLIER"
});

const PERMISSIONS = Object.freeze({
  BRANCH_READ: "branch:read",
  ROBOT_READ: "robot:read",
  EVENT_READ: "event:read",
  ALERT_READ: "alert:read",
  TICKET_READ: "ticket:read",
  SUPPLIER_READ: "supplier:read",
  ADAPTER_HEALTH_READ: "adapter-health:read"
});

const supplierReadPermissions = [
  PERMISSIONS.BRANCH_READ,
  PERMISSIONS.ROBOT_READ,
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.ALERT_READ,
  PERMISSIONS.TICKET_READ
];

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.CP_ADMIN]: Object.freeze(Object.values(PERMISSIONS)),
  [ROLES.CP_OPERATION]: Object.freeze(Object.values(PERMISSIONS)),
  [ROLES.EXTERNAL_SUPPLIER]: Object.freeze(supplierReadPermissions)
});

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS };
