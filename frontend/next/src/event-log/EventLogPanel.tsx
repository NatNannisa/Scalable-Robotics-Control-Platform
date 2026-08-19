import type { BranchEvent } from "@/src/branch-monitor/types";

export function EventLogPanel({ events }: { events: BranchEvent[] }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.065] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_60px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Event Log</h2>
        <span className="rounded-full border border-cyan/30 bg-cyan/15 px-3 py-1 text-xs font-bold text-cyan">{events.length} events</span>
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.eventId} className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-sm md:grid-cols-[90px_1fr_120px]">
            <span className="text-slate-400">{event.timestamp.slice(11, 19)}</span>
            <span>
              <b>{event.eventName}</b>
              <span className="ml-2 text-slate-500">{event.zone}</span>
            </span>
            <span className="text-right text-cyan">{event.severity}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
