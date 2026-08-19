import type { BranchRow } from "@/src/branch-monitor/types";

const healthClass = {
  healthy: "border-green/30 bg-green/15 text-green",
  degraded: "border-amber/30 bg-amber/15 text-amber",
  offline: "border-danger/30 bg-danger/15 text-danger"
};

export function BranchStatusTable({ branches, selectedBranchId, onSelect }: { branches: BranchRow[]; selectedBranchId: string; onSelect: (branchId: string) => void }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.065] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_60px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Branch Status</h2>
          <p className="text-sm text-slate-400">Click a branch row to update robot, map, events, alerts, and tickets.</p>
        </div>
        <span className="rounded-full border border-cyan/30 bg-cyan/15 px-3 py-1 text-xs font-bold text-cyan">{branches.length} branches</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Robot</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Adapter</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => {
              const selected = selectedBranchId === branch.branchId;
              return (
                <tr
                  key={branch.branchId}
                  onClick={() => onSelect(branch.branchId)}
                  className={`cursor-pointer border-t border-white/10 transition ${selected ? "bg-cyan/15 text-white shadow-[inset_3px_0_0_#35d5ff]" : "bg-slate-950/20 text-slate-300 hover:bg-white/5"}`}
                >
                  <td className="px-4 py-3">
                    <b>{branch.branchName}</b>
                    <div className="text-xs text-slate-500">{branch.city}</div>
                  </td>
                  <td className="px-4 py-3">{branch.robotId}</td>
                  <td className="px-4 py-3">{branch.primaryZone}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-bold ${healthClass[branch.adapterHealth]}`}>{branch.adapterHealth}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
