const test = require("node:test");
const assert = require("node:assert/strict");
const server = require("../index");
const SupplierAAdapter = require("../adapters/SupplierAAdapter");
const SupplierBAdapter = require("../adapters/SupplierBAdapter");
const SupplierCAdapter = require("../adapters/SupplierCAdapter");
const { loadFixture } = require("../adapters/adapterUtils");
const models = require("../canonical/models");
const db = require("../supabaseClient");
const registry = require("../adapters/registry");
const unified = require("../services/unifiedDataService");
const currentSchemaService = require("../services/currentSchemaService");
const supplierService = require("../services/supplierService");
const alertService = require("../services/alertService");
const ticketService = require("../services/ticketService");
const robotService = require("../services/robotService");

let baseUrl;

test.before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

async function login(userId) {
  const result = await api("/api/auth/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, supplier_id: "supplier-c" })
  });
  assert.equal(result.response.status, 200);
  return result.body.session_token;
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

test("legacy dashboard endpoint groups remain available", async () => {
  const legacyEndpoints = [
    "/api/health",
    "/api/control-center/overview",
    "/api/control-center/3d-store-map",
    "/api/control-center/live-camera",
    "/api/control-center/event-log",
    "/api/control-center/alerts",
    "/api/analytics/kpi-overview",
    "/api/analytics/engagement-funnel",
    "/api/analytics/trend-report",
    "/api/analytics/zone-analytics",
    "/api/analytics/customer-insight",
    "/api/management/campaigns",
    "/api/management/scripts",
    "/api/management/zones-routes",
    "/api/data-science-lab/overview",
    "/api/data-science-lab/model-metrics",
    "/api/data-science-lab/sensor-logs",
    "/api/data-science-lab/experiments"
  ];

  for (const endpoint of legacyEndpoints) {
    const result = await api(endpoint);
    assert.equal(result.response.status, 200, `${endpoint} should remain HTTP 200`);
    assert.equal(typeof result.body, "object");
  }
});

test("unified API requires a server-side demo session", async () => {
  const result = await api("/api/robots");
  assert.equal(result.response.status, 401);
  assert.equal(result.body.error, "authentication_required");
});

test("CP Admin can access all unified resource groups", async () => {
  const token = await login("cp-admin-1");
  const headers = bearer(token);
  const branches = await api("/api/branches", { headers });
  const robots = await api("/api/robots", { headers });
  const alerts = await api("/api/alerts", { headers });
  const tickets = await api("/api/tickets", { headers });
  const suppliers = await api("/api/suppliers", { headers });

  assert.equal(branches.response.status, 200);
  assert.equal(robots.response.status, 200);
  assert.equal(alerts.response.status, 200);
  assert.equal(tickets.response.status, 200);
  assert.equal(suppliers.response.status, 200);
  assert.ok(branches.body.branches.length > 0);
  assert.ok(robots.body.robots.some((robot) => robot.supplier_id === "supplier-b"));
  assert.deepEqual(new Set(suppliers.body.suppliers.map((supplier) => supplier.supplier_id)), new Set(["supplier-a", "supplier-b", "supplier-c"]));

  const robot = robots.body.robots.find((item) => item.supplier_id === "supplier-b");
  const branch = branches.body.branches.find((item) => item.branch_id === robot.branch_id);
  assert.equal((await api(`/api/branches/${encodeURIComponent(branch.branch_id)}`, { headers })).response.status, 200);
  assert.equal((await api(`/api/branches/${encodeURIComponent(branch.branch_id)}/robots`, { headers })).response.status, 200);
  const encodedRobotId = encodeURIComponent(robot.robot_id);
  assert.equal((await api(`/api/robots/${encodedRobotId}`, { headers })).response.status, 200);
  assert.equal((await api(`/api/robots/${encodedRobotId}/status`, { headers })).response.status, 200);
  assert.equal((await api(`/api/robots/${encodedRobotId}/events`, { headers })).response.status, 200);
  assert.equal((await api(`/api/robots/${encodedRobotId}/alerts`, { headers })).response.status, 200);
  assert.equal((await api("/api/suppliers/supplier-b/adapter-health", { headers })).response.status, 200);
});

