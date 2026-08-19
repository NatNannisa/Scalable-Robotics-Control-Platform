import type { BranchSnapshot } from "@/src/branch-monitor/types";

export function AdapterHealthPanel({ snapshot }: { snapshot: BranchSnapshot }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.065] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_60px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Adapter Health</h2>
        <span className="rounded-full border border-cyan/30 bg-cyan/15 px-3 py-1 text-xs font-bold uppercase text-cyan">{snapshot.branch.adapterHealth}</span>
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-3">
        <HealthMetric label="Unified CP API" value={snapshot.branch.adapterHealth} />
        <HealthMetric label="Events Sync" value={`${snapshot.events.length} events`} />
        <HealthMetric label="Open Tickets" value={`${snapshot.tickets.filter((ticket) => ticket.status !== "closed").length}`} />
      </div>
    </section>
  );
}

function HealthMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-black text-white">{value}</div>
    </div>
  );
}
