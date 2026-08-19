import { getStatusTone, getStatusLabel } from "@/src/lib/statusRules";

const toneClasses: Record<string, string> = {
  cyan: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
  green: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  red: "border-red-300/25 bg-red-400/10 text-red-100",
  purple: "border-violet-300/25 bg-violet-400/10 text-violet-100",
  slate: "border-slate-300/20 bg-slate-400/10 text-slate-200"
};

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const tone = getStatusTone(status);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${toneClasses[tone] ?? toneClasses.slate}`}>
      {label ?? getStatusLabel(status)}
    </span>
  );
}
