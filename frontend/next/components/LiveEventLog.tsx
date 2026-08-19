import { AlertTriangle, CheckCircle2, Footprints, MessageSquare, PackageCheck, Radio, Route, UserRound } from "lucide-react";
import type { RobotEvent } from "@/src/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const eventIcon = {
  session_started: Radio,
  route_started: Route,
  zone_entered: Footprints,
  customer_detected: UserRound,
  customer_approached: UserRound,
  invitation_script_played: MessageSquare,
  product_recommended: PackageCheck,
  product_faq_opened: MessageSquare,
  sampling_interest: CheckCircle2,
  obstacle_detected: AlertTriangle,
  robot_stopped: AlertTriangle,
  robot_resumed: Route,
  safety_distance_warning: AlertTriangle
} as const;

function colorFor(event: RobotEvent) {
  if (event.safety_flag || event.event_type.includes("obstacle") || event.event_type.includes("stopped")) return "text-danger border-danger/30 bg-danger/10";
  if (event.event_type.includes("sampling") || event.event_type.includes("resumed")) return "text-green border-green/30 bg-green/10";
  if (event.event_type.includes("script") || event.event_type.includes("faq")) return "text-purple border-purple/30 bg-purple/10";
  return "text-cyan border-cyan/30 bg-cyan/10";
}

export default function LiveEventLog({ events }: { events: RobotEvent[] }) {
  return (
    <Card className="min-h-[360px]">
      <CardHeader>
        <CardTitle>Live Event Log</CardTitle>
        <span className="text-xs text-slate-500">{events.length} events streamed</span>
      </CardHeader>
      <CardContent>
        <div className="thin-scrollbar flex max-h-[305px] flex-col-reverse gap-2 overflow-y-auto pr-1">
          {[...events].reverse().map((event) => {
            const Icon = eventIcon[event.event_type as keyof typeof eventIcon] ?? Radio;
            return (
              <div key={event.event_id} className={`rounded-lg border p-3 ${colorFor(event)}`}>
                <div className="flex items-start gap-3">
                  <Icon size={17} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-slate-100">{event.event_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(event.event_timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" })}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {event.zone}
                      {event.distance_m ? ` | ${event.distance_m}m` : ""}
                      {event.angle_degree ? ` | ${event.angle_degree}deg` : ""}
                    </div>
                    {event.product_name && <div className="mt-1 text-xs text-slate-300">{event.product_name}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
