import eventLog from "@/src/data/mockRobotEventLog.json";
import detectionLog from "@/src/data/mockDetectionLog.json";
import routeLog from "@/src/data/mockRouteLog.json";
import interactionLog from "@/src/data/mockInteractionLog.json";
import products from "@/src/data/mockProducts.json";
import campaigns from "@/src/data/mockCampaigns.json";
import analyticsMetrics from "@/src/data/analyticsMetrics.json";
import branches from "@/src/data/branches.json";
import newProducts from "@/src/data/products.json";
import newCampaigns from "@/src/data/campaigns.json";
import interactions from "@/src/data/interactions.json";
import salesImpact from "@/src/data/salesImpact.json";
import customerInsights from "@/src/data/customerInsights.json";
import zones from "@/src/data/zones.json";

export type RobotEvent = (typeof eventLog)[number];
export type Detection = (typeof detectionLog)[number];
export type RoutePoint = (typeof routeLog)[number];
export type Interaction = (typeof interactionLog)[number];

const safetyTypes = new Set(["obstacle_detected", "safety_distance_warning", "robot_stopped"]);
const redesignedMetrics = analyticsMetrics as any[];
const redesignedBranches = branches as any[];
const redesignedProducts = newProducts as any[];
const redesignedCampaigns = newCampaigns as any[];
const redesignedInteractions = interactions as any[];
const redesignedSalesImpact = salesImpact as any[];
const redesignedCustomerInsights = customerInsights as any[];
const redesignedZones = zones as any[];

function countEvents(type: string) {
  return eventLog.filter((event) => event.event_type === type).length;
}

