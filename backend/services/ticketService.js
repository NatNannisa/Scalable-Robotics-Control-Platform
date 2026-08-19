const unified = require("./unifiedDataService");

function createdAtTimestamp(value) {
  if (value == null || value === "") return Number.NEGATIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  // Invalid timestamps sort last instead of producing NaN in the comparator.
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function compareCreatedAtDescending(a, b) {
  const aTimestamp = createdAtTimestamp(a.created_at);
  const bTimestamp = createdAtTimestamp(b.created_at);
  return aTimestamp === bTimestamp ? 0 : bTimestamp - aTimestamp;
}

async function getTickets(accessContext) {
  const result = await unified.collect("getTickets", accessContext);
  result.rows.sort(compareCreatedAtDescending);
  return { tickets: result.rows, meta: unified.responseMeta(accessContext, result.errors) };
}

module.exports = { getTickets };
