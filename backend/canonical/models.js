function toBangkokIso(value) {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "+07:00");
}

function nowBangkok() {
  return toBangkokIso(new Date());
}

function createSupplier(input) {
  return {
    supplier_id: input.supplier_id,
    supplier_name: input.supplier_name,
    status: input.status || "ACTIVE",
    support_contact: input.support_contact || null,
    updated_at: toBangkokIso(input.updated_at) || nowBangkok()
  };
}

function createBranch(input) {
  return {
    branch_id: input.branch_id,
    branch_name: input.branch_name,
    supplier_ids: [...new Set(input.supplier_ids || (input.supplier_id ? [input.supplier_id] : []))],
    status: input.status || "ONLINE",
    region: input.region || null,
    tier: input.tier || null,
    timezone: input.timezone || "Asia/Bangkok",
    location: input.location || null,
    updated_at: toBangkokIso(input.updated_at) || nowBangkok()
  };
}

function createRobot(input) {
  return {
    robot_id: input.robot_id,
    supplier_id: input.supplier_id,
    supplier_robot_id: input.supplier_robot_id,
    branch_id: input.branch_id,
    display_name: input.display_name || input.robot_id,
    model: input.model || null,
    status: input.status || "NO_DATA",
    connection_status: input.connection_status || "NO_DATA",
    battery_percent: input.battery_percent == null ? null : Number(input.battery_percent),
    battery_status: input.battery_status || "UNKNOWN",
    current_mode: input.current_mode || "IDLE",
    current_zone: input.current_zone || null,
    navigation_status: input.navigation_status || "ROUTE_NOT_ASSIGNED",
    safety_status: input.safety_status || "CAUTION",
    data_quality_status: input.data_quality_status || "NO_DATA",
    route_id: input.route_id || null,
    position: input.position || null,
    last_heartbeat: toBangkokIso(input.last_heartbeat),
    updated_at: toBangkokIso(input.updated_at || input.last_heartbeat) || nowBangkok()
  };
}

function createEvent(input) {
  return {
    event_id: input.event_id,
    supplier_id: input.supplier_id,
    supplier_event_id: input.supplier_event_id || null,
    robot_id: input.robot_id,
    branch_id: input.branch_id,
    event_type: input.event_type,
    severity: input.severity || "INFO",
    zone_id: input.zone_id || null,
    occurred_at: toBangkokIso(input.occurred_at),
    source: input.source || "robot",
    message: input.message || null,
    payload: input.payload || {}
  };
}

function createAlert(input) {
  return {
    alert_id: input.alert_id,
    supplier_id: input.supplier_id,
    supplier_alert_id: input.supplier_alert_id || null,
    branch_id: input.branch_id,
    robot_id: input.robot_id,
    alert_type: input.alert_type,
    severity: input.severity || "WARNING",
    status: input.status || "OPEN",
    raised_at: toBangkokIso(input.raised_at),
    updated_at: toBangkokIso(input.updated_at || input.raised_at) || nowBangkok(),
    message: input.message || null,
    recommended_action: input.recommended_action || null
  };
}

function createTicket(input) {
  return {
    ticket_id: input.ticket_id,
    supplier_id: input.supplier_id,
    supplier_ticket_id: input.supplier_ticket_id || null,
    alert_id: input.alert_id || null,
    branch_id: input.branch_id,
    robot_id: input.robot_id,
    priority: input.priority || "P3",
    status: input.status || "NEW",
    queue: input.queue || null,
    assignee: input.assignee || null,
    created_at: toBangkokIso(input.created_at) || nowBangkok(),
    resolved_at: toBangkokIso(input.resolved_at),
    updated_at: toBangkokIso(input.updated_at || input.created_at) || nowBangkok()
  };
}

function createAdapterHealth(input) {
  return {
    supplier_id: input.supplier_id,
    status: input.status,
    last_success_at: toBangkokIso(input.last_success_at),
    checked_at: toBangkokIso(input.checked_at) || nowBangkok(),
    message: input.message || null
  };
}

module.exports = {
  toBangkokIso,
  nowBangkok,
  createSupplier,
  createBranch,
  createRobot,
  createEvent,
  createAlert,
  createTicket,
  createAdapterHealth
};
