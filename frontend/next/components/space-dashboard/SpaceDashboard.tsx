"use client";

import Link from "next/link";
import type React from "react";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Camera,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Map,
  Megaphone,
  Radio,
  Rocket,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Zap
} from "lucide-react";
import branches from "@/src/data/branches.json";
import campaigns from "@/src/data/campaigns.json";
import products from "@/src/data/products.json";
import scripts from "@/src/data/scripts.json";
import zones from "@/src/data/zones.json";
import routes from "@/src/data/routes.json";
import routePoints from "@/src/data/routePoints.json";
import liveCameras from "@/src/data/liveCameras.json";
import cameraEvents from "@/src/data/cameraEvents.json";
import robotAlerts from "@/src/data/robotAlerts.json";
import analyticsMetrics from "@/src/data/analyticsMetrics.json";
import customerInsights from "@/src/data/customerInsights.json";
import dataScienceExperiments from "@/src/data/dataScienceExperiments.json";
import sensorLogs from "@/src/data/sensorLogs.json";
import modelMetrics from "@/src/data/modelMetrics.json";
import {
  CAMERA_PLACEHOLDER_SOURCE,
  getCameraEvents,
  getCameraHealth,
  getCameraMediaSource,
  getCameraMediaType,
  getCameraMetrics,
  getCameraOverlayState,
  getLatestCameraEvent,
  getSelectedCamera,
  type CameraEvent,
  type LiveCamera
} from "@/src/lib/cameraBehavior";
import {
  getBranchPerformance,
  getCampaignROI,
  getCustomerInsight,
  getEngagementFunnel,
  getKPIOverview,
  getProductPerformance,
  getSalesImpact,
  getTrendReport,
  getZoneAnalytics
} from "@/src/lib/analytics";
import { RouteGuard } from "@/src/auth/RouteGuard";
import { canAccessDashboardPage } from "@/src/auth/permissions";
import { getCurrentUserSession } from "@/src/auth/session";
import type { UserRole } from "@/src/auth/types";
import { BranchMonitorWorkspace } from "@/src/branch-monitor/BranchMonitorWorkspace";
import { getRobotFleet } from "@/src/lib/robotBehavior";
import { getStatusTone } from "@/src/lib/statusRules";

export type DashboardPage =
  | "control-center"
  | "3d-store-map"
  | "live-camera"
  | "event-log"
  | "alerts"
  | "analytics"
  | "kpi-overview"
  | "engagement-funnel"
  | "trend-report"
  | "zone-analytics"
  | "customer-insight"
  | "campaigns"
  | "scripts"
  | "zones-routes"
  | "data-science-lab"
  | "settings";

const nav = [
  {
    label: "Control Center",
    items: [
      ["control-center", "/control-center", "Overview / ภาพรวม", Activity],
      ["3d-store-map", "/control-center/3d-store-map", "3D Store Map", Map],
      ["live-camera", "/control-center/live-camera", "Live Camera", Camera],
      ["event-log", "/control-center/event-log", "Event Log", Radio],
      ["alerts", "/control-center/alerts", "Alerts", AlertTriangle]
    ]
  },
  {
    label: "Analytics",
    items: [
      ["analytics", "/analytics", "Analytics Hub", BarChart3],
      ["kpi-overview", "/analytics/kpi-overview", "KPI Overview", Gauge],
      ["engagement-funnel", "/analytics/engagement-funnel", "Engagement Funnel", Users],
      ["trend-report", "/analytics/trend-report", "Trend & Report", Activity],
      ["zone-analytics", "/analytics/zone-analytics", "Zone Analytics", Route],
      ["customer-insight", "/analytics/customer-insight", "Customer Insight", Sparkles]
    ]
  },
  {
    label: "Management",
    items: [
      ["campaigns", "/management/campaigns", "Campaigns", Megaphone],
      ["scripts", "/management/scripts", "Scripts", Bot],
      ["zones-routes", "/management/zones-routes", "Zones & Routes", Route]
    ]
  },
  { label: "Lab", items: [["data-science-lab", "/data-science-lab", "Data Science Lab", FlaskConical], ["settings", "/settings", "Settings", Settings]] }
] as const;

