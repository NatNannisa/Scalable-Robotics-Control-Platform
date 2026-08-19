const current = require("./currentSchemaService");

async function getOverview() {
  const data = await current.load();
  const routes = current.buildRoutes(data.robots, data.zonesById);
  const alerts = current.buildAlerts(data.eventView, data.robots);
  const activeRobots = data.robots.filter((robot) => ["Patrolling", "Interacting"].includes(robot.status)).length;
  const averageBattery = data.robots.length
    ? Math.round(data.robots.reduce((sum, robot) => sum + Number(robot.battery_percentage || 0), 0) / data.robots.length)
    : 0;
  const stageCounts = current.stageCounts(data.customerInteractions);
  const averageReadiness = routes.length
    ? Math.round(routes.reduce((sum, route) => sum + Number(route.readiness_percent || 0), 0) / routes.length)
    : 0;
  const averageInteractionTime = data.customerInteractions.length
    ? Math.round(data.customerInteractions.reduce((sum, item) => sum + Number(item.interaction_duration_sec || 0), 0) / data.customerInteractions.length)
    : 0;
  const safetyAlerts = alerts.length;

  return {
    source: data.source,
    zones: data.zones,
    branches: [{ id: "cp-hypermarket-demo", branch_name: "CP Hypermarket Demo", status: "Online" }],
    robots: data.robotView,
    metrics: [
      { metric_id: "robots_online", label: "Robots active", value: activeRobots, unit: "robots" },
      { metric_id: "route_readiness", label: "Route Readiness", value: averageReadiness, unit: "%" },
      { metric_id: "avg_interaction_time", label: "Avg Interaction Time", value: averageInteractionTime, unit: "sec" },
      { metric_id: "safety_alerts", label: "Safety Alerts", value: safetyAlerts, unit: "alerts", status: safetyAlerts ? "warning" : "online" },
      { metric_id: "avg_battery", label: "Average battery", value: averageBattery, unit: "%" },
      { metric_id: "customer_interactions", label: "Customer interactions", value: data.customerInteractions.length, unit: "rows" },
      { metric_id: "conversion", label: "Converted", value: stageCounts.converted, unit: "customers" }
    ],
    recentEvents: data.eventView.slice(0, 10),
    alerts: alerts.slice(0, 10),
    routeSummary: {
      averageReadiness,
      routes
    }
  };
}

async function getStoreMap() {
  const data = await current.load();
  const routes = current.buildRoutes(data.robots, data.zonesById);
  const routePoints = routes.flatMap((route) =>
    route.route_path.split(" -> ").map((zoneName, index) => ({
      route_id: route.route_id,
      sequence: index + 1,
      zone_name: zoneName
    }))
  );
  return {
    source: data.source,
    branches: [{ id: "cp-hypermarket-demo", branch_name: "CP Hypermarket Demo", status: "Online" }],
    robots: data.robotView,
    zones: data.zones,
    routes,
    routePoints
  };
}

async function getLiveCamera() {
  const data = await current.load();
  const cameras = data.robotView.map((robot) => ({
    camera_id: `${robot.robot_id}-POV`,
    robot_id: robot.robot_id,
    camera_status: robot.status === "Error" ? "warning" : "live",
    battery_percent: robot.battery_percentage,
    signal_strength: robot.status === "Error" ? "weak" : "strong",
    current_zone: robot.currentZone
  }));
  return {
    source: data.source,
    cameras,
    events: data.eventView.slice(0, 30),
    robots: data.robotView,
    metrics: {
      camerasOnline: cameras.filter((camera) => camera.camera_status === "live").length,
      avgBattery: cameras.length
        ? Math.round(cameras.reduce((sum, camera) => sum + Number(camera.battery_percent || 0), 0) / cameras.length)
        : 0,
      avgSignal: cameras.some((camera) => camera.signal_strength === "weak") ? "Medium" : "Strong",
      detectionEvents: data.eventView.filter((event) => /customer detected/i.test(event.message)).length,
      safetyAlerts: current.buildAlerts(data.eventView, data.robots).length
    }
  };
}

async function getEventLog() {
  const data = await current.load();
  return { source: data.source, events: data.eventView.slice(0, 100) };
}

async function getAlerts() {
  const data = await current.load();
  return { source: data.source, alerts: current.buildAlerts(data.eventView, data.robots) };
}

module.exports = { getOverview, getStoreMap, getLiveCamera, getEventLog, getAlerts };
