const SupplierAdapter = require("./SupplierAdapter");
const models = require("../canonical/models");
const validators = require("../canonical/validators");
const { loadFixture, canonicalRobotId, batteryStatus, filterRows, normalizeValidRows } = require("./adapterUtils");

const SUPPLIER_ID = "supplier-c";
const branchMap = { C001: "CPH-BKK-001", C002: "CPH-BKK-002", C003: "CPH-CNX-001", C004: "CPH-HDY-001", C005: "CPH-KKC-001", C006: "CPH-PKT-001", C007: "CPH-PTY-001", C008: "CPH-NMA-001", C009: "CPH-SRT-001", C010: "CPH-UBN-001" };
const regionMap = { "BKK-E": "Bangkok East", "BKK-N": "Bangkok North", N: "North", S: "South", NE: "Northeast", E: "East" };
const tierMap = { F: "flagship", L: "large", S: "standard", T: "tourist" };
const statusMap = { 1: "HEALTHY", 2: "WARNING", 0: "OFFLINE", 3: "LOW_BATTERY", 4: "BLOCKED", "-1": "NO_DATA" };
const eventMap = { ZE: "ZONE_ENTERED", CD: "CUSTOMER_DETECTED", SP: "CUSTOMER_INVITED", LB: "LOW_BATTERY", BS: "NAVIGATION_BLOCKED", ND: "NO_DATA_RECEIVED" };

function rowObject(cols, row) {
  return Object.fromEntries(cols.map((column, index) => [column, row[index]]));
}

function robotId(branchId, sourceId) {
  return canonicalRobotId(branchId, SUPPLIER_ID, sourceId);
}

class SupplierCAdapter extends SupplierAdapter {
  constructor() {
    super({ supplierId: SUPPLIER_ID, supplierName: "Supplier C / Legacy Robotics" });
  }

  normalizeRobotStatus(rawRow, cols = loadFixture("supplier-c/robots.json").cols) {
    const raw = Array.isArray(rawRow) ? rowObject(cols, rawRow) : rawRow;
    const branchId = branchMap[raw.sid];
    const status = statusMap[raw.s];
    const position = raw.xyh;
    const robot = models.createRobot({
      robot_id: robotId(branchId, raw.rid),
      supplier_id: SUPPLIER_ID,
      supplier_robot_id: raw.rid,
      branch_id: branchId,
      display_name: raw.rid,
      model: raw.mdl,
      status,
      connection_status: status === "OFFLINE" ? "OFFLINE" : status === "NO_DATA" ? "NO_DATA" : status === "WARNING" ? "DEGRADED" : "ONLINE",
      battery_percent: raw.bt,
      battery_status: batteryStatus(raw.bt),
      current_mode: status === "BLOCKED" ? "ERROR" : status === "NO_DATA" ? "IDLE" : "PATROL",
      current_zone: raw.zn,
      navigation_status: status === "BLOCKED" ? "BLOCKED" : status === "NO_DATA" ? "ROUTE_NOT_ASSIGNED" : "NAVIGATING",
      safety_status: status === "BLOCKED" ? "BLOCKED_PATH" : status === "NO_DATA" ? "CAUTION" : "CLEAR",
      data_quality_status: status === "NO_DATA" ? "NO_DATA" : status === "WARNING" ? "PARTIAL" : status === "OFFLINE" ? "STALE" : "OK",
      route_id: raw.rte,
      position: position ? { x_pct: position[0], y_pct: position[1], heading_deg: position[2] } : null,
      last_heartbeat: raw.hb,
      updated_at: raw.hb
    });
    return validators.assertValid(robot, validators.validateRobot);
  }

  normalizeEvent(rawRow, cols = loadFixture("supplier-c/events.json").cols) {
    const raw = Array.isArray(rawRow) ? rowObject(cols, rawRow) : rawRow;
    if (!raw.eid) throw new validators.ValidationError([{ code: "missing_required_field", field: "eid" }]);
    const branchId = branchMap[raw.sid];
    const type = eventMap[raw.typ];
    const payload = raw.typ === "BS" ? { obstacle_distance_m: raw.v?.od } : raw.typ === "LB" ? { battery_percent: raw.v?.bt } : (raw.v || {});
    const event = models.createEvent({
      event_id: `${SUPPLIER_ID}:${raw.eid}`,
      supplier_id: SUPPLIER_ID,
      supplier_event_id: raw.eid,
      robot_id: robotId(branchId, raw.rid),
      branch_id: branchId,
      event_type: type,
      severity: type === "NAVIGATION_BLOCKED" ? "CRITICAL" : ["LOW_BATTERY", "NO_DATA_RECEIVED"].includes(type) ? "WARNING" : "INFO",
      zone_id: raw.zn,
      occurred_at: raw.ts,
      source: "robot",
      payload
    });
    return validators.assertValid(event, validators.validateEvent);
  }

