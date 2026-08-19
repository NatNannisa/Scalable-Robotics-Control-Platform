import { BatteryCharging, RadioTower, ShieldCheck, Thermometer, Zap, type LucideIcon } from "lucide-react";
import type { getCurrentRobotState } from "@/src/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type RobotState = ReturnType<typeof getCurrentRobotState>;

export default function RobotStatusCard({ state }: { state: RobotState }) {
  const warning = state.safetyStatus === "Warning";
  const rows = [
    ["Robot ID", state.robotId],
    ["Robot Name", state.robotName],
    ["Current Zone", state.currentZone],
    ["Current Action", state.currentAction],
    ["Closest Obstacle", `${state.closestObstacleDistance?.toFixed(2)}m`]
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Robot Status</CardTitle>
        <span className={`rounded-full px-2 py-1 text-xs font-bold ${warning ? "bg-danger/15 text-danger" : "bg-green/15 text-green"}`}>
          {state.safetyStatus}
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Metric icon={BatteryCharging} label="Battery" value={`${state.battery}%`} />
          <Metric icon={Zap} label="Speed" value={`Level ${state.speed}`} />
          <Metric icon={Thermometer} label="Temp" value={`${state.temperature}C`} />
          <Metric icon={RadioTower} label="Network" value={`${state.networkStrength}%`} />
        </div>
        <div className="mt-4 space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 border-t border-slate-800 pt-2 text-xs">
              <span className="text-slate-500">{label}</span>
              <span className="text-right font-medium text-slate-200">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>Route completion</span>
            <span>{state.routeCompletion}%</span>
          </div>
          <Progress value={state.routeCompletion} />
        </div>
        <div className={`mt-4 flex items-center gap-2 rounded-md border p-3 text-sm ${warning ? "border-danger/30 bg-danger/10 text-danger" : "border-green/20 bg-green/10 text-green"}`}>
          <ShieldCheck size={17} />
          Safety system {warning ? "holding route" : "clear"}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/45 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}
