const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(__dirname, "..", "..", ".env"));

const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.");
  process.exit(1);
}

const datasets = [
  ["branches", "branches.json", "branch_id"],
  ["campaigns", "campaigns.json", "campaign_id", mapCampaign],
  ["products", "products.json", "product_id"],
  ["zones", "zones.json", "zone_id"],
  ["routes", "routes.json", "route_id"],
  ["live_cameras", "liveCameras.json", "camera_id"],
  ["robots", "robots.json", "robot_id"],
  ["route_points", "routePoints.json", "route_point_id"],
  ["scripts", "scripts.json", "script_id"],
  ["robot_event_logs", "robotEventLogs.json", "event_id", renameTimestamp],
  ["robot_alerts", "robotAlerts.json", "alert_id", renameCreatedAt],
  ["camera_events", "cameraEvents.json", "event_id", renameTimestamp],
  ["interactions", "interactions.json", "interaction_id", renameTimestamp],
  ["sales_impact", "salesImpact.json", "branch_id,campaign_id,product_id"],
  ["analytics_metrics", "analyticsMetrics.json", "metric_id"],
  ["customer_insights", "customerInsights.json", "insight_id"],
  ["data_science_experiments", "dataScienceExperiments.json", "experiment_id"],
  ["sensor_logs", "sensorLogs.json", "sensor_log_id", renameTimestamp],
  ["model_metrics", "modelMetrics.json", "model_id,metric"]
];

function mapCampaign(row) {
  return { ...row, assigned_branch_ids: row.assigned_branch_ids || [] };
}

function renameTimestamp(row) {
  const { timestamp, ...rest } = row;
  return { ...rest, event_timestamp: timestamp };
}

function renameCreatedAt(row) {
  const { created_at, ...rest } = row;
  return { ...rest, event_timestamp: created_at };
}

async function upsert(table, rows, onConflict) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(rows)
    }
  );

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
}

async function main() {
  let failed = false;
  for (const [table, fileName, onConflict, transform = (row) => row] of datasets) {
    const filePath = path.resolve(__dirname, "..", "frontend", "next", "src", "data", fileName);
    try {
      const rows = JSON.parse(fs.readFileSync(filePath, "utf8")).map(transform);
      await upsert(table, rows, onConflict);
      console.log(`[ok] ${table}: ${rows.length} rows`);
    } catch (error) {
      failed = true;
      console.error(`[failed] ${table}: ${error.message}`);
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