test("External Supplier scope comes from session and cannot be overridden by browser input", async () => {
  const supplierAToken = await login("supplier-a-user-1");
  const supplierBToken = await login("supplier-b-user-1");
  const supplierAHeaders = bearer(supplierAToken);
  const supplierBHeaders = bearer(supplierBToken);

  const supplierARobots = await api("/api/robots?supplier_id=supplier-b", { headers: supplierAHeaders });
  assert.equal(supplierARobots.response.status, 200);
  assert.ok(supplierARobots.body.robots.length > 0);
  assert.ok(supplierARobots.body.robots.every((robot) => robot.supplier_id === "supplier-a"));
  assert.deepEqual(supplierARobots.body.meta.supplier_scope, ["supplier-a"]);

  const supplierBData = await api("/api/robots", { headers: supplierBHeaders });
  const supplierBRobot = supplierBData.body.robots[0];
  const hiddenRobot = await api(`/api/robots/${encodeURIComponent(supplierBRobot.robot_id)}`, { headers: supplierAHeaders });
  assert.equal(hiddenRobot.response.status, 404);

  const forbiddenSuppliers = await api("/api/suppliers", { headers: supplierAHeaders });
  assert.equal(forbiddenSuppliers.response.status, 403);
});

test("demo login rejects unknown users", async () => {
  const result = await api("/api/auth/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: "unknown-user" })
  });
  assert.equal(result.response.status, 401);
  assert.equal(result.body.error, "invalid_demo_user");
});

test("supplier-specific normalizers accept supported records and reject malformed records", () => {
  const adapterA = new SupplierAAdapter();
  const adapterB = new SupplierBAdapter();
  const adapterC = new SupplierCAdapter();
  const supplierA = loadFixture("supplier-a/robots.json");
  const supplierB = loadFixture("supplier-b/robots.json");
  const supplierBEvents = loadFixture("supplier-b/events.json");
  const supplierC = loadFixture("supplier-c/robots.json");

  assert.equal(adapterA.normalizeRobotStatus(supplierA[0]).status, "HEALTHY");
  assert.equal(adapterB.normalizeRobotStatus(supplierB.devices[2]).status, "LOW_BATTERY");
  assert.equal(adapterB.normalizeEvent(supplierBEvents.events[4]).event_type, "NAVIGATION_BLOCKED");
  assert.equal(adapterC.normalizeRobotStatus(supplierC.rows[5], supplierC.cols).status, "NO_DATA");

  assert.throws(() => adapterA.normalizeRobotStatus(supplierA[6]));
  assert.throws(() => adapterB.normalizeRobotStatus(supplierB.devices[6]));
  assert.throws(() => adapterC.normalizeRobotStatus(supplierC.rows[7], supplierC.cols));
});

test("mergeBranches defensively normalizes supplier IDs", () => {
  const branches = unified.mergeBranches([
    { branch_id: "branch-1", branch_name: "Branch One", supplier_ids: ["supplier-a"] },
    { branch_id: "branch-1", branch_name: "Branch One", supplier_ids: "supplier-b" },
    { branch_id: "branch-1", branch_name: "Branch One", supplier_id: "supplier-c" },
    { branch_id: "branch-2", branch_name: "Branch Two" }
  ]);

  assert.deepEqual(branches[0].supplier_ids, ["supplier-a", "supplier-b", "supplier-c"]);
  assert.deepEqual(branches[1].supplier_ids, []);
});

test("collect rejects an invalid supplier scope before registry filtering", async () => {
  await assert.rejects(
    unified.collect("getRobots", { supplierScope: "supplier-a" }),
    {
      name: "TypeError",
      message: "accessContext.supplierScope must be an array, null, or undefined."
    }
  );
});

test("missing adapter methods log their error type without changing the downstream error", async () => {
  const originalConsoleError = console.error;
  const messages = [];
  console.error = (message) => messages.push(JSON.parse(message));

  let result;
  try {
    result = await unified.collect("missingMethod", { supplierScope: ["supplier-a"] });
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(messages.length, 1);
  assert.equal(messages[0].error_type, "TypeError");
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].status, "OFFLINE");
  assert.equal(result.errors[0].message, "Supplier data is temporarily unavailable.");
});

test("supplier registry and service results honor supplier scope", async () => {
  assert.equal(registry.listSuppliers().length, 3);
  assert.deepEqual(registry.listSuppliers(["supplier-b"]), [
    { supplier_id: "supplier-b", supplier_name: "Supplier B / Beacon Robotics" }
  ]);

  const result = await supplierService.getSuppliers({ supplierScope: ["supplier-b"] });
  assert.equal(result.suppliers.length, 1);
  assert.equal(result.suppliers[0].supplier_id, "supplier-b");
  assert.deepEqual(result.meta.supplier_scope, ["supplier-b"]);
});

test("adapter health rejects suppliers outside the authorized scope", async () => {
  await assert.rejects(
    supplierService.getAdapterHealth({ supplierScope: ["supplier-a"] }, "supplier-b"),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "forbidden");
      assert.equal(error.message, "You do not have access to this supplier.");
      return true;
    }
  );
});

