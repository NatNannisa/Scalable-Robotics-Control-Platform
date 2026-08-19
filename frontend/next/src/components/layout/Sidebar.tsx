import Link from "next/link";
import { BarChart3, Bot, BrainCircuit, Camera, FlaskConical, Gauge, Map, Megaphone, Route, ScrollText, Settings, ShieldAlert, Sparkles } from "lucide-react";
import { StatusBadge } from "@/src/components/dashboard/StatusBadge";

const groups = [
  {
    label: "Control Center",
    items: [
      { href: "/control-center", label: "Overview", icon: Gauge },
      { href: "/control-center/3d-store-map", label: "3D Store Map", icon: Map },
      { href: "/control-center/live-camera", label: "Live Camera", icon: Camera },
      { href: "/control-center/event-log", label: "Event Log", icon: ScrollText },
      { href: "/control-center/alerts", label: "Alerts", icon: ShieldAlert }
    ]
  },
  {
    label: "Analytics",
    items: [
      { href: "/analytics", label: "KPI Overview", icon: BarChart3 },
      { href: "/analytics/engagement-funnel", label: "Engagement Funnel", icon: Sparkles },
      { href: "/analytics/trend-report", label: "Trend Report", icon: BarChart3 },
      { href: "/analytics/zone-analytics", label: "Zone Analytics", icon: Map },
      { href: "/analytics/customer-insight", label: "Customer Insight", icon: BrainCircuit }
    ]
  },
  {
    label: "Management",
    items: [
      { href: "/management", label: "Campaigns", icon: Megaphone },
      { href: "/management/scripts", label: "Scripts", icon: ScrollText },
      { href: "/management/zones-routes", label: "Zones & Routes", icon: Route }
    ]
  },
  {
    label: "Lab",
    items: [
      { href: "/data-science-lab", label: "Data Science Lab", icon: FlaskConical },
      { href: "/settings", label: "Settings", icon: Settings }
    ]
  }
];

export function RobotSidebarCard() {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-100">
          <Bot size={23} />
        </div>
        <div>
          <div className="text-sm font-bold text-white">CP-BOT-01</div>
          <div className="text-xs text-slate-400">Frozen Food Patrol</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <StatusBadge status="live" />
        <span className="text-xs font-semibold text-cyan-100">82% Battery</span>
      </div>
    </div>
  );
}

export function Sidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-[#050a19]/90 p-5 backdrop-blur-xl xl:block">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-400 text-lg font-black text-slate-950 shadow-[0_0_36px_rgba(34,211,238,0.28)]">CP</div>
        <div>
          <div className="text-base font-black text-white">AI Robot</div>
          <div className="text-xs text-cyan-100/70">Control Room</div>
        </div>
      </div>
      <div className="mt-6">
        <RobotSidebarCard />
      </div>
      <nav className="mt-6 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = activePath === item.href || (item.href !== "/control-center" && activePath.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-cyan-300/12 text-white shadow-[0_0_24px_rgba(34,211,238,0.14)]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                  >
                    <Icon size={18} className={active ? "text-cyan-200" : ""} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
