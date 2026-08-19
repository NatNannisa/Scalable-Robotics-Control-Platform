import { Battery, Gauge, Radio } from "lucide-react";
import type { getCurrentRobotState } from "@/src/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RobotState = ReturnType<typeof getCurrentRobotState>;

export default function LiveCameraPanel({ state }: { state: RobotState }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Robot POV Camera</CardTitle>
        <span className="rounded-full bg-green/15 px-2 py-1 text-xs font-bold text-green">LIVE</span>
      </CardHeader>
      <CardContent>
        <div className="relative h-56 overflow-hidden rounded-lg border border-cyan/25 bg-[#07111e]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,51,84,.9)_0_12%,transparent_12%_88%,rgba(31,51,84,.9)_88%),linear-gradient(180deg,rgba(8,15,28,.1),rgba(2,6,15,.9))]" />
          <div className="absolute inset-x-8 bottom-0 h-44 origin-bottom skew-x-[-8deg] bg-gradient-to-t from-slate-800 via-slate-700 to-transparent opacity-80" />
          <div className="absolute left-8 top-10 h-28 w-24 rounded border border-slate-600 bg-slate-800/80" />
          <div className="absolute right-10 top-9 h-32 w-28 rounded border border-slate-600 bg-slate-800/80" />
          <div className="absolute left-1/2 top-14 h-20 w-40 -translate-x-1/2 rounded-md border border-amber/40 bg-amber/10" />
          <div className="absolute inset-5 border border-cyan/40" />
          <div className="absolute left-1/2 top-1/2 h-20 w-28 -translate-x-1/2 -translate-y-1/2 border-2 border-cyan/70 shadow-glow">
            <span className="absolute -top-5 left-0 text-[10px] text-cyan">DETECTION LOCK</span>
          </div>
          <div className="absolute left-3 top-3 rounded bg-green/20 px-2 py-1 text-xs font-bold text-green">LIVE</div>
          <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2 text-[11px]">
            <span className="rounded bg-black/45 px-2 py-1 text-slate-200"><Gauge size={12} className="mr-1 inline" />Speed {state.speed}</span>
            <span className="rounded bg-black/45 px-2 py-1 text-slate-200"><Battery size={12} className="mr-1 inline" />{state.battery}%</span>
            <span className="rounded bg-black/45 px-2 py-1 text-slate-200"><Radio size={12} className="mr-1 inline" />{state.currentZone}</span>
          </div>
        </div>
        <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">
          Current action: <span className="font-semibold text-cyan">{state.currentAction}</span>
        </div>
      </CardContent>
    </Card>
  );
}