function sumInteractions(field: keyof Pick<Interaction, "customer_detected" | "script_played" | "customer_stopped" | "product_interest" | "faq_opened" | "sampling_interest">) {
  return interactionLog.reduce((total, interaction) => total + Number(interaction[field] ?? 0), 0);
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function getExecutiveKPIs() {
  const customersDetected = countEvents("customer_detected");
  const scriptsPlayed = countEvents("invitation_script_played");
  const samplingInterest = sumInteractions("sampling_interest");
  const safetyEvents = getSafetyEvents().length;
  const routeCompletion = getRouteCompletion();
  const avgDuration = Math.round(
    interactionLog.reduce((total, interaction) => total + interaction.interaction_duration_sec, 0) / interactionLog.length
  );

  return {
    customersDetected,
    scriptsPlayed,
    samplingInterest,
    engagementRate: percent(samplingInterest, customersDetected),
    safetyEvents,
    routeCompletion,
    averageInteractionDuration: avgDuration,
    bestZone: getZonePerformance()[0]?.zone ?? "N/A",
    bestProduct: getProductPerformance()[0]?.product_name ?? "N/A"
  };
}

export function getFunnelData() {
  const steps = [
    ["Customer Detected", sumInteractions("customer_detected")],
    ["Invitation Script Played", sumInteractions("script_played")],
    ["Customer Stopped", sumInteractions("customer_stopped")],
    ["Product Interest", sumInteractions("product_interest")],
    ["Sampling Interest", sumInteractions("sampling_interest")]
  ] as const;
  const max = steps[0][1] || 1;

  return steps.map(([name, value]) => ({ name, value, conversion: percent(value, max) }));
}

export function getZonePerformance() {
  const byZone = new Map<string, { zone: string; interactions: number; sampling_interest: number; avg_duration: number; total_duration: number }>();

  for (const interaction of interactionLog) {
    const current = byZone.get(interaction.zone) ?? {
      zone: interaction.zone,
      interactions: 0,
      sampling_interest: 0,
      avg_duration: 0,
      total_duration: 0
    };
    current.interactions += 1;
    current.sampling_interest += interaction.sampling_interest;
    current.total_duration += interaction.interaction_duration_sec;
    current.avg_duration = Math.round(current.total_duration / current.interactions);
    byZone.set(interaction.zone, current);
  }

  return [...byZone.values()].sort((a, b) => b.sampling_interest - a.sampling_interest || b.interactions - a.interactions);
}

export function getProductPerformance() {
  const byProduct = new Map<string, { product_id: string; product_name: string; interactions: number; sampling_interest: number; color: string }>();

  for (const interaction of interactionLog) {
    const product = products.find((item) => item.product_id === interaction.product_id);
    const current = byProduct.get(interaction.product_id) ?? {
      product_id: interaction.product_id,
      product_name: interaction.product_name,
      interactions: 0,
      sampling_interest: 0,
      color: product?.hero_color ?? "#35d5ff"
    };
    current.interactions += 1;
    current.sampling_interest += interaction.sampling_interest;
    byProduct.set(interaction.product_id, current);
  }

  return [...byProduct.values()].sort((a, b) => b.sampling_interest - a.sampling_interest || b.interactions - a.interactions);
}

export function getLiveEventFeed() {
  return [...eventLog].sort((a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime());
}

export function getSafetyEvents() {
  return eventLog.filter((event) => event.safety_flag || safetyTypes.has(event.event_type));
}

export function getRoutePositions() {
  return routeLog.map((point, index) => ({
    ...point,
    index,
    completed: point.route_status === "completed",
    stopped: point.route_status === "stopped"
  }));
}

export function getEngagementTrend() {
  const buckets = new Map<string, { time: string; detected: number; scriptPlayed: number; samplingInterest: number }>();

  for (const event of eventLog) {
    const date = new Date(event.event_timestamp);
    const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
    const bucket = buckets.get(time) ?? { time, detected: 0, scriptPlayed: 0, samplingInterest: 0 };
    if (event.event_type === "customer_detected") bucket.detected += 1;
    if (event.event_type === "invitation_script_played") bucket.scriptPlayed += 1;
    if (event.event_type === "sampling_interest") bucket.samplingInterest += 1;
    buckets.set(time, bucket);
  }

  return [...buckets.values()].filter((bucket) => bucket.detected || bucket.scriptPlayed || bucket.samplingInterest);
}

export function getCurrentRobotState(currentEventIndex = eventLog.length - 1) {
  const events = getLiveEventFeed();
  const currentEvent = events[Math.min(currentEventIndex, events.length - 1)];
  const lastRoute = [...routeLog].reverse().find((point) => new Date(point.timestamp) <= new Date(currentEvent.event_timestamp)) ?? routeLog[routeLog.length - 1];
  const lastDetection = [...detectionLog].reverse().find((detection) => new Date(detection.timestamp) <= new Date(currentEvent.event_timestamp));
  const safetyActive = ["obstacle_detected", "robot_stopped", "safety_distance_warning"].includes(currentEvent.event_type);
  const currentAction = getRobotAction(currentEvent.event_type);

  return {
    robotId: "NONGCHIM-001",
    robotName: "Nong Chim",
    battery: lastRoute.battery_percent,
    speed: safetyActive ? 0 : lastRoute.speed_level,
    temperature: safetyActive ? 42 : 39,
    networkStrength: 92,
    safetyStatus: safetyActive ? "Warning" : "Safe",
    closestObstacleDistance: lastDetection?.detected_object_type.includes("obstacle") || safetyActive ? currentEvent.distance_m ?? lastDetection?.distance_m ?? 0.82 : 1.8,
    currentZone: currentEvent.zone,
    currentAction,
    routeCompletion: getRouteCompletion(),
    routeStatus: safetyActive ? "stopped" : lastRoute.route_status,
    currentEvent
  };
}

export function getActiveCampaign() {
  return campaigns.find((campaign) => campaign.status === "active") ?? campaigns[0];
}

function getRouteCompletion() {
  return percent(routeLog.filter((point) => point.route_status === "completed").length, routeLog.length);
}

function getRobotAction(eventType: string) {
  const actions: Record<string, string> = {
    session_started: "Initializing live session",
    route_started: "Moving to first zone",
    zone_entered: "Scanning zone traffic",
    customer_detected: "Evaluating customer eligibility",
    customer_approached: "Approaching customer",
    invitation_script_played: "Playing sampling script",
    product_recommended: "Recommending product",
    product_faq_opened: "Answering product FAQ",
    sampling_interest: "Handing off to sampling staff",
    obstacle_detected: "Obstacle detected",
    robot_stopped: "Emergency stop active",
    robot_resumed: "Resuming route",
    safety_distance_warning: "Maintaining safe distance"
  };

  return actions[eventType] ?? "Monitoring route";
}

export function getKPIOverview() {
  return redesignedMetrics.map((metric) => ({
    ...metric,
    trend: metric.trend ?? metric.trend_percent ?? 0,
    displayValue: `${metric.value}${metric.unit === "%" ? "%" : metric.unit === "x" ? "x" : metric.unit === "sec" ? "s" : ""}`
  }));
}

export function getEngagementFunnel() {
  const detected = redesignedInteractions.reduce((total, item) => total + Number(item.customer_detected), 0);
  const scripts = redesignedInteractions.reduce((total, item) => total + Number(item.script_played), 0);
  const interest = redesignedInteractions.reduce((total, item) => total + Number(item.product_interest ?? (item.interaction_result !== "ignored" && item.interaction_result !== "fast_walk")), 0);
  const sampling = redesignedInteractions.reduce((total, item) => total + Number(item.sampling_interest), 0);
  const max = detected || 1;

  return [
    { name: "Detected", value: detected, conversion: percent(detected, max) },
    { name: "Script", value: scripts, conversion: percent(scripts, max) },
    { name: "Interest", value: interest, conversion: percent(interest, max) },
    { name: "Sampling", value: sampling, conversion: percent(sampling, max) }
  ];
}

export function getTrendReport() {
  return redesignedInteractions.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }),
    detected: item.customer_detected,
    interest: Number(item.interaction_result !== "ignored" && item.interaction_result !== "fast_walk"),
    sampling: item.sampling_interest,
    duration: item.interaction_duration_sec
  }));
}

