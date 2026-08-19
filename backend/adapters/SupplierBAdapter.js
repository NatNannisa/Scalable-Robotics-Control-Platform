const SupplierAdapter = require("./SupplierAdapter");
const models = require("../canonical/models");
const validators = require("../canonical/validators");
const { loadFixture, canonicalRobotId, batteryStatus, filterRows, normalizeValidRows } = require("./adapterUtils");

const SUPPLIER_ID = "supplier-b";
const branchMap = {
  "BKK-BANGNA": "CPH-BKK-001", "BKK-RANGSIT": "CPH-BKK-002", "CNX-MUEANG": "CPH-CNX-001",
  "HDY-CENTRAL": "CPH-HDY-001", "KKC-MITTRAPHAP": "CPH-KKC-001", "PKT-BYPASS": "CPH-PKT-001",
  "PTY-NORTH": "CPH-PTY-001", "NMA-KORAT": "CPH-NMA-001", "SRT-MUEANG": "CPH-SRT-001", "UBN-CITY": "CPH-UBN-001"
};

const statusMap = { ok: "HEALTHY", degraded: "WARNING", lost: "OFFLINE", charge_low: "LOW_BATTERY", blocked: "BLOCKED", empty: "NO_DATA" };
const eventMap = { entered_area: "ZONE_ENTERED", person_seen: "CUSTOMER_DETECTED", talk_track_started: "CUSTOMER_INVITED", charge_warning: "LOW_BATTERY", navigation_blocked: "NAVIGATION_BLOCKED", no_payload: "NO_DATA_RECEIVED" };

function robotId(branchId, sourceId) {
  return canonicalRobotId(branchId, SUPPLIER_ID, sourceId);
}

class SupplierBAdapter extends SupplierAdapter {
  constructor() {
    super({ supplierId: SUPPLIER_ID, supplierName: "Supplier B / Beacon Robotics" });
  }

  normalizeRobotStatus(raw) {
    if (!raw.unitSerial || !raw.siteId) {
      throw new validators.ValidationError([{ code: "missing_required_field", field: !raw.unitSerial ? "unitSerial" : "siteId" }]);
    }
    const branchId = branchMap[raw.siteId];
    const status = statusMap[raw.health];
    const percent = raw.power?.percent ?? null;
    const position = raw.location?.pos;
    const robot = models.createRobot({
      robot_id: robotId(branchId, raw.unitSerial),
      supplier_id: SUPPLIER_ID,
      supplier_robot_id: raw.unitSerial,
      branch_id: branchId,
      display_name: raw.unitSerial,
      model: raw.modelName,
      status,
      connection_status: status === "OFFLINE" ? "OFFLINE" : status === "NO_DATA" ? "NO_DATA" : status === "WARNING" ? "DEGRADED" : "ONLINE",
      battery_percent: percent,
      battery_status: batteryStatus(percent, raw.power?.charging),
      current_mode: status === "BLOCKED" ? "ERROR" : status === "NO_DATA" ? "IDLE" : raw.power?.charging ? "CHARGING" : "PATROL",
      current_zone: raw.location?.zoneName || null,
      navigation_status: status === "BLOCKED" ? "BLOCKED" : status === "NO_DATA" ? "ROUTE_NOT_ASSIGNED" : raw.power?.charging ? "DOCKED" : "NAVIGATING",
      safety_status: status === "BLOCKED" ? "BLOCKED_PATH" : status === "NO_DATA" ? "CAUTION" : "CLEAR",
      data_quality_status: status === "NO_DATA" ? "NO_DATA" : status === "WARNING" ? "PARTIAL" : status === "OFFLINE" ? "STALE" : "OK",
      route_id: null,
      position: position ? { x_pct: position.xPct, y_pct: position.yPct, heading_deg: raw.location.bearing || 0 } : null,
      last_heartbeat: raw.telemetry?.lastPing,
      updated_at: raw.telemetry?.lastPing
    });
    return validators.assertValid(robot, validators.validateRobot);
  }

