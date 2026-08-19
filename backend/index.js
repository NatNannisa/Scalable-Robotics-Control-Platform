const http = require("node:http");
const controlCenter = require("./services/controlCenterService");
const analytics = require("./services/analyticsService");
const management = require("./services/managementService");
const lab = require("./services/labService");
const branchService = require("./services/branchService");
const robotService = require("./services/robotService");
const alertService = require("./services/alertService");
const ticketService = require("./services/ticketService");
const supplierService = require("./services/supplierService");
const demoSession = require("./auth/demoSession");
const { authorize, HttpError } = require("./auth/authorize");
const { PERMISSIONS } = require("./auth/roles");

const port = Number(process.env.PORT || 3001);
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
// Demo login requests are intentionally limited to a small JSON payload.
const DEMO_PAYLOAD_LIMIT_BYTES = 16 * 1024;

const routes = new Map([
  ["/api/control-center/overview", controlCenter.getOverview],
  ["/api/control-center/3d-store-map", controlCenter.getStoreMap],
  ["/api/control-center/live-camera", controlCenter.getLiveCamera],
  ["/api/control-center/event-log", controlCenter.getEventLog],
  ["/api/control-center/alerts", controlCenter.getAlerts],
  ["/api/analytics/kpi-overview", analytics.getKpiOverview],
  ["/api/analytics/engagement-funnel", analytics.getEngagementFunnel],
  ["/api/analytics/trend-report", analytics.getTrendReport],
  ["/api/analytics/zone-analytics", analytics.getZoneAnalytics],
  ["/api/analytics/customer-insight", analytics.getCustomerInsight],
  ["/api/management/campaigns", management.getCampaigns],
  ["/api/management/scripts", management.getScripts],
  ["/api/management/zones-routes", management.getZonesRoutes],
  ["/api/data-science-lab/overview", lab.getOverview],
  ["/api/data-science-lab/model-metrics", lab.getModelMetrics],
  ["/api/data-science-lab/sensor-logs", lab.getSensorLogs],
  ["/api/data-science-lab/experiments", lab.getExperiments]
]);

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > DEMO_PAYLOAD_LIMIT_BYTES) throw new HttpError(413, "payload_too_large", "Request payload exceeds the demo limit.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

function routePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new HttpError(400, "invalid_path", "URL path contains invalid encoding.");
  }
}

async function handleUnifiedGet(request, pathname) {
  // Preserve empty segments so route ID guards can reject paths such as /api/branches//robots.
  const parts = pathname.split("/").slice(1);

  if (pathname === "/api/branches") {
    return branchService.getBranches(authorize(request, PERMISSIONS.BRANCH_READ));
  }
  if (parts[0] === "api" && parts[1] === "branches" && parts[2] !== "" && parts.length === 3) {
    return branchService.getBranch(authorize(request, PERMISSIONS.BRANCH_READ), routePart(parts[2]));
  }
  if (parts[0] === "api" && parts[1] === "branches" && parts[2] !== "" && parts[3] === "robots" && parts.length === 4) {
    return branchService.getBranchRobots(authorize(request, PERMISSIONS.ROBOT_READ), routePart(parts[2]));
  }
  if (pathname === "/api/robots") {
    return robotService.getRobots(authorize(request, PERMISSIONS.ROBOT_READ));
  }
  if (parts[0] === "api" && parts[1] === "robots" && parts[2] !== "" && parts.length === 3) {
    return robotService.getRobot(authorize(request, PERMISSIONS.ROBOT_READ), routePart(parts[2]));
  }
  if (parts[0] === "api" && parts[1] === "robots" && parts[2] !== "" && parts.length === 4) {
    const robotId = routePart(parts[2]);
    if (parts[3] === "status") return robotService.getRobotStatus(authorize(request, PERMISSIONS.ROBOT_READ), robotId);
    if (parts[3] === "events") return robotService.getRobotEvents(authorize(request, PERMISSIONS.EVENT_READ), robotId);
    if (parts[3] === "alerts") return robotService.getRobotAlerts(authorize(request, PERMISSIONS.ALERT_READ), robotId);
  }
  if (pathname === "/api/alerts") {
    return alertService.getAlerts(authorize(request, PERMISSIONS.ALERT_READ));
  }
  if (pathname === "/api/tickets") {
    return ticketService.getTickets(authorize(request, PERMISSIONS.TICKET_READ));
  }
  if (pathname === "/api/suppliers") {
    return supplierService.getSuppliers(authorize(request, PERMISSIONS.SUPPLIER_READ));
  }
  if (parts[0] === "api" && parts[1] === "suppliers" && parts[2] !== "" && parts[3] === "adapter-health" && parts.length === 4) {
    return supplierService.getAdapterHealth(authorize(request, PERMISSIONS.ADAPTER_HEALTH_READ), routePart(parts[2]));
  }

  throw new HttpError(404, "not_found", "API route was not found.");
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    });
    return response.end();
  }

  try {
    if (request.method === "POST" && pathname === "/api/auth/demo-login") {
      const body = await readJsonBody(request);
      const session = demoSession.createSession(body.user_id);
      if (!session) throw new HttpError(401, "invalid_demo_user", "Demo user was not found.");
      return sendJson(response, 200, {
        session_token: session.token,
        token_type: "Bearer",
        expires_at: session.expires_at,
        user: session.user
      }, { "Set-Cookie": demoSession.sessionCookie(session.token) });
    }

    if (request.method !== "GET") return sendJson(response, 405, { error: "method_not_allowed" });

    if (pathname === "/health" || pathname === "/api/health") {
      return sendJson(response, 200, { ok: true, service: "cp-robot-control-room-api" });
    }

    const legacyHandler = routes.get(pathname);
    if (legacyHandler) return sendJson(response, 200, await legacyHandler(request));

    if (pathname.startsWith("/api/")) return sendJson(response, 200, await handleUnifiedGet(request, pathname));
    return sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    if (error instanceof HttpError) {
      return sendJson(response, error.statusCode, { error: error.code, message: error.message });
    }
    const errorType = error?.constructor?.name || typeof error;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "(no stack trace available)";
    console.error(`${request.method} ${pathname}:`, errorMessage);
    // Keep full diagnostics server-side while preserving the existing generic 503 response.
    console.error("Unhandled backend error details:", { type: errorType, stack: errorStack });
    return sendJson(response, 503, {
      error: "backend_data_unavailable",
      message: "Dashboard data is temporarily unavailable. The frontend may use mock fallback data."
    });
  }
});

if (require.main === module) {
  server.listen(port, () => {
    if (!process.env.ALLOWED_ORIGIN) {
      console.warn('ALLOWED_ORIGIN is not set; using wildcard CORS origin "*".');
    }
    console.log(`CP Robot Control Room API listening on http://localhost:${port}`);
  });
}

module.exports = server;
