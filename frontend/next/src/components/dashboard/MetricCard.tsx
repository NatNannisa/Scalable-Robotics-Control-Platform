import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/src/components/dashboard/DashboardCard";

export function MetricCard({
  label,
  value,
  unit,
  trend = 0,
  icon: Icon
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon: LucideIcon;
}) {
  const positive = trend >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${positive ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>
          <TrendIcon size={13} />
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="mt-5 text-xs font-medium text-slate-400">{label}</div>
      <div className="mt-1 flex items-end gap-1">
        <span className="text-3xl font-black text-white">{value}</span>
        {unit ? <span className="pb-1 text-sm text-cyan-100/70">{unit}</span> : null}
      </div>
    </GlassCard>
  );
}
