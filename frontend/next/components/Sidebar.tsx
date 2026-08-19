import {
  Activity,
  BarChart3,
  Bot,
  Camera,
  Cpu,
  FileText,
  Gauge,
  Map,
  Megaphone,
  Radio,
  Route,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  TriangleAlert
} from "lucide-react";

export type PageKey =
  | "control-overview"
  | "store-map"
  | "live-camera"
  | "event-log"
  | "alerts"
  | "kpi-overview"
  | "engagement-funnel"
  | "trend-report"
  | "zone-analytics"
  | "customer-insight"
  | "campaigns"
  | "scripts"
  | "zones-routes"
  | "data-science-lab";

const navGroups = [
  {
    label: "Control Center",
    items: [
      ["control-overview", "ศูนย์ควบคุม", Activity],
      ["store-map", "3D Store Map", Map],
      ["live-camera", "Live Camera", Camera],
      ["event-log", "Event Log", FileText],
      ["alerts", "Alert", TriangleAlert]
    ]
  },
  {
    label: "Analytics",
    items: [
      ["kpi-overview", "KPI Overview", Gauge],
      ["engagement-funnel", "Engagement Funnel", BarChart3],
      ["trend-report", "Trend & Report", Radio],
      ["zone-analytics", "Zone Analytics", Radio],
      ["customer-insight", "Customer Insight", Bot]
    ]
  },
  {
    label: "Management",
    items: [
      ["campaigns", "Campaigns", Megaphone],
      ["scripts", "Scripts", Cpu],
      ["zones-routes", "Zones & Routes", Route]
    ]
  },
  {
    label: "Private",
    items: [["data-science-lab", "Data Science Lab", SlidersHorizontal]]
  }
] as const;

export const pageTitles: Record<PageKey, { title: string; subtitle: string; group: string }> = {
  "control-overview": { title: "ศูนย์ควบคุมหุ่นยนต์", subtitle: "ระบบเฝ้าระวังและควบคุมการทำงานแบบเรียลไทม์", group: "Control Center" },
  "store-map": { title: "3D Store Map", subtitle: "แผนที่สาขา เส้นทางเดิน และตำแหน่งหุ่นยนต์", group: "Control Center" },
  "live-camera": { title: "Live Camera", subtitle: "มุมมองสดจากหุ่นยนต์และสาขาที่ปักหมุด", group: "Control Center" },
  "event-log": { title: "Event Log", subtitle: "เหตุการณ์เรียลไทม์แยกตามสาขาและหุ่นยนต์", group: "Control Center" },
  alerts: { title: "Alert", subtitle: "รายการแจ้งเตือนที่ต้องติดตามและผู้รับผิดชอบ", group: "Control Center" },
  "kpi-overview": { title: "Analytics", subtitle: "ภาพรวมประสิทธิภาพหุ่นยนต์ AI และผลลัพธ์ทางธุรกิจ", group: "Analytics" },
  "engagement-funnel": { title: "Engagement Funnel", subtitle: "เส้นทางลูกค้าจากการตรวจจับจนถึงสัญญาณการซื้อ", group: "Analytics" },
  "trend-report": { title: "Trend & Report", subtitle: "แนวโน้มรายวัน รายสัปดาห์ และการเทียบสาขา", group: "Analytics" },
  "zone-analytics": { title: "Zone Analytics", subtitle: "โซนที่สร้าง engagement และ sampling conversion สูงสุด", group: "Analytics" },
  "customer-insight": { title: "Customer Insight", subtitle: "ช่วงเวลา สินค้า และพฤติกรรมลูกค้าที่น่าสนใจ", group: "Analytics" },
  campaigns: { title: "Management", subtitle: "บริหารจัดการแคมเปญ สคริปต์ และเส้นทางหุ่นยนต์", group: "Management" },
  scripts: { title: "Scripts", subtitle: "สคริปต์ภาษาไทยสำหรับหุ่นยนต์และสถานะการอนุมัติ", group: "Management" },
  "zones-routes": { title: "Zones & Routes", subtitle: "ความพร้อมของเส้นทาง ลำดับโซน และ preview สาขา", group: "Management" },
  "data-science-lab": { title: "Data Science Lab", subtitle: "วิจัย พัฒนา และปรับปรุงหุ่นยนต์ด้วยข้อมูลและโมเดล", group: "Private Lab" }
};

export default function Sidebar({ activePage, onNavigate }: { activePage: PageKey; onNavigate: (page: PageKey) => void }) {
  return (
    <aside className="hidden min-h-screen w-[286px] shrink-0 border-r border-slate-800/80 bg-[#061124]/95 p-4 xl:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-amber bg-gradient-to-br from-[#fce14f] to-[#ed3138] text-lg font-black text-[#8a1018]">
          CP
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight">CP Hypermarket</div>
          <div className="text-xs uppercase text-slate-400">Robot Control Room</div>
        </div>
      </div>

      <nav className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</div>
            <div className="space-y-1">
              {group.items.map(([key, label, Icon]) => {
                const active = activePage === key;
                return (
                  <button
                    key={key}
                    onClick={() => onNavigate(key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                      active
                        ? "border border-blue-400/30 bg-blue-600/35 text-white shadow-glow"
                        : "border border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-slate-900/70 hover:text-white"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-cyan" : "text-slate-400"} />
                    {label}
                    {key === "alerts" ? <span className="ml-auto rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">3</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-8 rounded-xl border border-green/20 bg-green/10 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <ShieldAlert size={16} className="text-green" />
          ระบบทั้งหมดปกติ
        </div>
        {["Vision AI", "Route Engine", "Script Player"].map((item) => (
          <div key={item} className="flex items-center justify-between border-t border-slate-800 py-2 text-xs">
            <span className="text-slate-400">{item}</span>
            <span className="text-green">Online</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/55 p-4 text-sm text-slate-300">
        <Settings size={15} />
        <div>
          <div className="font-semibold text-white">Operator</div>
          <div className="text-xs text-slate-500">Control Room</div>
        </div>
      </div>
    </aside>
  );
}
