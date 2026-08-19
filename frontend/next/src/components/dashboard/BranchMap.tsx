import { cn } from "@/src/lib/utils";

export interface Coordinate {
  x: number;
  y: number;
}

export interface MapZone {
  id: string;
  label: string;
  kind?: "traffic" | "engagement" | "service" | "checkout" | "storage" | "restricted";
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface StoreMapData {
  branchId: string;
  floorId: string;
  zones: MapZone[];
  robotPosition?: Coordinate;
  plannedRoute: Coordinate[];
  completedRoute: Coordinate[];
  blockedPoints: Coordinate[];
  lastUpdated?: string;
}

export type BranchMapState = "live" | "stale" | "offline" | "no-data";

interface BranchMapProps {
  data?: StoreMapData | null;
  state?: BranchMapState;
  branchLabel?: string;
  className?: string;
}

const stateCopy: Record<BranchMapState, { label: string; message: string }> = {
  live: { label: "Live Map", message: "" },
  stale: { label: "Stale Data", message: "รอข้อมูลล่าสุดจากสาขา" },
  offline: { label: "Offline", message: "สาขานี้ไม่มี live data ชั่วคราว" },
  "no-data": { label: "No Map Data", message: "ยังไม่มีแผนที่สำหรับสาขานี้" }
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function pointsToPath(points: Coordinate[]) {
  if (!points.length) return "";
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${clamp(point.x)} ${clamp(point.y)}`)
    .join(" ");
}

function zoneTone(kind?: MapZone["kind"]) {
  if (kind === "checkout") return "fill-emerald-400/10 stroke-emerald-300/30";
  if (kind === "restricted") return "fill-red-400/10 stroke-red-300/30";
  if (kind === "service" || kind === "storage") return "fill-violet-400/10 stroke-violet-300/30";
  if (kind === "traffic") return "fill-cyan-400/10 stroke-cyan-300/25";
  return "fill-blue-400/10 stroke-blue-300/25";
}

export function BranchMap({ data, state = "live", branchLabel, className = "" }: BranchMapProps) {
  const effectiveState: BranchMapState = data ? state : "no-data";
  const idBase = `branch-map-${data?.branchId ?? branchLabel ?? "empty"}-${data?.floorId ?? "floor"}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const gridId = `${idBase}-grid`;
  const glowId = `${idBase}-glow`;
  const disabled = effectiveState === "offline" || effectiveState === "no-data";
  const plannedPath = data ? pointsToPath(data.plannedRoute) : "";
  const completedPath = data ? pointsToPath(data.completedRoute) : "";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        disabled ? "opacity-75" : "",
        className
      )}
      aria-label={branchLabel ? `${branchLabel} compact store map` : "Compact store map"}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-100/70">Selected Branch</div>
          <div className="text-sm font-bold text-white">{branchLabel ?? data?.branchId ?? "Branch map"}</div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-bold",
            effectiveState === "live" ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100" : "",
            effectiveState === "stale" ? "border-amber-300/30 bg-amber-400/10 text-amber-100" : "",
            disabled ? "border-slate-300/20 bg-slate-500/10 text-slate-300" : ""
          )}
        >
          {stateCopy[effectiveState].label}
        </span>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.18),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(2,6,23,0.98))]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" role="img" aria-label="Store route map">
          <defs>
            <pattern id={gridId} width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(125, 211, 252, 0.12)" strokeWidth="0.35" />
            </pattern>
            <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="3" y="6" width="94" height="88" rx="7" fill="rgba(15, 23, 42, 0.46)" stroke="rgba(125, 211, 252, 0.22)" />
          <rect x="3" y="6" width="94" height="88" rx="7" fill={`url(#${gridId})`} />

          {data?.zones.map((zone) => (
            <g key={zone.id}>
              <rect
                x={clamp(zone.bounds.x)}
                y={clamp(zone.bounds.y)}
                width={Math.max(1, zone.bounds.width)}
                height={Math.max(1, zone.bounds.height)}
                rx="2.5"
                className={zoneTone(zone.kind)}
                strokeWidth="0.7"
              />
              <text x={clamp(zone.bounds.x + 2)} y={clamp(zone.bounds.y + 5)} fill="rgba(226, 232, 240, 0.82)" fontSize="3.1" fontWeight="700">
                {zone.label}
              </text>
            </g>
          ))}

          {plannedPath ? (
            <path d={plannedPath} fill="none" stroke="rgba(96, 165, 250, 0.48)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />
          ) : null}
          {completedPath ? (
            <path d={completedPath} fill="none" stroke="rgba(45, 212, 191, 0.92)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />
          ) : null}

          {data?.plannedRoute.map((point, index) => (
            <circle key={`${point.x}-${point.y}-${index}`} cx={clamp(point.x)} cy={clamp(point.y)} r="1.4" fill="rgba(191, 219, 254, 0.78)" />
          ))}

          {data?.blockedPoints.map((point, index) => (
            <g key={`${point.x}-${point.y}-blocked-${index}`} transform={`translate(${clamp(point.x)} ${clamp(point.y)})`}>
              <circle r="3.1" fill="rgba(248, 113, 113, 0.18)" stroke="rgba(248, 113, 113, 0.82)" strokeWidth="0.8" />
              <path d="M -1.6 -1.6 L 1.6 1.6 M 1.6 -1.6 L -1.6 1.6" stroke="rgba(254, 226, 226, 0.95)" strokeWidth="0.7" strokeLinecap="round" />
            </g>
          ))}

          {data?.robotPosition ? (
            <g transform={`translate(${clamp(data.robotPosition.x)} ${clamp(data.robotPosition.y)})`}>
              <circle r="4.2" fill="rgba(34, 211, 238, 0.16)" stroke="rgba(103, 232, 249, 0.92)" strokeWidth="0.9" />
              <circle r="1.9" fill="rgba(240, 249, 255, 0.95)" />
            </g>
          ) : null}
        </svg>

        {disabled ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/62 px-6 text-center backdrop-blur-[1px]">
            <div>
              <div className="text-sm font-bold text-white">{stateCopy[effectiveState].label}</div>
              <div className="mt-1 text-xs text-slate-300">{stateCopy[effectiveState].message}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-300">
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-300" /> Planned</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-teal-300" /> Completed</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-300" /> Blocked</span>
        {data?.lastUpdated ? <span className="ml-auto text-slate-400">Updated {data.lastUpdated}</span> : null}
      </div>
    </section>
  );
}
