const enums = require("./enums");

class ValidationError extends Error {
  constructor(errors) {
    super("Canonical payload validation failed.");
    this.name = "ValidationError";
    this.code = "canonical_validation_failed";
    this.errors = errors;
  }
}

function required(errors, payload, fields) {
  for (const field of fields) {
    if (payload?.[field] == null || payload[field] === "") {
      errors.push({ code: "missing_required_field", field });
    }
  }
}

function enumValue(errors, payload, field, values) {
  if (payload?.[field] != null && !values.includes(payload[field])) {
    errors.push({ code: "invalid_enum", field, value: payload[field], allowed: values });
  }
}

function battery(errors, payload) {
  if (payload?.battery_percent == null) return;
  if (typeof payload.battery_percent !== "number" || Number.isNaN(payload.battery_percent)) {
    errors.push({ code: "invalid_type", field: "battery_percent" });
  } else if (payload.battery_percent < 0 || payload.battery_percent > 100) {
    errors.push({ code: "value_out_of_range", field: "battery_percent", min: 0, max: 100 });
  }
}

function timestamp(errors, payload, field) {
  if (payload?.[field] == null) return;
  if (Number.isNaN(new Date(payload[field]).getTime())) errors.push({ code: "invalid_timestamp", field });
}

function validateRobot(payload) {
  const errors = [];
  required(errors, payload, ["robot_id", "supplier_id", "supplier_robot_id", "branch_id"]);
  enumValue(errors, payload, "status", enums.ROBOT_STATUS);
  enumValue(errors, payload, "connection_status", enums.CONNECTION_STATUS);
  enumValue(errors, payload, "battery_status", enums.BATTERY_STATUS);
  enumValue(errors, payload, "current_mode", enums.OPERATIONAL_MODE);
  enumValue(errors, payload, "navigation_status", enums.NAVIGATION_STATUS);
  enumValue(errors, payload, "safety_status", enums.SAFETY_STATUS);
  enumValue(errors, payload, "data_quality_status", enums.DATA_QUALITY_STATUS);
  battery(errors, payload);
  timestamp(errors, payload, "last_heartbeat");
  return { valid: errors.length === 0, errors };
}

function validateEvent(payload) {
  const errors = [];
  required(errors, payload, ["event_id", "supplier_id", "robot_id", "branch_id", "event_type"]);
  enumValue(errors, payload, "event_type", enums.EVENT_TYPE);
  enumValue(errors, payload, "severity", enums.SEVERITY);
  timestamp(errors, payload, "occurred_at");
  return { valid: errors.length === 0, errors };
}

function validateAlert(payload) {
  const errors = [];
  required(errors, payload, ["alert_id", "supplier_id", "robot_id", "branch_id", "alert_type"]);
  enumValue(errors, payload, "severity", enums.SEVERITY);
  enumValue(errors, payload, "status", enums.ALERT_STATUS);
  timestamp(errors, payload, "raised_at");
  return { valid: errors.length === 0, errors };
}

function validateTicket(payload) {
  const errors = [];
  required(errors, payload, ["ticket_id", "supplier_id", "robot_id", "branch_id"]);
  enumValue(errors, payload, "status", enums.TICKET_STATUS);
  timestamp(errors, payload, "created_at");
  return { valid: errors.length === 0, errors };
}

function assertValid(payload, validator) {
  const result = validator(payload);
  if (!result.valid) throw new ValidationError(result.errors);
  return payload;
}

module.exports = { ValidationError, validateRobot, validateEvent, validateAlert, validateTicket, assertValid };
