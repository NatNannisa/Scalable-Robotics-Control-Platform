import type { BranchSnapshot } from "@/src/branch-monitor/types";

export function SelectedBranchPanel({ snapshot }: { snapshot: BranchSnapshot }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.065] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_60px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Selected Branch</h2>
          <p className="text-sm text-slate-400">{snapshot.branch.branchName}</p>
        </div>
        <span className="rounded-full border border-green/30 bg-green/15 px-3 py-1 text-xs font-bold uppercase text-green">{snapshot.robot.status}</span>
      </div>
      <div className="grid gap-3 text-sm">
        <Row label="Robot" value={`${snapshot.robot.robotName} / ${snapshot.robot.robotId}`} />
        <Row label="Current Zone" value={snapshot.robot.currentZone} />
        <Row label="Action" value={snapshot.robot.currentAction} />
        <Row label="Battery" value={`${snapshot.robot.battery}%`} />
        <Row label="Signal" value={`${snapshot.robot.signal}%`} />
        <Row label="Route Progress" value={`${snapshot.robot.routeProgress}%`} />
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <b className="text-right text-white">{value}</b>
    </div>
  );
}
