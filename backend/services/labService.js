const current = require("./currentSchemaService");

async function getOverview() {
  const data = await current.load();
  const counts = current.stageCounts(data.customerInteractions);
  return {
    source: data.source,
    experiments: data.campaigns.map((campaign) => ({
      experiment_id: campaign.id,
      type: campaign.status === "Active" ? "A/B Test" : "Optimization",
      title: `${campaign.title} route signal`,
      owner: "AI Expert Lab",
      status: campaign.status.toLowerCase(),
      campaign_id: campaign.id,
      metric: "engagement_stage",
      control_score: counts.looked,
      variant_score: counts.converted,
      progress_percent: campaign.status === "Ended" ? 100 : campaign.status === "Draft" ? 25 : 72
    })),
    modelMetrics: [
      { model_id: "CURRENT-CONVERSION", model_name: "Current Conversion", metric: "converted", value: counts.converted, unit: "customers", status: "online" },
      { model_id: "CURRENT-INTERACTION", model_name: "Current Interaction", metric: "interacted", value: counts.interacted, unit: "customers", status: "online" }
    ],
    sensorLogs: data.eventView.slice(0, 20)
  };
}

async function getModelMetrics() {
  const overview = await getOverview();
  return { source: overview.source, modelMetrics: overview.modelMetrics };
}

async function getSensorLogs() {
  const data = await current.load();
  return { source: data.source, sensorLogs: data.eventView.slice(0, 100) };
}

async function getExperiments() {
  const overview = await getOverview();
  return { source: overview.source, experiments: overview.experiments };
}

module.exports = { getOverview, getModelMetrics, getSensorLogs, getExperiments };