  normalizeAlert(rawRow, cols = loadFixture("supplier-c/alerts.json").cols) {
    const raw = Array.isArray(rawRow) ? rowObject(cols, rawRow) : rawRow;
    if (!raw.aid || !raw.cat) throw new validators.ValidationError([{ code: "missing_required_field", field: "aid/cat" }]);
    const branchId = branchMap[raw.sid];
    const typeMap = { BAT: "LOW_BATTERY", OBS: "PATH_BLOCKED", NET: "ROBOT_OFFLINE" };
    const severityMap = { 1: "INFO", 2: "WARNING", 3: "CRITICAL", 4: "CRITICAL" };
    const statusMap = { N: "OPEN", A: "ACKNOWLEDGED", C: "RESOLVED" };
    const alert = models.createAlert({
      alert_id: `${SUPPLIER_ID}:${raw.aid}`,
      supplier_id: SUPPLIER_ID,
      supplier_alert_id: raw.aid,
      branch_id: branchId,
      robot_id: robotId(branchId, raw.rid),
      alert_type: typeMap[raw.cat] || "DATA_DEGRADED",
      severity: severityMap[raw.sev] || "WARNING",
      status: statusMap[raw.st] || "OPEN",
      raised_at: raw.ts,
      message: typeof raw.msg === "string" ? raw.msg : null
    });
    return validators.assertValid(alert, validators.validateAlert);
  }

  normalizeTicket(rawRow, cols = loadFixture("supplier-c/tickets.json").cols) {
    const raw = Array.isArray(rawRow) ? rowObject(cols, rawRow) : rawRow;
    if (!raw.tid) throw new validators.ValidationError([{ code: "missing_required_field", field: "tid" }]);
    if (!raw.rid) throw new validators.ValidationError([{ code: "missing_required_field", field: "rid" }]);
    const branchId = branchMap[raw.sid];
    const statusMap = { NEW: "NEW", WIP: "ASSIGNED", DONE: "RESOLVED" };
    const ticket = models.createTicket({
      ticket_id: `${SUPPLIER_ID}:${raw.tid}`,
      supplier_id: SUPPLIER_ID,
      supplier_ticket_id: raw.tid,
      alert_id: raw.aid ? `${SUPPLIER_ID}:${raw.aid}` : null,
      branch_id: branchId,
      robot_id: robotId(branchId, raw.rid),
      priority: `P${raw.p || 3}`,
      status: statusMap[raw.st] || "QUARANTINED",
      queue: raw.q,
      assignee: raw.owner,
      created_at: raw.open,
      resolved_at: raw.close
    });
    return validators.assertValid(ticket, validators.validateTicket);
  }

  async getBranches() {
    const raw = loadFixture("supplier-c/branches.json");
    return raw.rows.map((row) => {
      const branch = rowObject(raw.cols, row);
      return models.createBranch({
        branch_id: branchMap[branch.sid],
        branch_name: branch.nm,
        supplier_id: SUPPLIER_ID,
        region: regionMap[branch.rg] || branch.rg,
        tier: tierMap[branch.tier] || branch.tier,
        timezone: branch.tz,
        location: { lat: branch.lat, lng: branch.lon }
      });
    });
  }

  async getRobots() {
    const raw = loadFixture("supplier-c/robots.json");
    return normalizeValidRows(raw.rows, (row) => this.normalizeRobotStatus(row, raw.cols));
  }

  async getEvents(filters = {}) {
    const raw = loadFixture("supplier-c/events.json");
    return filterRows(normalizeValidRows(raw.rows, (row) => this.normalizeEvent(row, raw.cols)), filters);
  }

  async getAlerts(filters = {}) {
    const raw = loadFixture("supplier-c/alerts.json");
    return filterRows(normalizeValidRows(raw.rows, (row) => this.normalizeAlert(row, raw.cols)), filters);
  }

  async getTickets(filters = {}) {
    const raw = loadFixture("supplier-c/tickets.json");
    return filterRows(normalizeValidRows(raw.rows, (row) => this.normalizeTicket(row, raw.cols)), filters);
  }

  async healthCheck() {
    loadFixture("supplier-c/robots.json");
    return models.createAdapterHealth({ supplier_id: SUPPLIER_ID, status: "HEALTHY", last_success_at: new Date(), checked_at: new Date(), message: "Supplier C legacy mock fixture is available." });
  }
}

module.exports = SupplierCAdapter;
