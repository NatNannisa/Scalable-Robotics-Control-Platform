const fs = require("node:fs");
const path = require("node:path");

function loadFixture(relativePath) {
  const filePath = path.resolve(__dirname, "..", "..", "shared", "mock-data", relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function canonicalRobotId(branchId, supplierId, sourceRobotId) {
  const supplierTag = supplierId.split("-").pop().toUpperCase();
  const digits = String(sourceRobotId || "").match(/(\d+)$/)?.[1] || "0";
  const sequence = String(Number(digits) % 100 || 1).padStart(2, "0");
  return `${branchId}-${supplierTag}-R${sequence}`;
}

function batteryStatus(percent, charging = false) {
  if (charging) return "CHARGING";
  if (percent == null) return "UNKNOWN";
  if (percent < 20) return "CRITICAL";
  if (percent < 30) return "LOW";
  return "NORMAL";
}

function filterRows(rows, filters = {}) {
  return rows.filter((row) => {
    if (filters.robotId && row.robot_id !== filters.robotId) return false;
    if (filters.branchId && row.branch_id !== filters.branchId) return false;
    return true;
  });
}

function normalizeValidRows(rows, normalize) {
  const normalized = [];
  for (const row of rows) {
    try {
      const value = normalize(row);
      if (value) normalized.push(value);
    } catch {
      // Malformed fixture records are intentionally rejected at the adapter boundary.
    }
  }
  return normalized;
}

module.exports = { loadFixture, canonicalRobotId, batteryStatus, filterRows, normalizeValidRows };
