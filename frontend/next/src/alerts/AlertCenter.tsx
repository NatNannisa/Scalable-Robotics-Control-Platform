import type { BranchAlert } from "@/src/branch-monitor/types";

export function AlertCenter({ alerts }: { alerts: BranchAlert[] }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.065] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_60px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Alert Center</h2>
        <span className="rounded-full border border-danger/30 bg-danger/15 px-3 py-1 text-xs font-bold text-danger">{alerts.length} alerts</span>
      </div>
      <div className="space-y-2">
        {alerts.length ? alerts.map((alert) => (
          <div key={alert.alertId} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <b>{alert.message}</b>
              <span className="rounded-full border border-white/10 px-2 py-1 text-xs uppercase text-slate-300">{alert.status}</span>
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{alert.owner}</span>
              <span>{alert.createdAt.slice(11, 16)}</span>
            </div>
          </div>
        )) : <p className="rounded-2xl border border-green/20 bg-green/10 p-3 text-sm text-green">No active alerts for selected branch.</p>}
      </div>
    </section>
  );
}
