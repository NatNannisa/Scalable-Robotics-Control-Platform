const current = require("./currentSchemaService");

async function getCampaigns() {
  const data = await current.load();
  return {
    source: data.source,
    campaigns: data.campaigns.map((campaign) => ({
      ...campaign,
      campaign_id: campaign.id,
      campaign_name: campaign.title,
      campaign_name_th: campaign.title,
      product_id: campaign.id,
      theme: campaign.target_zone
    })),
    products: data.campaigns.map((campaign) => ({
      product_id: campaign.id,
      product_name: campaign.title,
      category: campaign.target_zone,
      campaign_id: campaign.id
    })),
    branches: [{ id: "cp-hypermarket-demo", branch_id: "cp-hypermarket-demo", branch_name: "CP Hypermarket Demo", status: "Online" }]
  };
}

async function getScripts() {
  const data = await current.load();
  return {
    source: data.source,
    scripts: data.scriptView.map((script) => ({
      ...script,
      script_id: script.id,
      title: script.title,
      language: "th-TH",
      status: "approved",
      script_text: script.dialogue_th
    })),
    campaigns: data.campaigns,
    products: data.campaigns
  };
}

async function getZonesRoutes() {
  const data = await current.load();
  const routes = current.buildRoutes(data.robots, data.zonesById);
  const routePoints = routes.flatMap((route) =>
    route.route_path.split(" -> ").map((zoneName, index) => ({
      route_point_id: `${route.route_id}-${index + 1}`,
      route_id: route.route_id,
      sequence: index + 1,
      zone_name: zoneName
    }))
  );
  return {
    source: data.source,
    branches: [{ id: "cp-hypermarket-demo", branch_id: "cp-hypermarket-demo", branch_name: "CP Hypermarket Demo", status: "Online" }],
    zones: data.zones,
    routes,
    routePoints,
    robots: data.robotView
  };
}

module.exports = { getCampaigns, getScripts, getZonesRoutes };