export function getZoneAnalytics() {
  return redesignedZones.map((zone) => {
    const zoneInteractions = redesignedInteractions.filter((item) => item.zone_id === zone.zone_id);
    const detected = zoneInteractions.reduce((total, item) => total + Number(item.customer_detected), 0);
    const sampling = zoneInteractions.reduce((total, item) => total + Number(item.sampling_interest), 0);
    return {
      ...zone,
      readiness: zone.readiness ?? 70 + Number(zone.priority ?? 1) * 6,
      detected,
      sampling,
      conversion: percent(sampling, detected),
      interactions: zoneInteractions.length
    };
  });
}

export function getCustomerInsight() {
  return redesignedCustomerInsights;
}

export function getBranchPerformance() {
  return redesignedBranches.map((branch) => {
    const branchInteractions = redesignedInteractions.filter((item) => item.branch_id === branch.branch_id);
    const detected = branchInteractions.reduce((total, item) => total + Number(item.customer_detected), 0);
    const sampling = branchInteractions.reduce((total, item) => total + Number(item.sampling_interest), 0);
    return {
      ...branch,
      detected,
      sampling,
      conversion: percent(sampling, detected)
    };
  });
}

export function getSalesImpact() {
  return redesignedSalesImpact.map((item, index) => ({
    ...item,
    sales_impact_id: item.sales_impact_id ?? `SALE-${index + 1}`,
    sales_uplift: item.sales_uplift ?? item.sales_uplift_percent ?? 0,
    branch_name: redesignedBranches.find((branch) => branch.branch_id === item.branch_id)?.branch_name ?? item.branch_id,
    product_name: redesignedProducts.find((product) => product.product_id === item.product_id)?.product_name ?? item.product_id
  }));
}

export function getCampaignROI() {
  return redesignedCampaigns.map((campaign) => {
    const impact = redesignedSalesImpact.filter((item) => item.campaign_id === campaign.campaign_id);
    const averageRoi = impact.length ? impact.reduce((total, item) => total + item.roi_score, 0) / impact.length : 0;
    const averageUplift = impact.length ? impact.reduce((total, item) => total + item.sales_uplift_percent, 0) / impact.length : 0;
    return {
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
      status: campaign.status,
      roi_score: Number(averageRoi.toFixed(1)),
      sales_uplift: Number(averageUplift.toFixed(1)),
      target_conversion_percent: campaign.target_conversion_percent
    };
  });
}
