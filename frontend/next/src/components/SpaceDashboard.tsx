"use client";

import SpaceDashboard, { type DashboardPage } from "@/components/space-dashboard/SpaceDashboard";

const pageByPath: Record<string, DashboardPage> = {
  "/": "control-center",
  "/control-center": "control-center",
  "/control-center/3d-store-map": "3d-store-map",
  "/control-center/live-camera": "live-camera",
  "/control-center/event-log": "event-log",
  "/control-center/alerts": "alerts",
  "/analytics": "analytics",
  "/analytics/kpi-overview": "kpi-overview",
  "/analytics/engagement-funnel": "engagement-funnel",
  "/analytics/trend-report": "trend-report",
  "/analytics/zone-analytics": "zone-analytics",
  "/analytics/customer-insight": "customer-insight",
  "/management": "campaigns",
  "/management/campaigns": "campaigns",
  "/management/scripts": "scripts",
  "/management/zones-routes": "zones-routes",
  "/data-science-lab": "data-science-lab",
  "/settings": "settings"
};

export default function RoutedSpaceDashboard({ path = "/control-center" }: { path?: string }) {
  return <SpaceDashboard page={pageByPath[path] ?? "control-center"} />;
}