const titles: Record<DashboardPage, [string, string]> = {
  "control-center": ["CP Hypermarket Robot Control Room", "ศูนย์ควบคุมหุ่นยนต์ AI แบบเรียลไทม์"],
  "3d-store-map": ["3D Store Map", "แผนที่ร้านค้า เส้นทาง และตำแหน่งหุ่นยนต์"],
  "live-camera": ["Live Camera", "Robot POV monitoring with image, MP4, HLS and fallback"],
  "event-log": ["Event Log", "ลำดับเหตุการณ์จาก robot, camera, safety และ campaign"],
  alerts: ["Alerts", "รายการแจ้งเตือนที่ต้องติดตาม"],
  analytics: ["Analytics Hub", "ภาพรวม performance และ business impact"],
  "kpi-overview": ["KPI Overview", "ตัวชี้วัดหลักของ robot sampling operation"],
  "engagement-funnel": ["Engagement Funnel", "Detected > Script > Interest > Sampling"],
  "trend-report": ["Trend & Report", "แนวโน้มรายช่วงเวลาและ branch comparison"],
  "zone-analytics": ["Zone Analytics", "ประสิทธิภาพรายโซนใน hypermarket"],
  "customer-insight": ["Customer Insight", "พฤติกรรมลูกค้าและโอกาสทางธุรกิจ"],
  campaigns: ["Campaigns", "จัดการแคมเปญ Shrimpy Joy และ Mission to Space"],
  scripts: ["Scripts", "สคริปต์ภาษาไทย/อังกฤษสำหรับหุ่นยนต์"],
  "zones-routes": ["Zones & Routes", "Route readiness, zone sequence และ waypoint"],
  "data-science-lab": ["Data Science Lab", "Owner-only R&D, model tuning and experiments"],
  settings: ["Settings", "System, profile and demo configuration"]
};

