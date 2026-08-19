const SupplierAdapter = require("./SupplierAdapter");
const current = require("../services/currentSchemaService");
const models = require("../canonical/models");
const validators = require("../canonical/validators");
const { canonicalRobotId, batteryStatus, filterRows, normalizeValidRows } = require("./adapterUtils");

const SUPPLIER_ID = "supplier-a";
const DEMO_BRANCH_ID = "cp-hypermarket-demo";

const rawStatusMap = {
  RUNNING: "HEALTHY",
  WARN: "WARNING",
  OFFLINE: "OFFLINE",
  LOW_BATT: "LOW_BATTERY",
  BLOCKED: "BLOCKED",
  NO_SIGNAL: "NO_DATA"
};

const currentStatusMap = {
  Patrolling: "HEALTHY",
  Interacting: "HEALTHY",
  Charging: "HEALTHY",
  Idle: "WARNING",
  Error: "BLOCKED"
};

function eventTypeFromMessage(message = "", eventType = "") {
  if (/battery/i.test(message)) return "LOW_BATTERY";
  if (/obstacle|blocked/i.test(message)) return "NAVIGATION_BLOCKED";
  if (/customer detected/i.test(message)) return "CUSTOMER_DETECTED";
  if (/entered/i.test(message)) return "ZONE_ENTERED";
  if (/charging/i.test(message)) return "CHARGING_STARTED";
  if (/script/i.test(message)) return "CUSTOMER_INVITED";
  return eventType === "Alert" ? "DATA_DEGRADED" : "HEARTBEAT_RECEIVED";
}

class SupplierAAdapter extends SupplierAdapter {
  constructor() {
    super({ supplierId: SUPPLIER_ID, supplierName: "Supplier A / Current CP Demo" });
  }

  normalizeRobotStatus(raw, context = {}) {
    const isCurrentSchema = Object.prototype.hasOwnProperty.call(raw, "battery_percentage");
    if (!isCurrentSchema && raw.hb_at && Number.isNaN(new Date(raw.hb_at).getTime())) {
      throw new validators.ValidationError([{ code: "invalid_timestamp", field: "hb_at" }]);
    }
    const sourceRobotId = isCurrentSchema ? raw.id : raw.robot_id;
    const branchId = context.branchId || (isCurrentSchema ? DEMO_BRANCH_ID : raw.branch_code);
    const status = isCurrentSchema ? (currentStatusMap[raw.status] || "NO_DATA") : rawStatusMap[raw.vendor_state];
    const batteryPercent = isCurrentSchema ? raw.battery_percentage : raw.batt_pct;
    const canonicalId = isCurrentSchema
      ? current.normalizeRobotName(raw.name)
      : canonicalRobotId(branchId, SUPPLIER_ID, sourceRobotId);
    const modeMap = { Patrolling: "PATROL", Interacting: "ACTIVE_SAMPLING", Charging: "CHARGING", Idle: "IDLE", Error: "ERROR" };
    const currentZone = context.currentZone || raw.current_zone?.toLowerCase() || null;

    const robot = models.createRobot({
      robot_id: canonicalId,
      supplier_id: SUPPLIER_ID,
      supplier_robot_id: sourceRobotId,
      branch_id: branchId,
      display_name: isCurrentSchema ? raw.name : sourceRobotId,
      model: isCurrentSchema ? "CP Sampling Robot" : raw.robot_model,
      status,
      connection_status: status === "OFFLINE" ? "OFFLINE" : status === "NO_DATA" ? "NO_DATA" : status === "WARNING" ? "DEGRADED" : "ONLINE",
      battery_percent: batteryPercent,
      battery_status: batteryStatus(batteryPercent, raw.status === "Charging"),
      current_mode: isCurrentSchema ? (modeMap[raw.status] || "IDLE") : status === "BLOCKED" ? "ERROR" : status === "NO_DATA" ? "IDLE" : "PATROL",
      current_zone: currentZone,
      navigation_status: status === "BLOCKED" ? "BLOCKED" : raw.status === "Charging" ? "DOCKED" : status === "NO_DATA" ? "ROUTE_NOT_ASSIGNED" : "NAVIGATING",
      safety_status: status === "BLOCKED" ? "BLOCKED_PATH" : status === "NO_DATA" ? "CAUTION" : "CLEAR",
      data_quality_status: status === "NO_DATA" ? "NO_DATA" : status === "WARNING" ? "PARTIAL" : "OK",
      route_id: raw.route_id || null,
      position: raw.x == null || raw.y == null ? null : { x_pct: raw.x, y_pct: raw.y, heading_deg: raw.heading_deg || 0 },
      last_heartbeat: raw.last_updated || raw.hb_at,
      updated_at: raw.last_updated || raw.hb_at
    });
    return validators.assertValid(robot, validators.validateRobot);
  }

