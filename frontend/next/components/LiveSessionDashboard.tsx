"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Battery,
  Bot,
  Camera,
  CheckCircle2,
  Clock,
  Gauge,
  PackageCheck,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import Sidebar, { type PageKey } from "@/components/Sidebar";
import TopSessionBar from "@/components/TopSessionBar";
import ThreeDStoreMap from "@/components/ThreeDStoreMap";
import KPICard from "@/components/KPICard";
import LiveCameraPanel from "@/components/LiveCameraPanel";
import LiveEventLog from "@/components/LiveEventLog";
import RobotStatusCard from "@/components/RobotStatusCard";
import { ActiveCampaignCard, CurrentScriptCard } from "@/components/CampaignCards";
import RecentInteractions from "@/components/RecentInteractions";
import RobotAsset from "@/components/RobotAsset";
import {
  getActiveCampaign,
  getCurrentRobotState,
  getEngagementTrend,
  getExecutiveKPIs,
  getFunnelData,
  getLiveEventFeed,
  getProductPerformance,
  getRoutePositions,
  getSafetyEvents,
  getZonePerformance
} from "@/src/lib/analytics";

const robotLiveStats: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "หุ่นยนต์ออนไลน์", value: "2/2", icon: Bot },
  { label: "ความเร็วเฉลี่ย", value: "0.85 m/s", icon: Gauge },
  { label: "แบตเตอรี่เฉลี่ย", value: "78%", icon: Battery },
  { label: "สัญญาณ", value: "ดีเยี่ยม", icon: Radio }
];
const branchMockData = [
  { id: "01", name: "CP Hypermarket สาขาแจ้งวัฒนะ", status: "พร้อมใช้งาน", route: "ทางเข้า → ของว่าง → เครื่องดื่ม → แคชเชียร์", schedule: "10:00 - 21:00", interval: "ทุก 45 นาที" },
  { id: "02", name: "CP Hypermarket สาขาลาดพร้าว", status: "พร้อมใช้งาน", route: "ทางเข้า → Fresh & Food → Promotion Zone", schedule: "10:00 - 21:00", interval: "ทุก 45 นาที" },
  { id: "03", name: "CP Hypermarket สาขาพระราม 2", status: "พร้อมใช้งาน", route: "ทางเข้า → Mini Corner → Beverage Zone", schedule: "10:00 - 21:00", interval: "ทุก 45 นาที" },
  { id: "04", name: "CP Hypermarket สาขาเชียงใหม่", status: "รอปรับปรุง", route: "ทางเข้า → ของว่าง → เครื่องดื่ม", schedule: "11:00 - 20:00", interval: "ทุก 60 นาที" }
];
const alertMockData = [
  { level: "critical", title: "Robot 02 route blocked", branch: "CP Hypermarket พระราม 2", owner: "Operation Team", status: "Open" },
  { level: "warning", title: "Battery under 30%", branch: "CP Hypermarket บางนา", owner: "Store Lead", status: "Monitoring" },
  { level: "info", title: "Route completed", branch: "CP Hypermarket แจ้งวัฒนะ", owner: "Control Room", status: "Closed" }
];
const scriptMockData = [
  { title: "สคริปต์แนะนำสินค้า (Sampling)", campaign: "Shrimpy Joy", status: "active", text: "สวัสดีครับ วันนี้มีสินค้าพิเศษจาก CP ให้ลองชิมฟรี สนใจรับตัวอย่างและดูโปรโมชันเพิ่มเติมไหมครับ?", duration: "20 วินาที" },
  { title: "สคริปต์เชิญชวนร่วมสนุก", campaign: "Mission to Space", status: "active", text: "พร้อมออกเดินทางไปกับภารกิจอวกาศ CP แล้วหรือยังครับ? มาร่วมกิจกรรมสั้น ๆ กับหุ่นยนต์ของเราได้เลยครับ", duration: "18 วินาที" },
  { title: "สคริปต์ตอบคำถามสินค้า", campaign: "Shrimpy Joy", status: "pending approval", text: "สินค้านี้เหมาะกับการทานเป็นของว่าง รสชาติเข้มข้น และมีโปรโมชันเฉพาะสัปดาห์นี้ครับ", duration: "22 วินาที" },
  { title: "สคริปต์ปิดการสนทนา", campaign: "All Campaigns", status: "active", text: "ขอบคุณครับ สามารถดูสินค้าเพิ่มเติมได้ที่ชั้นวางด้านหน้า และขอให้ช้อปปิ้งอย่างสนุกนะครับ", duration: "12 วินาที" }
];
const labExperimentMockData = [
  { type: "A/B Test", title: "ทดสอบสคริปต์เชิญชวนลูกค้า", score: "Conversion 27.6% / 31.8%", progress: 72 },
  { type: "Optimization", title: "ปรับเส้นทางการเดิน (Route)", score: "Efficiency Score 85.6", progress: 68 },
  { type: "Model Tuning", title: "ปรับจูนการตรวจจับลูกค้า", score: "mAP@0.5 92.4%", progress: 54 }
];

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`control-card rounded-xl ${className}`}>{children}</section>;
}

function PanelHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {action ? <span className="text-xs font-semibold text-cyan">{action} ›</span> : null}
    </div>
  );
}

function MiniSparkline({ tone = "cyan" }: { tone?: "cyan" | "green" | "purple" | "amber" }) {
  const color = tone === "green" ? "#31e981" : tone === "purple" ? "#9c6cff" : tone === "amber" ? "#f6b743" : "#35d5ff";
  return (
    <svg viewBox="0 0 160 54" className="h-14 w-full" aria-hidden>
      <path d="M4 45 C22 10 35 50 52 25 S78 19 94 10 S120 44 156 13" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M4 52 C22 18 35 54 52 32 S78 26 94 18 S120 48 156 22 L156 54 L4 54 Z" fill={color} opacity=".12" />
    </svg>
  );
}

function MetricTile({ icon: Icon, title, value, change, tone = "cyan" }: { icon: LucideIcon; title: string; value: string; change: string; tone?: "cyan" | "green" | "purple" | "amber" }) {
  const toneClasses = {
    cyan: "bg-blue-500/15 text-cyan",
    green: "bg-green/15 text-green",
    purple: "bg-purple/15 text-purple",
    amber: "bg-amber/15 text-amber"
  };
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-full ${toneClasses[tone]}`}>
          <Icon size={22} />
        </div>
        <MiniSparkline tone={tone} />
      </div>
      <div className="mt-2 text-sm text-slate-300">{title}</div>
      <div className="mt-1 text-3xl font-bold text-white">{value}</div>
      <div className="mt-2 text-sm font-semibold text-green">↑ {change}</div>
    </Panel>
  );
}

function RobotLiveView() {
  return (
    <div className="relative min-h-[380px] overflow-hidden rounded-b-xl bg-[#101827]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px] opacity-25" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-red-600/35 via-amber/15 to-transparent" />
      <div className="absolute left-8 top-8 rounded-xl border border-amber/30 bg-red-600/80 px-5 py-3 text-3xl font-black text-white shadow-danger">CP</div>
      <div className="absolute right-8 top-10 rounded-lg border border-red-400/40 bg-red-500/70 px-5 py-2 text-xl font-bold text-white">ลูกค้าจริง ประหยัดจริง</div>
      <div className="absolute inset-x-8 bottom-0 h-32 rounded-t-[48px] bg-gradient-to-t from-slate-950 via-slate-800 to-transparent opacity-90" />
      <div className="absolute bottom-10 left-12 h-44 w-48 rounded-xl border border-slate-600 bg-slate-900/80 shadow-glow" />
      <div className="absolute bottom-10 right-14 h-44 w-48 rounded-xl border border-slate-600 bg-slate-900/80 shadow-glow" />
      <RobotAsset variant="shrimpyJoy" size="lg" priority className="absolute bottom-5 left-[23%] h-72 w-56" />
      <RobotAsset variant="missionToSpace" size="lg" priority className="absolute bottom-7 right-[20%] h-64 w-52" />
      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-3 rounded-xl border border-slate-700/70 bg-[#071124]/90 p-3">
        {robotLiveStats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 border-r border-slate-800 last:border-r-0">
            <Icon className="text-cyan" size={30} />
            <div>
              <div className="text-xs text-slate-400">{label}</div>
              <div className="text-2xl font-bold text-white">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BranchMiniMap() {
  return (
    <div className="relative h-48 overflow-hidden rounded-b-xl bg-[#101733]">
      <div className="absolute inset-3 rounded border border-blue-300/25 bg-[linear-gradient(90deg,rgba(70,117,180,.28)_1px,transparent_1px),linear-gradient(0deg,rgba(70,117,180,.28)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute left-[38%] top-[26%] h-16 w-16 rounded-full border-4 border-blue-400 bg-blue-500/20 text-center text-lg font-bold leading-[56px] text-white shadow-glow">01</div>
      <div className="absolute right-[20%] top-[45%] h-16 w-16 rounded-full border-4 border-purple bg-purple/20 text-center text-lg font-bold leading-[56px] text-white">02</div>
      <div className="absolute left-[42%] top-[56%] h-3 w-3 rounded-full bg-green shadow-live" />
      <div className="absolute right-[24%] top-[74%] h-3 w-3 rounded-full bg-purple" />
      <div className="absolute inset-x-16 top-[52%] h-0.5 bg-cyan/55" />
    </div>
  );
}

function ControlCenterPage({ page, state, events }: { page: PageKey; state: ReturnType<typeof getCurrentRobotState>; events: ReturnType<typeof getLiveEventFeed> }) {
  if (page === "store-map") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
          <ThreeDStoreMap route={getRoutePositions()} safetyActive={state.safetyStatus === "Warning"} />
          <div className="space-y-4">
            <RobotStatusCard state={state} />
            <LiveEventLog events={events.slice(-7)} />
          </div>
        </div>
        <RoutePreviewCards />
      </div>
    );
  }

  if (page === "live-camera") {
    return (
      <div className="grid gap-4 xl:grid-cols-3">
        {["Robot 01 • Shrimp Joy", "Robot 02 • Mission to Space", "Branch Camera • แจ้งวัฒนะ"].map((title, index) => (
          <Panel key={title} className="overflow-hidden">
            <PanelHeader title={title} action="LIVE" />
            <div className="p-4">
              <LiveCameraPanel state={{ ...state, robotId: `ROBOT-0${index + 1}`, currentZone: index === 0 ? "Fresh & Food" : "Promotion Zone" }} />
            </div>
          </Panel>
        ))}
      </div>
    );
  }

  if (page === "event-log") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel>
          <PanelHeader title="เหตุการณ์ทั้งหมด" action="Filter" />
          <div className="p-4">
            <LiveEventLog events={events} />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="แผนที่สาขา" action="ดูแผนที่ 3D" />
          <BranchMiniMap />
        </Panel>
      </div>
    );
  }

  if (page === "alerts") {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel>
          <PanelHeader title="Operational Alerts" action="Assign owner" />
          <div className="space-y-3 p-4">
            {alertMockData.map(({ level, title, branch, owner, status }) => (
              <div key={title} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/45 p-4 md:grid-cols-[120px_1fr_150px_110px]">
                <span className={`rounded-lg px-3 py-2 text-center text-xs font-bold uppercase ${level === "critical" ? "bg-danger/15 text-danger" : level === "warning" ? "bg-amber/15 text-amber" : "bg-cyan/15 text-cyan"}`}>{level}</span>
                <div>
                  <div className="font-semibold text-white">{title}</div>
                  <div className="text-sm text-slate-400">{branch}</div>
                </div>
                <div className="text-sm text-slate-300">{owner}</div>
                <div className="text-sm text-green">{status}</div>
              </div>
            ))}
          </div>
        </Panel>
        <RobotStatusCard state={state} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 2xl:grid-cols-[1fr_490px]">
        <Panel className="overflow-hidden">
          <PanelHeader title="LIVE VIEW" action="ขยายภาพ" />
          <RobotLiveView />
        </Panel>
        <div className="space-y-4">
          <Panel>
            <PanelHeader title="กิจกรรมล่าสุด" action="ดูทั้งหมด" />
            <div className="p-4">
              <LiveEventLog events={events.slice(-6)} />
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="แผนที่สาขา (CP Hypermarket สาขาแจ้งวัฒนะ)" action="ดูแผนที่ 3D" />
            <BranchMiniMap />
          </Panel>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricTile icon={Users} title="จำนวนการเข้าหาลูกค้า" value="1,248" change="18.7%" />
        <MetricTile icon={Sparkles} title="Sampling Conversion" value="27.6%" change="6.4%" tone="purple" />
        <MetricTile icon={PackageCheck} title="สินค้าที่ได้รับความสนใจ" value="842" change="22.3%" tone="amber" />
        <MetricTile icon={TrendingUp} title="ยอดขายเพิ่มขึ้น" value="+14.2%" change="3.8%" tone="green" />
        <Panel className="p-4">
          <div className="text-sm text-slate-300">สาขาที่ผลงานดีที่สุด</div>
          <div className="mt-4 text-5xl">🏆</div>
          <div className="mt-2 text-lg font-bold text-white">CP Hypermarket แจ้งวัฒนะ</div>
          <div className="mt-1 text-3xl font-black text-amber">96.5<span className="text-base">/100</span></div>
        </Panel>
      </div>
    </div>
  );
}

function FunnelVisual() {
  const data = getFunnelData();
  const widths = ["100%", "78%", "58%", "42%", "30%"];
  const colors = ["bg-blue-500", "bg-purple", "bg-cyan", "bg-green", "bg-amber"];
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.name} className="grid grid-cols-[1fr_120px] items-center gap-4">
          <div className={`mx-auto rounded-lg py-3 text-center font-bold text-white ${colors[index]}`} style={{ width: widths[index] }}>{item.conversion}%</div>
          <div className="text-right text-sm text-slate-300">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPage({ page }: { page: PageKey }) {
  const zones = getZonePerformance();
  const products = getProductPerformance();
  const trend = getEngagementTrend();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <MetricTile icon={Users} title="จำนวนการเข้าหาลูกค้า" value="1,248" change="18.7%" />
        <MetricTile icon={Sparkles} title="Sampling Conversion" value="27.6%" change="6.4%" tone="purple" />
        <MetricTile icon={TrendingUp} title="ยอดขายเพิ่มขึ้น" value="+14.2%" change="3.8%" tone="green" />
        <MetricTile icon={PackageCheck} title="สินค้าที่ได้รับความสนใจ" value="842" change="22.3%" tone="amber" />
        <MetricTile icon={Gauge} title="ROI ของแคมเปญ" value="96.5%" change="12.1%" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.95fr_1.15fr]">
        <Panel className="p-5">
          <h2 className="mb-5 text-lg font-bold text-white">{page === "engagement-funnel" ? "Engagement Funnel" : "Engagement Funnel"}</h2>
          <FunnelVisual />
        </Panel>
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{page === "trend-report" ? "Trend & Report" : "Trend & Report"}</h2>
            <div className="rounded-lg bg-blue-600/30 px-3 py-1 text-xs text-white">รายวัน</div>
          </div>
          <svg viewBox="0 0 620 230" className="h-[260px] w-full" aria-label="Trend chart">
            {[40, 80, 120, 160, 200].map((y) => <line key={y} x1="30" x2="600" y1={y} y2={y} stroke="#1d2c48" />)}
            <path d="M45 170 L125 140 L205 158 L285 134 L365 132 L445 122 L560 112" fill="none" stroke="#258dff" strokeWidth="5" strokeLinecap="round" />
            <path d="M45 190 L125 162 L205 178 L285 150 L365 146 L445 136 L560 130" fill="none" stroke="#9c6cff" strokeWidth="5" strokeLinecap="round" />
            {trend.slice(0, 7).map((item, index) => <text key={item.time} x={45 + index * 82} y="222" fill="#94a3b8" fontSize="13">{item.time}</text>)}
          </svg>
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.1fr]">
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">{page === "zone-analytics" ? "Zone Analytics" : "Zone Analytics"}</h2>
          <div className="space-y-3">
            {zones.slice(0, 5).map((zone, index) => (
              <div key={zone.zone} className="grid grid-cols-[28px_1fr_120px] items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-500/20 text-sm text-white">{index + 1}</span>
                <span className="text-sm text-slate-300">{zone.zone}</span>
                <div className="h-3 rounded-full bg-slate-800"><div className="h-3 rounded-full bg-green" style={{ width: `${Math.max(20, zone.sampling_interest * 10)}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="relative overflow-hidden p-5">
          <h2 className="text-lg font-bold text-white">หุ่นยนต์ที่ทำผลงานดีที่สุด</h2>
          <div className="absolute bottom-3 left-5 grid h-52 w-44 place-items-center">
            <RobotAsset variant="duo" size="lg" className="h-52 w-44" />
          </div>
          <div className="ml-56 mt-6">
            <div className="text-xl font-bold text-white">CP Robo Joy</div>
            <div className="text-sm text-slate-400">ประสิทธิภาพรวม</div>
            <div className="mt-4 text-5xl font-black text-green">96.5</div>
            <div className="mt-3 rounded-lg bg-green/15 px-3 py-2 text-center text-sm font-bold text-green">ยอดเยี่ยม</div>
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">{page === "customer-insight" ? "Customer Insight" : "Customer Insight"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[["ช่วงเวลาที่ดีที่สุด", "16:00 - 19:00"], ["สาขาที่ดีที่สุด", "CP Hypermarket แจ้งวัฒนะ"], ["สินค้ายอดนิยม", products[0]?.product_name ?? "Shrimpy Joy"], ["ลูกค้ากลับมามีปฏิสัมพันธ์", "31.4%"]].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm text-green">{label}</div>
                <div className="mt-2 text-xl font-bold text-white">{value}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function RoutePreviewCards() {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {branchMockData.map((branch, index) => (
        <Panel key={branch.id} className="overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between">
              <div className="font-bold text-white">{branch.id} {branch.name}</div>
              <span className={`rounded px-2 py-1 text-xs font-bold ${branch.status === "รอปรับปรุง" ? "bg-amber/15 text-amber" : "bg-green/15 text-green"}`}>{branch.status}</span>
            </div>
          </div>
          <BranchMiniMap />
          <div className="grid grid-cols-2 border-t border-slate-800 text-sm text-slate-400">
            <div className="p-3">รอบเวลา<br /><b className="text-white">{branch.interval}</b></div>
            <div className="p-3">เวลาใช้งาน<br /><b className="text-white">{branch.schedule}</b></div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function ManagementPage({ page }: { page: PageKey }) {
  const activeCampaign = getActiveCampaign();
  if (page === "scripts") {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        {scriptMockData.map((script) => (
          <Panel key={script.title} className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <RobotAsset variant={script.campaign === "Mission to Space" ? "missionToSpace" : script.campaign === "Shrimpy Joy" ? "shrimpyJoy" : "mascot"} size="sm" className="h-14 w-14" />
                <h2 className="text-lg font-bold text-white">{script.title}</h2>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${script.status === "pending approval" ? "bg-amber/15 text-amber" : "bg-green/15 text-green"}`}>{script.status}</span>
            </div>
            <p className="rounded-xl border border-slate-800 bg-slate-950/45 p-4 leading-7 text-slate-300">{script.text}</p>
            <div className="mt-4 flex gap-3 text-xs text-slate-400"><span>{script.campaign}</span><span>{script.duration}</span><span>TH</span></div>
          </Panel>
        ))}
      </div>
    );
  }

  if (page === "zones-routes") return <RoutePreviewCards />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.25fr_.65fr_.85fr]">
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">แคมเปญปัจจุบัน</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {["Shrimpy Joy", "Mission to Space"].map((name) => (
              <div key={name} className="relative min-h-64 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/45 p-4">
                <div className="text-xl font-bold text-white">{name}</div>
                <div className="text-sm text-slate-300">{name === "Shrimpy Joy" ? "ซื้อ 2 แถม 1" : "ภารกิจอวกาศ CP"}</div>
                <span className="mt-4 inline-block rounded bg-green/20 px-3 py-2 text-sm font-bold text-green">กำลังดำเนินการ</span>
                <RobotAsset variant={name === "Shrimpy Joy" ? "shrimpyJoy" : "missionToSpace"} size="lg" className="absolute bottom-1 right-3 h-56 w-44" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">สถานะการอนุมัติ</h2>
          {["แผนแคมเปญ", "สคริปต์หุ่นยนต์", "เส้นทาง & โซน", "เนื้อหา & สื่อ"].map((item, index) => (
            <div key={item} className="flex items-center justify-between border-b border-slate-800 py-3 text-sm">
              <span className="text-slate-300">{item}</span>
              <span className={index === 2 ? "text-amber" : "text-green"}>{index === 2 ? "รออนุมัติ" : "อนุมัติแล้ว"}</span>
            </div>
          ))}
          <div className="mt-5 h-3 rounded-full bg-slate-800"><div className="h-3 w-3/4 rounded-full bg-green" /></div>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">สาขาที่ได้รับมอบหมาย</h2>
          {branchMockData.map((branch) => (
            <div key={branch.id} className="flex justify-between rounded-lg bg-slate-950/40 px-3 py-2 text-sm">
              <span className="text-slate-300">{branch.id} {branch.name}</span>
              <span className={branch.status === "พร้อมใช้งาน" ? "text-green" : "text-slate-500"}>{branch.status === "พร้อมใช้งาน" ? "ใช้งานอยู่" : "รอเตรียม"}</span>
            </div>
          ))}
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <ActiveCampaignCard campaign={activeCampaign} />
          <CurrentScriptCard campaign={activeCampaign} />
        </div>
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">ความพร้อมของเส้นทาง</h2>
          <div className="mx-auto grid h-44 w-44 place-items-center rounded-full border-[20px] border-green text-4xl font-black text-white">12</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm"><span className="text-green">พร้อม 8</span><span className="text-amber">ปรับปรุง 3</span><span className="text-danger">ไม่พร้อม 1</span></div>
        </Panel>
      </div>
      <RoutePreviewCards />
    </div>
  );
}

function DataScienceLabPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3">
        {labExperimentMockData.map((experiment) => (
          <Panel key={experiment.title} className="relative min-h-56 overflow-hidden p-5">
            <div className="text-sm text-slate-400">{experiment.type}</div>
            <h2 className="mt-1 text-xl font-bold text-white">{experiment.title}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300"><span>Score<br /><b className="text-2xl text-white">{experiment.score}</b></span><span>ความคืบหน้า<br /><b className="text-2xl text-white">{experiment.progress}%</b></span></div>
            <div className="mt-5 h-2 w-1/2 rounded bg-slate-800"><div className="h-2 rounded bg-blue-500" style={{ width: `${experiment.progress}%` }} /></div>
            <RobotAsset variant="duo" size="md" className="absolute bottom-3 right-5 h-36 w-32" />
          </Panel>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">ประสิทธิภาพโมเดล</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[["Detection Accuracy", "92.4%"], ["Engagement Prediction", "78.6%"], ["Route Success Rate", "94.1%"], ["Avg. Interaction Time", "47.3 วิ"]].map(([label, value], index) => (
              <Panel key={label} className="p-4">
                <div className="text-sm text-slate-300">{label}</div>
                <div className="mt-3 text-3xl font-bold text-white">{value}</div>
                <MiniSparkline tone={index === 1 ? "purple" : "cyan"} />
              </Panel>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">การจำลองและวิเคราะห์พื้นที่</h2>
          <BranchMiniMap />
          <div className="grid grid-cols-3 divide-x divide-slate-800 text-center text-sm text-slate-400"><div className="p-3"><b className="block text-2xl text-white">12</b>Hotspots</div><div className="p-3"><b className="block text-2xl text-white">18.7%</b>Traffic</div><div className="p-3"><b className="block text-2xl text-white">3</b>Zones</div></div>
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">ข้อมูลเซ็นเซอร์และฟีเจอร์</h2>
          {["LIDAR 360° ระยะเฉลี่ย 2.31 m", "Camera RGB ตรวจจับ 3 คน", "Depth Sensor ระยะ 1.67 m", "Microphone เสียงรบกวน 42 dB"].map((item) => <div key={item} className="border-b border-slate-800 py-3 text-sm text-slate-300">{item}</div>)}
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 text-lg font-bold text-white">Notebook & Insights</h2>
          {["การใช้สคริปต์แบบเน้นโปรโมชัน จะเพิ่ม Conversion มากกว่าสคริปต์ทั่วไป", "การลดระยะทางเฉลี่ยต่อภารกิจ จะเพิ่มจำนวนการมีส่วนร่วม", "โมเดลตรวจจับลูกค้าช่วงเย็นแม่นยำกว่าช่วงเช้า"].map((item, index) => <div key={item} className="rounded-lg border border-slate-800 bg-slate-950/45 p-4 text-sm text-slate-300">H{index + 1} · {item}</div>)}
        </Panel>
      </div>
    </div>
  );
}

export default function LiveSessionDashboard() {
  const allEvents = useMemo(() => getLiveEventFeed(), []);
  const [activePage, setActivePage] = useState<PageKey>("control-overview");
  const [eventIndex, setEventIndex] = useState(6);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const stream = window.setInterval(() => {
      setEventIndex((index) => (index + 1 >= allEvents.length ? 6 : index + 1));
    }, 2800);
    return () => window.clearInterval(stream);
  }, [allEvents.length]);

  const visibleEvents = allEvents.slice(0, eventIndex + 1);
  const currentState = getCurrentRobotState(eventIndex);
  const kpis = getExecutiveKPIs();
  const startTime = new Date("2026-06-08T16:00:05+07:00").getTime();
  const uptime = formatDuration(Math.max(0, Math.floor((now - startTime) / 1000)));

  return (
    <div className="flex min-h-screen bg-background text-slate-100">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="min-w-0 flex-1">
        <TopSessionBar uptime={uptime} activePage={activePage} />
        <div className="space-y-4 p-4 2xl:p-5">
          {activePage.startsWith("control") || ["store-map", "live-camera", "event-log", "alerts"].includes(activePage) ? (
            <ControlCenterPage page={activePage} state={currentState} events={visibleEvents} />
          ) : null}
          {["kpi-overview", "engagement-funnel", "trend-report", "zone-analytics", "customer-insight"].includes(activePage) ? <AnalyticsPage page={activePage} /> : null}
          {["campaigns", "scripts", "zones-routes"].includes(activePage) ? <ManagementPage page={activePage} /> : null}
          {activePage === "data-science-lab" ? <DataScienceLabPage /> : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KPICard label="Customers Detected" value={kpis.customersDetected} detail="Live detections from robots" icon={Users} tone="cyan" />
            <KPICard label="Sampling Interest" value={kpis.samplingInterest} detail="Customer interest signals" icon={Sparkles} tone="green" />
            <KPICard label="Route Completion" value={`${kpis.routeCompletion}%`} detail="Completed route points" icon={Route} tone="cyan" />
            <KPICard label="Safety Alerts" value={getSafetyEvents().length} detail="Warnings requiring review" icon={AlertTriangle} tone="amber" />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <RecentInteractions />
            <Panel className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-slate-300"><ShieldCheck size={16} className="text-green" /> Demo Stability</div>
              <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                <span className="rounded-lg border border-slate-800 bg-slate-950/45 p-3"><CheckCircle2 size={16} className="mr-2 inline text-green" /> Static mock data</span>
                <span className="rounded-lg border border-slate-800 bg-slate-950/45 p-3"><Zap size={16} className="mr-2 inline text-cyan" /> Client-side live simulation</span>
                <span className="rounded-lg border border-slate-800 bg-slate-950/45 p-3"><Camera size={16} className="mr-2 inline text-purple" /> Reference-led visuals</span>
                <span className="rounded-lg border border-slate-800 bg-slate-950/45 p-3"><Clock size={16} className="mr-2 inline text-amber" /> No backend required</span>
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
