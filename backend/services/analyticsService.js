const current = require("./currentSchemaService");

function percent(value, total) {
  return total ? Number(((value / total) * 100).toFixed(1)) : 0;
}

async function getKpiOverview() {
  const data = await current.load();
  const counts = current.stageCounts(data.customerInteractions);
  const total = data.customerInteractions.length;
  const converted = counts.converted;
  const interested = counts.interacted + converted;
  const avgDuration = total
    ? Math.round(data.customerInteractions.reduce((sum, item) => sum + Number(item.interaction_duration_sec || 0), 0) / total)
    : 0;

  return {
    source: data.source,
    metrics: [
      { metric_id: "customers_detected", label: "Customers Detected", value: total, unit: "people", trend_percent: 0, status: "online" },
      { metric_id: "sampling_conversion", label: "Sampling Conversion", value: percent(converted, total), unit: "%", trend_percent: 0, status: "online" },
      { metric_id: "sales_uplift", label: "Sales Uplift", value: percent(converted, interested || total), unit: "%", trend_percent: 0, status: "online" },
      { metric_id: "product_interest", label: "Product Interest", value: interested, unit: "signals", trend_percent: 0, status: "online" },
      { metric_id: "roi_score", label: "ROI Score", value: Number((1 + percent(converted, total) / 10).toFixed(2)), unit: "x", trend_percent: 0, status: "online" },
      { metric_id: "avg_interaction_time", label: "Avg Interaction Time", value: avgDuration, unit: "sec", trend_percent: 0, status: "online" }
    ],
    salesImpact: []
  };
}

async function getEngagementFunnel() {
  const data = await current.load();
  const counts = current.stageCounts(data.customerInteractions);
  return {
    source: data.source,
    stages: [
      { id: "passed_by", label: "Passed By", value: counts.passedBy },
      { id: "looked", label: "Looked", value: counts.looked },
      { id: "interacted", label: "Interacted", value: counts.interacted },
      { id: "converted", label: "Converted", value: counts.converted }
    ],
    interactions: data.customerInteractions
  };
}

async function getTrendReport() {
  const data = await current.load();
  const byDate = current.groupCount(data.customerInteractions, (item) => String(item.created_at || "").slice(0, 10));
  const metrics = Object.entries(byDate)
    .map(([date, count]) => ({ date, interactions: count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { source: data.source, metrics, salesImpact: [], interactions: data.customerInteractions };
}

async function getZoneAnalytics() {
  const data = await current.load();
  const zones = data.zones.map((zone) => {
    const rows = data.customerInteractions.filter((item) => item.zone_id === zone.id);
    const converted = rows.filter((item) => item.engagement_stage === "Converted").length;
    return {
      ...zone,
      zone_id: zone.id,
      interactions: rows.length,
      samplingInterest: rows.filter((item) => ["Interacted", "Converted"].includes(item.engagement_stage)).length,
      conversionPercent: percent(converted, rows.length)
    };
  }).sort((a, b) => b.conversionPercent - a.conversionPercent || b.interactions - a.interactions);
  return { source: data.source, zones };
}

async function getCustomerInsight() {
  const data = await current.load();
  const zoneAnalytics = await getZoneAnalytics();
  const topZone = zoneAnalytics.zones[0];
  const counts = current.stageCounts(data.customerInteractions);
  return {
    source: data.source,
    insights: [
      {
        insight_id: "current-best-zone",
        segment: "All shoppers",
        best_time: "16:00-19:00",
        top_zone_id: topZone?.id,
        insight: `${topZone?.zone_name || "Top zone"} currently has the strongest conversion signal.`
      },
      {
        insight_id: "current-conversion",
        segment: "Converted customers",
        best_time: "Demo period",
        insight: `${counts.converted} of ${data.customerInteractions.length} interactions reached Converted stage.`
      }
    ],
    branches: [{ id: "cp-hypermarket-demo", branch_name: "CP Hypermarket Demo", status: "Online" }],
    products: data.campaigns,
    zones: data.zones
  };
}

module.exports = {
  getKpiOverview,
  getEngagementFunnel,
  getTrendReport,
  getZoneAnalytics,
  getCustomerInsight
};