  normalizeEvent(raw, context = {}) {
    const eventId = raw.id || raw.event_id;
    if (!eventId) throw new validators.ValidationError([{ code: "missing_required_field", field: "event_id" }]);
    const eventTypeMap = {
      ZONE_ENTERED: "ZONE_ENTERED",
      CUSTOMER_DETECTED: "CUSTOMER_DETECTED",
      SCRIPT_PLAYED: "CUSTOMER_INVITED",
      BATTERY_LOW: "LOW_BATTERY",
      OBSTACLE_STOP: "NAVIGATION_BLOCKED",
      NO_DATA: "NO_DATA_RECEIVED"
    };
    const type = raw.event_code ? eventTypeMap[raw.event_code] : eventTypeFromMessage(raw.message, raw.event_type);
    const event = models.createEvent({
      event_id: `${SUPPLIER_ID}:${eventId}`,
      supplier_id: SUPPLIER_ID,
      supplier_event_id: eventId,
      robot_id: context.robotId || raw.robot_id,
      branch_id: context.branchId || raw.branch_code || DEMO_BRANCH_ID,
      event_type: type,
      severity: type === "NAVIGATION_BLOCKED" ? "CRITICAL" : ["LOW_BATTERY", "NO_DATA_RECEIVED", "DATA_DEGRADED"].includes(type) ? "WARNING" : "INFO",
      zone_id: raw.zone_code?.toLowerCase() || context.zoneId || null,
      occurred_at: raw.created_at || raw.event_ts,
      source: "robot",
      message: raw.message || null,
      payload: raw.payload || {}
    });
    return validators.assertValid(event, validators.validateEvent);
  }

  normalizeAlert(raw, context = {}) {
    if (raw.alert_no && !raw.alert_type) {
      throw new validators.ValidationError([{ code: "missing_required_field", field: "alert_type" }]);
    }
    const id = raw.alert_no || raw.id;
    const type = raw.alert_type || (/battery/i.test(raw.message || "") ? "LOW_BATTERY" : /obstacle|blocked/i.test(raw.message || "") ? "PATH_BLOCKED" : "DATA_DEGRADED");
    const severity = raw.severity === "CRITICAL" || raw.event_type === "Alert" ? "CRITICAL" : "WARNING";
    const alert = models.createAlert({
      alert_id: `${SUPPLIER_ID}:${id}`,
      supplier_id: SUPPLIER_ID,
      supplier_alert_id: id,
      branch_id: context.branchId || raw.branch_code || DEMO_BRANCH_ID,
      robot_id: context.robotId || raw.robot_id,
      alert_type: type,
      severity,
      status: raw.vendor_status === "ACK" ? "ACKNOWLEDGED" : "OPEN",
      raised_at: raw.raised_at || raw.event_timestamp,
      message: raw.message,
      recommended_action: type.includes("BATTERY") ? "Route the robot to its charging station." : "Review the robot event and current safety state."
    });
    return validators.assertValid(alert, validators.validateAlert);
  }

  async getBranches() {
    return [models.createBranch({
      branch_id: DEMO_BRANCH_ID,
      branch_name: "CP Hypermarket Demo",
      supplier_id: SUPPLIER_ID,
      status: "ONLINE",
      region: "Demo",
      tier: "demo"
    })];
  }

  async getRobots() {
    const data = await current.load();
    return normalizeValidRows(data.robots, (robot) => this.normalizeRobotStatus(robot, {
      branchId: DEMO_BRANCH_ID,
      currentZone: data.zonesById.get(robot.current_zone_id)?.zone_name || null
    }));
  }

  async getEvents(filters = {}) {
    const data = await current.load();
    const robotBySourceId = new Map(data.robots.map((robot) => [robot.id, current.normalizeRobotName(robot.name)]));
    const events = normalizeValidRows(data.eventLogs, (event) => this.normalizeEvent(event, {
      branchId: DEMO_BRANCH_ID,
      robotId: robotBySourceId.get(event.robot_id),
      zoneId: null
    }));
    return filterRows(events, filters);
  }

  async getAlerts(filters = {}) {
    const data = await current.load();
    const alerts = current.buildAlerts(data.eventView, data.robots);
    const normalized = normalizeValidRows(alerts, (alert) => this.normalizeAlert(alert, {
      branchId: DEMO_BRANCH_ID,
      robotId: alert.robot_id
    }));
    return filterRows(normalized, filters);
  }

  async getTickets() {
    return [];
  }

  async healthCheck() {
    const data = await current.load();
    const fallback = String(data.source).includes("fallback");
    return models.createAdapterHealth({
      supplier_id: SUPPLIER_ID,
      status: fallback ? "DEGRADED" : "HEALTHY",
      last_success_at: fallback ? null : new Date(),
      checked_at: new Date(),
      message: fallback ? "Supabase unavailable; Supplier A is serving the six-table local fallback." : "Current Supabase schema is reachable."
    });
  }
}

module.exports = SupplierAAdapter;