test("supplier health failures set partial response metadata", async () => {
  const adapter = registry.getAdapter("supplier-b");
  const originalHealthCheck = adapter.healthCheck;
  const originalConsoleError = console.error;
  console.error = () => {};
  adapter.healthCheck = async () => { throw new Error("simulated health outage"); };

  try {
    const result = await supplierService.getSuppliers({ supplierScope: ["supplier-b"] });
    assert.equal(result.suppliers[0].adapter_health.status, "OFFLINE");
    assert.equal(result.meta.partial, true);
    assert.deepEqual(result.meta.adapter_errors, [
      { supplier_id: "supplier-b", operation: "healthCheck", status: "OFFLINE" }
    ]);
  } finally {
    adapter.healthCheck = originalHealthCheck;
    console.error = originalConsoleError;
  }
});

test("createAlert normalizes valid timestamps and converts invalid timestamps to null", () => {
  const baseAlert = {
    alert_id: "alert-time-test",
    supplier_id: "supplier-a",
    branch_id: "branch-1",
    robot_id: "robot-1",
    alert_type: "DATA_DEGRADED"
  };

  assert.match(models.createAlert({ ...baseAlert, raised_at: "2026-01-01T00:00:00Z" }).raised_at, /\+07:00$/);
  assert.equal(models.createAlert({ ...baseAlert, raised_at: "not-a-date" }).raised_at, null);
});

test("alerts sort by canonical severity and real timestamps with invalid dates last", async () => {
  const originalCollect = unified.collect;
  const originalConsoleWarn = console.warn;
  const warnings = [];
  unified.collect = async () => ({
    rows: [
      { alert_id: "warning-invalid", severity: "WARNING", raised_at: "not-a-date" },
      { alert_id: "critical-old", severity: "CRITICAL", raised_at: new Date("2026-01-01T00:00:00Z") },
      { alert_id: "blocker", severity: "BLOCKER", raised_at: null },
      { alert_id: "critical-new", severity: "CRITICAL", raised_at: "2026-02-01T00:00:00Z" },
      { alert_id: "warning-valid", severity: "WARNING", raised_at: "2026-03-01T00:00:00Z" },
      { alert_id: "unknown", severity: "EMERGENCY", raised_at: "2026-04-01T00:00:00Z" }
    ],
    errors: []
  });
  console.warn = (message) => warnings.push(JSON.parse(message));

  try {
    const result = await alertService.getAlerts({ supplierScope: null });
    assert.deepEqual(result.alerts.map((alert) => alert.alert_id), [
      "blocker",
      "critical-new",
      "critical-old",
      "warning-valid",
      "warning-invalid",
      "unknown"
    ]);
    assert.deepEqual(warnings.map((warning) => [warning.severity, warning.alert_id]), [
      ["EMERGENCY", "unknown"]
    ]);
  } finally {
    unified.collect = originalCollect;
    console.warn = originalConsoleWarn;
  }
});

test("tickets sort by real timestamps with invalid dates last", async () => {
  const originalCollect = unified.collect;
  unified.collect = async () => ({
    rows: [
      { ticket_id: "missing", created_at: null },
      { ticket_id: "date-object", created_at: new Date("2026-01-01T00:00:00Z") },
      { ticket_id: "invalid", created_at: "not-a-date" },
      { ticket_id: "iso-string", created_at: "2026-02-01T00:00:00Z" },
      { ticket_id: "numeric", created_at: Date.parse("2026-03-01T00:00:00Z") }
    ],
    errors: []
  });

  try {
    const result = await ticketService.getTickets({ supplierScope: null });
    assert.deepEqual(result.tickets.map((ticket) => ticket.ticket_id), [
      "numeric",
      "iso-string",
      "date-object",
      "missing",
      "invalid"
    ]);
  } finally {
    unified.collect = originalCollect;
  }
});

