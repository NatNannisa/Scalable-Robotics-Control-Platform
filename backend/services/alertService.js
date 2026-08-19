const unified = require("./unifiedDataService");

const SEVERITY_RANK = Object.freeze({ BLOCKER: 4, CRITICAL: 3, WARNING: 2, INFO: 1 });

function raisedAtTimestamp(value) {
  if (value == null || value === "") return Number.NEGATIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  // Invalid timestamps sort last within the same severity instead of producing NaN.
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function compareRaisedAtDescending(a, b) {
  const aTimestamp = raisedAtTimestamp(a.raised_at);
  const bTimestamp = raisedAtTimestamp(b.raised_at);
  return aTimestamp === bTimestamp ? 0 : bTimestamp - aTimestamp;
}

async function getAlerts(accessContext) {
  const result = await unified.collect("getAlerts", accessContext);
  for (const alert of result.rows) {
    if (!Object.prototype.hasOwnProperty.call(SEVERITY_RANK, alert.severity)) {
      console.warn(JSON.stringify({
        level: "warn",
        code: "unknown_alert_severity",
        severity: alert.severity ?? null,
        alert_id: alert.alert_id ?? null,
        timestamp: new Date().toISOString()
      }));
    }
  }

  result.rows.sort((a, b) =>
    (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0)
    || compareRaisedAtDescending(a, b)
  );
  return { alerts: result.rows, meta: unified.responseMeta(accessContext, result.errors) };
}

module.exports = { getAlerts };
