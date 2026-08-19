import type { DashboardPage } from "@/components/space-dashboard/SpaceDashboard";
import type { UserRole } from "@/src/auth/types";

const sharedControlPages: DashboardPage[] = ["control-center", "3d-store-map", "live-camera", "event-log", "alerts", "settings"];

export const roleRoutePermissions: Record<UserRole, DashboardPage[]> = {
  owner: [
    ...sharedControlPages,
    "analytics",
    "kpi-overview",
    "engagement-funnel",
    "trend-report",
    "zone-analytics",
    "customer-insight",
    "campaigns",
    "scripts",
    "zones-routes",
    "data-science-lab"
  ],
  operations: [...sharedControlPages, "analytics", "kpi-overview", "engagement-funnel", "trend-report", "zone-analytics", "customer-insight", "campaigns", "scripts", "zones-routes"],
  store_manager: [...sharedControlPages, "analytics", "kpi-overview", "zone-analytics", "campaigns", "zones-routes"],
  supplier: ["control-center", "live-camera", "event-log", "alerts", "settings"],
  viewer: ["control-center", "3d-store-map", "live-camera", "event-log", "alerts", "analytics", "kpi-overview", "settings"]
};

export function canAccessDashboardPage(role: UserRole, page: DashboardPage) {
  return roleRoutePermissions[role]?.includes(page) ?? false;
}

export function canViewBusinessMetrics(role: UserRole) {
  return role !== "supplier";
}

export function canViewDataScienceLab(role: UserRole) {
  return role === "owner";
}
