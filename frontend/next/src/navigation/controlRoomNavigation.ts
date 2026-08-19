import { Activity, AlertTriangle, BarChart3, Bot, Camera, FlaskConical, Gauge, Map, Megaphone, Radio, Route, Settings, Sparkles, Users } from "lucide-react";
import type { DashboardPage } from "@/components/space-dashboard/SpaceDashboard";

export type ControlRoomNavItem = {
  key: DashboardPage;
  href: string;
  label: string;
  group: "Control Center" | "Analytics" | "Management" | "Lab";
  icon: typeof Activity;
};

export const controlRoomNavigation: ControlRoomNavItem[] = [
  { key: "control-center", href: "/control-center", label: "Overview / ภาพรวม", group: "Control Center", icon: Activity },
  { key: "3d-store-map", href: "/control-center/3d-store-map", label: "3D Store Map", group: "Control Center", icon: Map },
  { key: "live-camera", href: "/control-center/live-camera", label: "Live Camera", group: "Control Center", icon: Camera },
  { key: "event-log", href: "/control-center/event-log", label: "Event Log", group: "Control Center", icon: Radio },
  { key: "alerts", href: "/control-center/alerts", label: "Alerts", group: "Control Center", icon: AlertTriangle },
  { key: "analytics", href: "/analytics", label: "Analytics Hub", group: "Analytics", icon: BarChart3 },
  { key: "kpi-overview", href: "/analytics/kpi-overview", label: "KPI Overview", group: "Analytics", icon: Gauge },
  { key: "engagement-funnel", href: "/analytics/engagement-funnel", label: "Engagement Funnel", group: "Analytics", icon: Users },
  { key: "trend-report", href: "/analytics/trend-report", label: "Trend & Report", group: "Analytics", icon: Activity },
  { key: "zone-analytics", href: "/analytics/zone-analytics", label: "Zone Analytics", group: "Analytics", icon: Route },
  { key: "customer-insight", href: "/analytics/customer-insight", label: "Customer Insight", group: "Analytics", icon: Sparkles },
  { key: "campaigns", href: "/management/campaigns", label: "Campaigns", group: "Management", icon: Megaphone },
  { key: "scripts", href: "/management/scripts", label: "Scripts", group: "Management", icon: Bot },
  { key: "zones-routes", href: "/management/zones-routes", label: "Zones & Routes", group: "Management", icon: Route },
  { key: "data-science-lab", href: "/data-science-lab", label: "Data Science Lab", group: "Lab", icon: FlaskConical },
  { key: "settings", href: "/settings", label: "Settings", group: "Lab", icon: Settings }
];

export function groupNavigation(items: ControlRoomNavItem[]) {
  return ["Control Center", "Analytics", "Management", "Lab"].map((group) => ({
    label: group,
    items: items.filter((item) => item.group === group)
  }));
}
