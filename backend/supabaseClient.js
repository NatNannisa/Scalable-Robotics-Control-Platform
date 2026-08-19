const fs = require("node:fs");
const path = require("node:path");

// WARNING: This module uses SUPABASE_SERVICE_ROLE_KEY, which has elevated
// server-side privileges and can bypass RLS. Never import this file into code
// that is bundled for frontend/client execution.
const ALLOWED_FILTER_COLUMNS = Object.freeze({
  zones: new Set(["id", "zone_name", "traffic_level", "created_at"]),
  campaigns: new Set(["id", "title", "status", "target_zone", "created_at"]),
  robot_scripts: new Set(["id", "campaign_id", "trigger_event", "dialogue_th", "dialogue_en"]),
  robots: new Set(["id", "name", "status", "battery_percentage", "current_zone_id", "last_updated"]),
  event_logs: new Set(["id", "robot_id", "event_type", "message", "created_at"]),
  customer_interactions: new Set([
    "id",
    "robot_id",
    "zone_id",
    "age_group",
    "gender",
    "engagement_stage",
    "interaction_duration_sec",
    "created_at"
  ])
});

const ALLOWED_TABLES = new Set(Object.keys(ALLOWED_FILTER_COLUMNS));
const MAX_LIMIT = 1000;
const POSTGREST_OPERATOR_PATTERN =
  /^(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|ov|sl|sr|nxl|nxr|adj|not|fts|plfts|phfts|wfts)\./;

let cachedConfig;

function loadEnvFile(filePath = path.resolve(__dirname, "..", "..", ".env")) {
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

loadEnvFile();

function getConfig() {
  if (cachedConfig) return cachedConfig;

  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  cachedConfig = { restUrl: `${url}/rest/v1`, key };
  return cachedConfig;
}

function assertAllowedTable(table) {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Supabase table is not allowed: ${table}`);
  }
}

function assertAllowedFilterColumn(table, column) {
  if (!ALLOWED_FILTER_COLUMNS[table].has(column)) {
    throw new Error(`Supabase filter column is not allowed for ${table}: ${column}`);
  }
}

function normalizeSelect(table, select = "*") {
  const normalized = String(select).trim();
  if (normalized === "*") return normalized;

  const columns = normalized.split(",").map((column) => column.trim());
  if (!columns.length || columns.some((column) => !column)) {
    throw new Error(`Supabase select is invalid for ${table}.`);
  }

  for (const column of columns) {
    // Only plain allowlisted columns are accepted. This intentionally rejects
    // PostgREST embedding syntax such as "*,other_table(*)" and aliases.
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column)) {
      throw new Error(`Supabase select column is not allowed for ${table}: ${column}`);
    }
    assertAllowedFilterColumn(table, column);
  }

  return columns.join(",");
}

function normalizeOrder(table, order) {
  const parts = String(order).split(",").map((part) => part.trim());
  if (!parts.length || parts.some((part) => !part)) {
    throw new Error(`Supabase order is invalid for ${table}.`);
  }

  return parts.map((part) => {
    const match = part.match(/^([A-Za-z_][A-Za-z0-9_]*)\.(asc|desc)$/);
    if (!match) {
      throw new Error(`Supabase order is invalid for ${table}: ${part}`);
    }
    assertAllowedFilterColumn(table, match[1]);
    return part;
  }).join(",");
}

function normalizeLimit(limit) {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("Supabase limit must be a positive integer.");
  }
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeFilterValue(value) {
  const normalized = String(value);
  return POSTGREST_OPERATOR_PATTERN.test(normalized) ? normalized : `eq.${normalized}`;
}

function buildQuery(table, params = {}) {
  const query = new URLSearchParams();
  query.set("select", normalizeSelect(table, params.select || "*"));
  if (params.order) query.set("order", normalizeOrder(table, params.order));
  if (params.limit !== undefined) query.set("limit", String(normalizeLimit(params.limit)));
  for (const [column, value] of Object.entries(params.filters || {})) {
    assertAllowedFilterColumn(table, column);
    query.set(column, normalizeFilterValue(value));
  }
  return query.toString();
}

async function select(table, params = {}) {
  assertAllowedTable(table);

  const { restUrl, key } = getConfig();
  const response = await fetch(`${restUrl}/${table}?${buildQuery(table, params)}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Supabase query failed", {
      table,
      status: response.status,
      statusText: response.statusText,
      body
    });
    throw new Error(`Supabase ${table} query failed.`);
  }

  return response.json();
}

module.exports = { select };
