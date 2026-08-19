const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const dataDir = path.resolve(__dirname, "..", "frontend", "next", "src", "data");
const files = {
  branches: "branches.json",
  robots: "robots.json",
  campaigns: "campaigns.json",
  products: "products.json",
  zones: "zones.json",
  routes: "routes.json",
  route_points: "routePoints.json",
  scripts: "scripts.json",
  robot_event_logs: "robotEventLogs.json",
  robot_alerts: "robotAlerts.json",
  live_cameras: "liveCameras.json",
  camera_events: "cameraEvents.json",
  interactions: "interactions.json",
  sales_impact: "salesImpact.json",
  analytics_metrics: "analyticsMetrics.json",
  customer_insights: "customerInsights.json",
  data_science_experiments: "dataScienceExperiments.json",
  sensor_logs: "sensorLogs.json",
  model_metrics: "modelMetrics.json"
};

function normalize(table, row) {
  if (["robot_event_logs", "camera_events", "interactions", "sensor_logs"].includes(table)) {
    const { timestamp, ...rest } = row;
    return { ...rest, event_timestamp: timestamp };
  }
  if (table === "robot_alerts") {
    const { created_at, ...rest } = row;
    return { ...rest, event_timestamp: created_at };
  }
  return row;
}

http.createServer((request, response) => {
  const table = new URL(request.url, "http://localhost").pathname.split("/").filter(Boolean).pop();
  if (!files[table]) {
    response.writeHead(404, { "Content-Type": "application/json" });
    return response.end(JSON.stringify({ error: "table_not_found" }));
  }
  const rows = JSON.parse(fs.readFileSync(path.join(dataDir, files[table]), "utf8"))
    .map((row) => normalize(table, row));
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(rows));
}).listen(3002, () => {
  console.log("Mock Supabase REST available at http://localhost:3002");
});