export default function SpaceDashboard({ page }: { page: DashboardPage }) {
  const session = useMemo(() => getCurrentUserSession(), []);
  const [selectedCameraId, setSelectedCameraId] = useState(liveCameras[0]?.camera_id);
  const selectedCamera = getSelectedCamera(liveCameras as LiveCamera[], selectedCameraId);
  const metrics = getCameraMetrics(liveCameras as LiveCamera[], cameraEvents as CameraEvent[]);
  const [title, subtitle] = titles[page];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050712] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(53,213,255,.2),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(156,108,255,.18),transparent_24%),linear-gradient(180deg,#081226_0%,#050712_55%,#03040a_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#dbeafe_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative flex min-h-screen">
        <Sidebar page={page} role={session.role} />
        <main className="min-w-0 flex-1">
          <TopBar title={title} subtitle={subtitle} />
          <div className="space-y-5 p-4 xl:p-6">
            <RouteGuard page={page} session={session}>
              {page === "control-center" ? <BranchMonitorWorkspace session={session} view="overview" /> : null}
              {page === "3d-store-map" ? <BranchMonitorWorkspace session={session} view="map" /> : null}
              {page === "live-camera" ? <LiveCameraPage selectedCamera={selectedCamera} onSelect={setSelectedCameraId} metrics={metrics} /> : null}
              {page === "event-log" ? <BranchMonitorWorkspace session={session} view="events" /> : null}
              {page === "alerts" ? <BranchMonitorWorkspace session={session} view="alerts" /> : null}
              {["analytics", "kpi-overview", "engagement-funnel", "trend-report", "zone-analytics", "customer-insight"].includes(page) ? <AnalyticsPage page={page} /> : null}
              {page === "campaigns" ? <CampaignsPage /> : null}
              {page === "scripts" ? <ScriptsPage /> : null}
              {page === "zones-routes" ? <ZonesRoutesPage /> : null}
              {page === "data-science-lab" ? <DataScienceLabPage /> : null}
              {page === "settings" ? <SettingsPage /> : null}
            </RouteGuard>
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ page, role }: { page: DashboardPage; role: UserRole }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/50 p-4 backdrop-blur-2xl xl:block">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-300 font-black text-red-950 shadow-[0_0_28px_rgba(246,183,67,.28)]">CP</div>
        <div>
          <div className="text-lg font-bold">CP Hypermarket</div>
          <div className="text-xs text-cyan">AI Robot Control Room</div>
        </div>
      </div>
      <nav className="space-y-5">
        {nav.map((group) => {
          const visibleItems = group.items.filter(([key]) => canAccessDashboardPage(role, key));
          if (!visibleItems.length) return null;
          return (
          <div key={group.label}>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{group.label}</div>
            <div className="space-y-1">
              {visibleItems.map(([key, href, label, Icon]) => {
                const active = page === key;
                return (
                  <Link key={key} href={href} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition ${active ? "border-cyan/40 bg-cyan/15 text-white shadow-glow" : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"}`}>
                    <Icon size={17} className={active ? "text-cyan" : "text-slate-500"} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );})}
      </nav>
      <RobotSidebarCard />
    </aside>
  );
}

function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="border-b border-white/10 bg-slate-950/35 px-4 py-4 backdrop-blur-2xl xl:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-green/40 bg-green/15 px-3 py-1 text-xs font-bold text-green">LIVE</span>
            <h1 className="text-2xl font-bold tracking-tight text-white xl:text-3xl">{title}</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 min-w-64 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-slate-400">
            <Search size={16} />
            Search branch, robot, campaign
          </div>
          <button className="rounded-full border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan">13 Jun 2026</button>
          <button className="rounded-full bg-danger px-4 py-2 text-sm font-bold text-white shadow-danger">End Session</button>
        </div>
      </div>
    </header>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[24px] border border-white/10 bg-white/[0.065] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_60px_rgba(0,0,0,.28)] backdrop-blur-xl ${className}`}>{children}</section>;
}

function MetricCard({ label, value, unit, status }: { label: string; value: string | number; unit?: string; status?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">{label}</div>
        <span className={`h-2.5 w-2.5 rounded-full ${getStatusTone(status) === "green" ? "bg-green" : getStatusTone(status) === "amber" ? "bg-amber" : "bg-danger"}`} />
      </div>
      <div className="mt-3 text-3xl font-black text-white">{value}<span className="ml-1 text-sm font-semibold text-slate-400">{unit}</span></div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = getStatusTone(status);
  const cls = tone === "green" ? "border-green/30 bg-green/15 text-green" : tone === "amber" ? "border-amber/30 bg-amber/15 text-amber" : "border-danger/30 bg-danger/15 text-danger";
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${cls}`}>{status}</span>;
}

