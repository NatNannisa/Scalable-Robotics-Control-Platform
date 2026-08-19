const unified = require("./unifiedDataService");
const registry = require("../adapters/registry");
const { HttpError } = require("../auth/authorize");

async function getRobots(accessContext) {
  const result = await unified.collect("getRobots", accessContext);
  return { robots: result.rows, meta: unified.responseMeta(accessContext, result.errors) };
}

async function getRobot(accessContext, robotId) {
  const result = await unified.collect("getRobots", accessContext);
  const robot = result.rows.find((item) => item.robot_id === robotId);
  if (!robot) throw new HttpError(404, "not_found", "Robot was not found in the current supplier scope.");
  return { robot, meta: unified.responseMeta(accessContext, result.errors) };
}

async function getRobotStatus(accessContext, robotId) {
  const result = await getRobot(accessContext, robotId);
  const robot = result.robot;
  return {
    status: {          
      robot_id: robot.robot_id,
      supplier_id: robot.supplier_id,
      branch_id: robot.branch_id,
      connection_status: robot.connection_status,
      battery_percent: robot.battery_percent,
      battery_status: robot.battery_status,
      current_mode: robot.current_mode,
      current_zone: robot.current_zone,
      navigation_status: robot.navigation_status,
      safety_status: robot.safety_status,
      data_quality_status: robot.data_quality_status,
      last_heartbeat: robot.last_heartbeat,
      updated_at: robot.updated_at
    },
    meta: result.meta
  };
}

async function collectFromRobotSupplier(robot, method, args) {
  const adapter = registry.getAdapter(robot.supplier_id);
  const supplierId = robot.supplier_id;

  try {
    if (!adapter) throw new Error(`No adapter is registered for supplier ${supplierId}.`);
    await adapter.authenticate();
    const rows = await adapter[method](...args);
    return { rows: Array.isArray(rows) ? rows : [], errors: [] };
  } catch (error) {
    // A lightweight context preserves structured logging even if the registry entry is missing.
    unified.logAdapterFailure(adapter || { supplierId }, method, error);
    return {
      rows: [],
      errors: [{ supplier_id: supplierId, status: "OFFLINE", operation: method, message: "Supplier data is temporarily unavailable." }]
    };
  }
}

async function getRobotEvents(accessContext, robotId) {
  const robotResult = await getRobot(accessContext, robotId);
  const result = await collectFromRobotSupplier(robotResult.robot, "getEvents", [{ robotId }]);
  const errors = [...robotResult.meta.adapter_errors, ...result.errors];
  return { events: result.rows, meta: unified.responseMeta(accessContext, errors) };
}

async function getRobotAlerts(accessContext, robotId) {
  const robotResult = await getRobot(accessContext, robotId);
  const result = await collectFromRobotSupplier(robotResult.robot, "getAlerts", [{ robotId }]);
  const errors = [...robotResult.meta.adapter_errors, ...result.errors];
  return { alerts: result.rows, meta: unified.responseMeta(accessContext, errors) };
}

module.exports = { getRobots, getRobot, getRobotStatus, getRobotEvents, getRobotAlerts };