  normalizeEvent(raw) {
    if (!raw.id) throw new validators.ValidationError([{ code: "missing_required_field", field: "id" }]);
    if (!raw.device?.serial) throw new validators.ValidationError([{ code: "missing_required_field", field: "device.serial" }]);
    const branchId = branchMap[raw.siteId];
    const type = eventMap[raw.kind];
    const details = raw.details || {};
    const payload = raw.kind === "navigation_blocked"
      ? { obstacle_distance_m: details.nearestObjectMeters }
      : raw.kind === "charge_warning" ? { battery_percent: details.powerPercent } : details;
    const event = models.createEvent({
      event_id: `${SUPPLIER_ID}:${raw.id}`,
      supplier_id: SUPPLIER_ID,
      supplier_event_id: raw.id,
      robot_id: robotId(branchId, raw.device?.serial),
      branch_id: branchId,
      event_type: type,
      severity: type === "NAVIGATION_BLOCKED" ? "CRITICAL" : ["LOW_BATTERY", "NO_DATA_RECEIVED"].includes(type) ? "WARNING" : "INFO",
      zone_id: raw.area,
      occurred_at: raw.occurredAt,
      source: "robot",
      payload
    });
    return validators.assertValid(event, validators.validateEvent);
  }

  normalizeAlert(raw) {
    if (!raw.alarmId || !raw.category || !["minor", "major", "critical"].includes(raw.level)) {
      throw new validators.ValidationError([{ code: "invalid_supplier_alert", field: "alarmId/category/level" }]);
    }
    const branchId = branchMap[raw.siteId];
    const typeMap = { battery: "LOW_BATTERY", navigation: "PATH_BLOCKED", connectivity: "ROBOT_OFFLINE" };
    const alert = models.createAlert({
      alert_id: `${SUPPLIER_ID}:${raw.alarmId}`,
      supplier_id: SUPPLIER_ID,
      supplier_alert_id: raw.alarmId,
      branch_id: branchId,
      robot_id: robotId(branchId, raw.unitSerial),
      alert_type: typeMap[raw.category] || "DATA_DEGRADED",
      severity: raw.level === "minor" ? "WARNING" : "CRITICAL",
      status: raw.state === "seen" ? "ACKNOWLEDGED" : "OPEN",
      raised_at: raw.openedOn,
      message: raw.text
    });
    return validators.assertValid(alert, validators.validateAlert);
  }

  normalizeTicket(raw) {
    if (!raw.caseNo) throw new validators.ValidationError([{ code: "missing_required_field", field: "caseNo" }]);
    if (!raw.asset) throw new validators.ValidationError([{ code: "missing_required_field", field: "asset" }]);
    const branchId = branchMap[raw.site];
    const statusMap = { triage: "NEW", dispatching: "ASSIGNED", done: "RESOLVED" };
    const ticket = models.createTicket({
      ticket_id: `${SUPPLIER_ID}:${raw.caseNo}`,
      supplier_id: SUPPLIER_ID,
      supplier_ticket_id: raw.caseNo,
      alert_id: raw.alarmId ? `${SUPPLIER_ID}:${raw.alarmId}` : null,
      branch_id: branchId,
      robot_id: robotId(branchId, raw.asset),
      priority: `P${raw.urgency || 3}`,
      status: statusMap[raw.workflowState] || "QUARANTINED",
      queue: raw.ownerGroup,
      created_at: raw.createdOn,
      resolved_at: raw.closedOn
    });
    return validators.assertValid(ticket, validators.validateTicket);
  }

  async getBranches() {
    const raw = loadFixture("supplier-b/branches.json");
    return raw.sites.map((branch) => models.createBranch({
      branch_id: branchMap[branch.siteId],
      branch_name: branch.displayName,
      supplier_id: SUPPLIER_ID,
      region: branch.area?.regionName,
      tier: branch.area?.tier,
      location: { lat: branch.geo?.latitude, lng: branch.geo?.longitude }
    }));
  }

  async getRobots() {
    return normalizeValidRows(loadFixture("supplier-b/robots.json").devices, (row) => this.normalizeRobotStatus(row));
  }

  async getEvents(filters = {}) {
    const rows = normalizeValidRows(loadFixture("supplier-b/events.json").events, (row) => this.normalizeEvent(row));
    return filterRows(rows, filters);
  }

  async getAlerts(filters = {}) {
    const rows = normalizeValidRows(loadFixture("supplier-b/alerts.json").alarms, (row) => this.normalizeAlert(row));
    return filterRows(rows, filters);
  }

  async getTickets(filters = {}) {
    const rows = normalizeValidRows(loadFixture("supplier-b/tickets.json").cases, (row) => this.normalizeTicket(row));
    return filterRows(rows, filters);
  }

  async healthCheck() {
    loadFixture("supplier-b/robots.json");
    return models.createAdapterHealth({ supplier_id: SUPPLIER_ID, status: "HEALTHY", last_success_at: new Date(), checked_at: new Date(), message: "Supplier B mock fixture is available." });
  }
}

module.exports = SupplierBAdapter;