function RobotSidebarCard() {
  const fleet = getRobotFleet();
  return (
    <Card className="mt-5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold"><Bot size={16} className="text-cyan" /> Robot Fleet</div>
      <div className="space-y-3">
        {fleet.map((robot) => (
          <div key={robot.robot_id} className="rounded-2xl bg-slate-950/40 p-3">
            <div className="flex justify-between gap-2"><span className="font-semibold">{robot.robot_name}</span><StatusBadge status={robot.state.status} /></div>
            <div className="mt-2 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan" style={{ width: `${robot.route_progress ?? robot.state.routeProgress ?? 0}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ControlCenter({ selectedCamera, metrics }: { selectedCamera: LiveCamera | null; metrics: ReturnType<typeof getCameraMetrics> }) {
  const kpis = getKPIOverview();
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.slice(0, 4).map((metric) => <MetricCard key={metric.metric_id} label={metric.label} value={metric.value} unit={metric.unit} status={metric.status} />)}
      </div>
      <div className="grid gap-5 2xl:grid-cols-[1.4fr_.9fr]">
        <StoreMapCard />
        <div className="space-y-5">
          {selectedCamera ? <CameraPanel camera={selectedCamera} featured /> : null}
          <Card className="p-4">
            <div className="mb-3 font-bold">Camera Health / สุขภาพกล้อง</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MetricCard label="Cameras Online" value={`${metrics.camerasOnline}/${metrics.totalCameras}`} />
              <MetricCard label="Safety Alerts" value={metrics.safetyAlerts} status={metrics.safetyAlerts ? "warning" : "online"} />
            </div>
          </Card>
        </div>
      </div>
      <EventLogPage compact />
    </div>
  );
}

function StoreMapPage() {
  return <div className="grid gap-5 2xl:grid-cols-[1.4fr_.8fr]"><StoreMapCard /><ZonesRoutesPage compact /></div>;
}

function StoreMapCard() {
  return (
    <Card className="overflow-hidden p-5">
      <div className="mb-4 flex items-center justify-between">
        <div><h2 className="text-xl font-bold">3D Store Map - Live View</h2><p className="text-sm text-slate-400">Isometric retail map with glowing robot route</p></div>
        <div className="flex gap-2"><button className="rounded-full bg-cyan/15 px-3 py-1 text-xs text-cyan">3D</button><button className="rounded-full bg-white/10 px-3 py-1 text-xs">Fit</button></div>
      </div>
      <div className="relative h-[520px] overflow-hidden rounded-[20px] border border-cyan/15 bg-[radial-gradient(circle_at_50%_20%,rgba(53,213,255,.18),transparent_38%),linear-gradient(135deg,#101a35,#090d1b)]">
        <div className="absolute left-[10%] top-[18%] h-[58%] w-[78%] -skew-y-6 rounded-3xl border border-cyan/25 bg-slate-900/70 shadow-glow" />
        {zones.map((zone, index) => <div key={zone.zone_id} className="absolute rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white" style={{ left: `${15 + index * 15}%`, top: `${24 + (index % 3) * 18}%` }}>{zone.zone_name}</div>)}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
          <path d="M14 72 C24 58 34 58 45 46 S66 39 82 18" fill="none" stroke="#35d5ff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
          {routePoints.slice(0, 5).map((point) => <circle key={point.route_point_id} cx={point.x} cy={point.z} r="1.8" fill="#31e981" />)}
        </svg>
        <div className="absolute left-[45%] top-[42%] grid h-16 w-16 place-items-center rounded-full border-4 border-cyan bg-cyan/20 text-2xl shadow-glow"><Bot /></div>
        <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-300">Legend: route, waypoint, robot, obstacle, charging</div>
      </div>
    </Card>
  );
}

function LiveCameraPage({ selectedCamera, onSelect, metrics }: { selectedCamera: LiveCamera | null; onSelect: (id: string) => void; metrics: ReturnType<typeof getCameraMetrics> }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Cameras Online" value={`${metrics.camerasOnline}/${metrics.totalCameras}`} status="live" />
        <MetricCard label="Avg Battery" value={metrics.avgBattery} unit="%" />
        <MetricCard label="Avg Signal" value={metrics.avgSignal} />
        <MetricCard label="Detection Events" value={metrics.detectionEvents} />
        <MetricCard label="Safety Alerts" value={metrics.safetyAlerts} status={metrics.safetyAlerts ? "warning" : "online"} />
      </div>
      <div className="grid gap-5 2xl:grid-cols-[1.35fr_.8fr]">
        {selectedCamera ? <CameraPanel camera={selectedCamera} featured /> : null}
        <div className="space-y-5">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between"><b>Branch / Robot Filter</b><span className="text-xs text-cyan">All branches</span></div>
            <div className="grid gap-2">
              {liveCameras.map((camera) => <button key={camera.camera_id} onClick={() => onSelect(camera.camera_id)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:border-cyan/40"><div className="font-bold">{camera.camera_name}</div><div className="text-sm text-slate-400">{camera.branch_name} / {camera.robot_id}</div></button>)}
            </div>
          </Card>
          <CameraEventFeed cameraId={selectedCamera?.camera_id} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">{liveCameras.map((camera) => <button key={camera.camera_id} onClick={() => onSelect(camera.camera_id)}><CameraPanel camera={camera as LiveCamera} /></button>)}</div>
    </div>
  );
}

function CameraPanel({ camera, featured = false }: { camera: LiveCamera; featured?: boolean }) {
  const latest = getLatestCameraEvent(cameraEvents as CameraEvent[], camera.camera_id);
  const overlay = getCameraOverlayState(latest);
  const mediaType = getCameraMediaType(camera);
  const mediaSource = getCameraMediaSource(camera);
  const hasRenderableMedia = !mediaSource.startsWith("/camera/") && !mediaSource.includes("PASTE_PUBLIC");
  const showSyntheticPov = !hasRenderableMedia;
  return (
    <Card className="overflow-hidden text-left">
      <div className="flex items-center justify-between p-4"><div><b>{camera.camera_name}</b><div className="text-sm text-slate-400">{camera.branch_name} / {camera.current_zone}</div></div><StatusBadge status={latest?.event_type === "stream_disconnected" ? "offline" : camera.camera_status} /></div>
      <div className={`relative overflow-hidden bg-slate-950 ${featured ? "h-[430px]" : "h-52"}`}>
        {mediaType === "video" && hasRenderableMedia ? <video src={mediaSource} poster={camera.image_url ?? CAMERA_PLACEHOLDER_SOURCE} className="h-full w-full object-cover" autoPlay muted loop playsInline /> : null}
        {mediaType === "hls" && hasRenderableMedia ? <video src={mediaSource} poster={camera.image_url ?? CAMERA_PLACEHOLDER_SOURCE} className="h-full w-full object-cover" muted controls playsInline /> : null}
        {mediaType === "image" && hasRenderableMedia ? <img src={mediaSource} alt={camera.camera_name} className="h-full w-full object-cover" /> : null}
        {showSyntheticPov ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_32%,rgba(53,213,255,.2),transparent_26%),linear-gradient(135deg,#101a35,#070a18_62%,#160b2b)]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px] opacity-25" />
            <div className="absolute left-8 top-12 rounded-2xl border border-cyan/20 bg-cyan/10 px-4 py-3 text-sm font-bold text-cyan">Synthetic POV Fallback</div>
            <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan/35 bg-cyan/10 text-cyan shadow-glow">
              <Bot size={54} />
            </div>
            <div className="absolute bottom-14 left-8 right-8 h-20 rounded-t-[50%] bg-gradient-to-t from-slate-950 to-transparent opacity-80" />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_92%,rgba(53,213,255,.18)_93%),linear-gradient(90deg,transparent_92%,rgba(53,213,255,.12)_93%)] [background-size:36px_36px]" />
        <div className="absolute left-4 top-4 rounded-full border border-green/40 bg-green/15 px-3 py-1 text-xs font-bold text-green">ROBOT POV</div>
        <div className="absolute right-4 top-4 rounded-full border border-cyan/40 bg-cyan/15 px-3 py-1 text-xs font-bold text-cyan">{camera.stream_type}</div>
        {overlay !== "none" ? <div className={`absolute ${overlay === "offline" ? "inset-8 grid place-items-center" : "left-[28%] top-[28%] h-28 w-44"} rounded-2xl border-2 ${overlay === "warning_marker" || overlay === "offline" ? "border-danger bg-danger/15 text-danger" : overlay === "success_marker" ? "border-green bg-green/15 text-green" : "border-cyan bg-cyan/10 text-cyan"} p-4 text-center font-bold`}>{overlay}</div> : null}
        <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-950/75 p-3 text-xs"><span>Battery {camera.battery_percent}%</span><span>{camera.signal_strength}</span><span>{camera.current_action}</span></div>
      </div>
    </Card>
  );
}

function CameraEventFeed({ cameraId }: { cameraId?: string }) {
  const events = cameraId ? getCameraEvents(cameraEvents as CameraEvent[], cameraId).slice(-6).reverse() : (cameraEvents as CameraEvent[]).slice(-8).reverse();
  return <Card className="p-4"><div className="mb-3 font-bold">Live Event Feed</div><EventList events={events} /></Card>;
}

function EventLogPage({ compact = false }: { compact?: boolean }) {
  const events = [...(cameraEvents as CameraEvent[])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return <Card className="p-4"><div className="mb-3 flex items-center justify-between"><b>Event Log</b><span className="text-xs text-cyan">{events.length} events</span></div><EventList events={compact ? events.slice(0, 6) : events} /></Card>;
}

function EventList({ events }: { events: CameraEvent[] }) {
  return <div className="space-y-2">{events.map((event) => <div key={event.event_id} className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm md:grid-cols-[170px_1fr_120px]"><span className="text-slate-400">{event.timestamp.slice(11, 19)}</span><span><b>{event.event_name}</b><span className="ml-2 text-slate-400">{event.zone}</span></span><StatusBadge status={event.severity === "success" ? "success" : event.severity} /></div>)}</div>;
}

function AlertsPage() {
  return <div className="grid gap-4">{robotAlerts.map((alert) => <Card key={alert.alert_id} className="grid gap-3 p-4 md:grid-cols-[150px_1fr_180px_140px]"><StatusBadge status={alert.severity} /><div><b>{alert.message}</b><div className="text-sm text-slate-400">{alert.branch_id} / {alert.robot_id}</div></div><span>{alert.owner}</span><StatusBadge status={alert.status} /></Card>)}</div>;
}

function AnalyticsPage({ page }: { page: DashboardPage }) {
  const metrics = getKPIOverview();
  const funnel = getEngagementFunnel();
  const trend = getTrendReport();
  const zoneData = getZoneAnalytics();
  const insights = getCustomerInsight();
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.slice(0, 8).map((metric) => <MetricCard key={metric.metric_id} label={metric.label} value={metric.value} unit={metric.unit} status={metric.status} />)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Engagement Funnel</h2><div className="space-y-3">{funnel.map((step) => <div key={step.name}><div className="mb-1 flex justify-between text-sm"><span>{step.name}</span><span>{step.conversion}%</span></div><div className="h-3 rounded-full bg-slate-800"><div className="h-3 rounded-full bg-cyan" style={{ width: `${step.conversion}%` }} /></div></div>)}</div></Card>
        <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Trend & Report</h2><svg viewBox="0 0 500 190" className="h-56 w-full">{[40,80,120,160].map(y=><line key={y} x1="20" x2="480" y1={y} y2={y} stroke="#1d2c48" />)}<polyline points={trend.map((item, i) => `${30+i*130},${170-Number(item.sampling)*42}`).join(" ")} fill="none" stroke="#35d5ff" strokeWidth="5" strokeLinecap="round" /></svg></Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Zone Analytics</h2>{zoneData.map((zone) => <div key={zone.zone_id} className="mb-3 flex justify-between rounded-xl bg-white/5 p-3"><span>{zone.zone_name}</span><span className="text-green">{zone.conversion}%</span></div>)}</Card>
        <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Customer Insight</h2>{insights.map((insight) => <p key={insight.insight_id} className="mb-3 rounded-xl bg-white/5 p-3 text-sm text-slate-300">{insight.insight}</p>)}</Card>
        <Card className="p-5"><h2 className="mb-4 text-lg font-bold">Sales Impact / ROI</h2>{getCampaignROI().map((item) => <div key={item.campaign_id} className="mb-3 rounded-xl bg-white/5 p-3"><b>{item.campaign_name}</b><div className="text-sm text-slate-400">ROI {item.roi_score}x / uplift {item.sales_uplift}%</div></div>)}</Card>
      </div>
    </div>
  );
}

function CampaignsPage() {
  const impact = getSalesImpact();
  return <div className="grid gap-5 xl:grid-cols-2">{campaigns.map((campaign) => <Card key={campaign.campaign_id} className="p-5"><div className="flex items-start justify-between"><div><h2 className="text-2xl font-bold">{campaign.campaign_name}</h2><p className="text-slate-400">{campaign.campaign_name_th} / {campaign.theme}</p></div><StatusBadge status={campaign.status} /></div><div className="mt-5 grid gap-3 md:grid-cols-3"><MetricCard label="Target Conversion" value={campaign.target_conversion_percent} unit="%" /><MetricCard label="Branches" value={campaign.assigned_branch_ids.length} /><MetricCard label="Sales Uplift" value={impact.find((item) => item.campaign_id === campaign.campaign_id)?.sales_uplift_percent ?? 0} unit="%" /></div></Card>)}</div>;
}

function ScriptsPage() {
  return <div className="grid gap-5 xl:grid-cols-2">{scripts.map((script) => <Card key={script.script_id} className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">{script.title}</h2><StatusBadge status={script.status} /></div><p className="rounded-2xl bg-slate-950/45 p-4 leading-7 text-slate-300">{script.script_text}</p><div className="mt-3 text-sm text-slate-400">{script.language} / {script.duration_sec}s</div></Card>)}</div>;
}

function ZonesRoutesPage({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "space-y-4" : "grid gap-5 xl:grid-cols-2"}>{routes.map((route) => <Card key={route.route_id} className="p-5"><div className="flex justify-between gap-3"><div><h2 className="text-xl font-bold">{route.route_name}</h2><p className="text-sm text-slate-400">{route.branch_id} / {route.robot_id}</p></div><StatusBadge status={route.status} /></div><div className="mt-4 h-3 rounded-full bg-slate-800"><div className="h-3 rounded-full bg-green" style={{ width: `${route.readiness_percent}%` }} /></div><div className="mt-4 flex flex-wrap gap-2">{route.zone_sequence.map((zoneId) => <span key={zoneId} className="rounded-full bg-white/10 px-3 py-1 text-xs">{zones.find((zone) => zone.zone_id === zoneId)?.zone_name ?? zoneId}</span>)}</div></Card>)}</div>;
}

function DataScienceLabPage() {
  return <div className="space-y-5"><div className="flex w-fit items-center gap-2 rounded-full border border-purple/30 bg-purple/15 px-4 py-2 text-sm font-bold text-purple"><Rocket size={16} /> Owner-only Data Science Lab</div><div className="grid gap-5 xl:grid-cols-3">{dataScienceExperiments.map((exp) => <Card key={exp.experiment_id} className="p-5"><div className="text-sm text-cyan">{exp.type}</div><h2 className="mt-1 text-xl font-bold">{exp.title}</h2><div className="mt-4 grid grid-cols-2 gap-3"><MetricCard label="Control" value={exp.control_score} /><MetricCard label="Variant" value={exp.variant_score} /></div><div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-purple" style={{ width: `${exp.progress_percent}%` }} /></div></Card>)}</div><div className="grid gap-5 xl:grid-cols-2"><Card className="p-5"><h2 className="mb-4 text-lg font-bold">Model Performance</h2>{modelMetrics.map((metric) => <div key={metric.model_id} className="mb-3 flex justify-between rounded-xl bg-white/5 p-3"><span>{metric.model_name}</span><b>{metric.value}{metric.unit}</b></div>)}</Card><Card className="p-5"><h2 className="mb-4 text-lg font-bold">Sensor & Feature Summary</h2>{sensorLogs.map((log) => <div key={log.sensor_log_id} className="mb-3 rounded-xl bg-white/5 p-3 text-sm"><b>{log.sensor_type}</b> / {log.feature_name}: {log.value}{log.unit}</div>)}</Card></div></div>;
}

function SettingsPage() {
  return <div className="grid gap-5 xl:grid-cols-3"><Card className="p-5"><h2 className="text-xl font-bold">Profile Menu</h2><p className="mt-2 text-slate-400">Operator / Control Room</p></Card><Card className="p-5"><h2 className="text-xl font-bold">Demo Mode</h2><p className="mt-2 text-slate-400">Static JSON, no backend, HLS placeholder ready.</p></Card><Card className="p-5"><h2 className="text-xl font-bold">System Health</h2><p className="mt-2 text-green">All mock services ready</p></Card></div>;
}

function getKpiById(id: string) {
  return analyticsMetrics.find((metric) => metric.metric_id === id);
}