test("current schema fallback keeps the legacy warning and adds detailed error diagnostics", async () => {
  const originalSelect = db.select;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const errors = [];
  const warnings = [];
  db.select = async () => { throw new TypeError("simulated schema query bug"); };
  console.error = (message) => errors.push(JSON.parse(message));
  console.warn = (message) => warnings.push(message);

  try {
    const result = await currentSchemaService.load();
    assert.equal(result.source, "local-six-table-fallback");
    assert.equal(errors[0].code, "current_schema_load_failure");
    assert.equal(errors[0].error_type, "TypeError");
    assert.match(errors[0].stack, /TypeError: simulated schema query bug/);
    assert.equal(warnings[0], "Using current-schema fallback data: simulated schema query bug");
  } finally {
    db.select = originalSelect;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
});

test("current schema event view uses null when its robot cannot be resolved", async () => {
  const originalSelect = db.select;
  const rowsByTable = {
    zones: [],
    campaigns: [],
    robot_scripts: [],
    robots: [],
    event_logs: [{ id: "orphan-event", robot_id: "missing-robot", event_type: "Warning", message: "Orphan event", created_at: "2026-01-01T00:00:00Z" }],
    customer_interactions: []
  };
  db.select = async (table) => rowsByTable[table];

  try {
    const result = await currentSchemaService.load();
    assert.equal(result.eventView[0].robotName, "Unknown Robot");
    assert.equal(result.eventView[0].robot_id, null);
  } finally {
    db.select = originalSelect;
  }
});

test("buildAlerts prioritizes critical and battery alerts before slicing", () => {
  const warningEvents = Array.from({ length: 105 }, (_, index) => ({
    id: `warning-${index}`,
    event_type: "Warning",
    severity: "warning"
  }));
  const criticalEvent = { id: "critical-event", event_type: "Alert", severity: "critical" };
  const robots = [{
    id: "robot-low-battery",
    name: "CP-BOT-LOW / Test",
    battery_percentage: 19,
    last_updated: "2026-01-01T00:00:00Z"
  }];

  const alerts = currentSchemaService.buildAlerts([criticalEvent, ...warningEvents], robots);
  assert.equal(alerts.length, 100);
  assert.equal(alerts[0].id, "critical-event");
  assert.equal(alerts[1].id, "battery-robot-low-battery");
  assert.ok(alerts.some((alert) => alert.id === "battery-robot-low-battery"));
});

test("robot events and alerts query only the robot supplier adapter", async () => {
  const adapters = registry.listAdapters();
  const supplierB = registry.getAdapter("supplier-b");
  const robot = (await supplierB.getRobots())[0];
  const originalMethods = adapters.map((adapter) => ({
    adapter,
    getEvents: adapter.getEvents,
    getAlerts: adapter.getAlerts
  }));
  const calls = [];

  for (const adapter of adapters) {
    adapter.getEvents = async () => {
      calls.push([adapter.supplierId, "getEvents"]);
      return [{ event_id: `${adapter.supplierId}-event` }];
    };
    adapter.getAlerts = async () => {
      calls.push([adapter.supplierId, "getAlerts"]);
      return [{ alert_id: `${adapter.supplierId}-alert` }];
    };
  }

  try {
    const accessContext = { supplierScope: ["supplier-b"] };
    const events = await robotService.getRobotEvents(accessContext, robot.robot_id);
    const alerts = await robotService.getRobotAlerts(accessContext, robot.robot_id);
    assert.deepEqual(calls, [["supplier-b", "getEvents"], ["supplier-b", "getAlerts"]]);
    assert.equal(events.events[0].event_id, "supplier-b-event");
    assert.equal(alerts.alerts[0].alert_id, "supplier-b-alert");
    assert.equal(events.meta.partial, false);
    assert.equal(alerts.meta.partial, false);
  } finally {
    for (const original of originalMethods) {
      original.adapter.getEvents = original.getEvents;
      original.adapter.getAlerts = original.getAlerts;
    }
  }
});

test("robot event metadata combines lookup and target adapter errors", async () => {
  const supplierA = registry.getAdapter("supplier-a");
  const supplierB = registry.getAdapter("supplier-b");
  const robot = (await supplierB.getRobots())[0];
  const originalAGetRobots = supplierA.getRobots;
  const originalBGetEvents = supplierB.getEvents;
  const originalConsoleError = console.error;
  console.error = () => {};
  supplierA.getRobots = async () => { throw new Error("simulated robot lookup outage"); };
  supplierB.getEvents = async () => { throw new Error("simulated event outage"); };

  try {
    const result = await robotService.getRobotEvents({ supplierScope: null }, robot.robot_id);
    assert.deepEqual(result.events, []);
    assert.equal(result.meta.partial, true);
    assert.deepEqual(result.meta.adapter_errors.map((error) => [error.supplier_id, error.operation]), [
      ["supplier-a", "getRobots"],
      ["supplier-b", "getEvents"]
    ]);
    assert.ok(result.meta.adapter_errors.every((error) => error.message === "Supplier data is temporarily unavailable."));
  } finally {
    supplierA.getRobots = originalAGetRobots;
    supplierB.getEvents = originalBGetEvents;
    console.error = originalConsoleError;
  }
});

test("one failed adapter returns a partial result without taking down other suppliers", async () => {
  const adapter = registry.getAdapter("supplier-b");
  const original = adapter.getRobots;
  adapter.getRobots = async () => { throw new Error("simulated supplier outage"); };
  try {
    const result = await unified.collect("getRobots", { supplierScope: null });
    assert.ok(result.rows.some((robot) => robot.supplier_id === "supplier-a"));
    assert.ok(result.rows.some((robot) => robot.supplier_id === "supplier-c"));
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].supplier_id, "supplier-b");
    assert.equal(result.errors[0].message, "Supplier data is temporarily unavailable.");
  } finally {
    adapter.getRobots = original;
  }
});
