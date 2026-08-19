"use client";

import { AlertTriangle, Bot, Box, Crosshair, Focus, Minus, Plus, RotateCcw, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { RoutePoint as AnalyticsRoutePoint } from "@/src/lib/analytics";
import routeLog from "@/src/data/mockRouteLog.json";
import zonesData from "@/src/data/mockZones.json";
import storeObjectsData from "@/src/data/mockStoreObjects.json";
import mapEventsData from "@/src/data/mockMapEvents.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Vec3 = { x: number; y: number; z: number };
type StoreObject = (typeof storeObjectsData)[number];
type MapEvent = (typeof mapEventsData)[number];

type MapRoutePoint = {
  id: string;
  zone: string;
  x: number;
  y: number;
  z: number;
  status: "completed" | "current" | "upcoming" | "stopped" | "in_progress";
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 600;
const palette = ["#ff705d", "#ffd166", "#51d88a", "#35d5ff", "#9c6cff", "#ff9f43"];

function project(position: Vec3) {
  return {
    x: 500 + (position.x - position.z) * 35,
    y: 298 + (position.x + position.z) * 18 - position.y * 28
  };
}

function pxPoint(position: Vec3) {
  const point = project(position);
  return {
    left: `${(point.x / MAP_WIDTH) * 100}%`,
    top: `${(point.y / MAP_HEIGHT) * 100}%`
  };
}

function objectSize(object: StoreObject) {
  const width = Math.max(18, (object.scale.x + object.scale.z) * 20);
  const height = Math.max(10, object.scale.y * 34 + object.scale.z * 3);

  return { width, height };
}

function normalizeRoute(route?: AnalyticsRoutePoint[]): MapRoutePoint[] {
  const source = routeLog.map((point) => ({
    id: point.route_event_id,
    zone: point.zone,
    x: "position" in point ? point.position.x : point.x_position,
    y: "position" in point ? point.position.y : point.z_position ?? 0.16,
    z: "position" in point ? point.position.z : point.y_position,
    status: point.route_status as MapRoutePoint["status"]
  }));

  if (!route?.length) return source;

  return route.map((point, index) => ({
    id: point.route_event_id,
    zone: point.zone,
    x: point.x_position,
    y: point.z_position || 0.16,
    z: point.y_position,
    status: (point.route_status as MapRoutePoint["status"]) || (index < route.length - 2 ? "completed" : "upcoming")
  }));
}

function RouteSvg({ route }: { route: MapRoutePoint[] }) {
  const points = route.map((point) => project({ x: point.x, y: 0.2, z: point.z }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const currentIndex = Math.max(1, route.findIndex((point) => point.status === "current" || point.status === "in_progress"));
  const completed = points.slice(0, currentIndex + 1).map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg className="absolute inset-0 z-30 h-full w-full overflow-visible" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="none">
      <path d={path} fill="none" stroke="#35d5ff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
      <path d={path} fill="none" stroke="#35d5ff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      <path d={completed} fill="none" stroke="#d8f7ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
    </svg>
  );
}

function ShelfModule({ object, index }: { object: StoreObject; index: number }) {
  const size = objectSize(object);

  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ ...pxPoint(object.position), width: size.width, height: size.height }}>
      <div className="h-full w-full skew-y-[-16deg] rounded-[3px] border border-cyan/15 bg-[#14263a] shadow-[0_12px_24px_rgba(0,0,0,.5)]">
        <div className="absolute inset-x-1 top-1 h-1 bg-[#314c67]" />
        <div className="absolute inset-x-1 top-[35%] h-1 bg-[#314c67]" />
        <div className="absolute inset-x-1 top-[66%] h-1 bg-[#314c67]" />
        {Array.from({ length: 16 }).map((_, item) => (
          <span
            key={item}
            className="absolute h-1.5 w-2 rounded-sm shadow-[0_0_5px_currentColor]"
            style={{
              left: `${8 + (item % 8) * 11}%`,
              top: `${14 + Math.floor(item / 8) * 38}%`,
              color: palette[(index + item) % palette.length],
              background: palette[(index + item) % palette.length]
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FreezerCabinet({ object }: { object: StoreObject }) {
  const size = objectSize(object);

  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ ...pxPoint(object.position), width: size.width + 8, height: size.height }}>
      <div className="h-full w-full skew-y-[-16deg] rounded border border-cyan/40 bg-[#12324f] shadow-[0_0_18px_rgba(53,213,255,.25),0_10px_20px_rgba(0,0,0,.5)]">
        <div className="absolute inset-1 rounded bg-cyan/35" />
        <div className="absolute inset-x-2 top-1/2 h-px bg-white/40" />
      </div>
    </div>
  );
}

function PromotionGate({ object }: { object: StoreObject }) {
  const point = pxPoint(object.position);

  return (
    <div className="absolute z-40 -translate-x-1/2 -translate-y-1/2" style={{ ...point, width: 170, height: 80 }}>
      <div className="absolute inset-x-2 bottom-0 h-10 skew-y-[-16deg] rounded bg-purple/25 shadow-[0_0_24px_rgba(156,108,255,.38)]" />
      <div className="absolute bottom-4 left-2 h-16 w-4 rounded bg-purple shadow-[0_0_16px_rgba(156,108,255,.6)]" />
      <div className="absolute bottom-4 right-2 h-16 w-4 rounded bg-purple shadow-[0_0_16px_rgba(156,108,255,.6)]" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded bg-[#5620a7] px-5 py-1 text-[10px] font-black tracking-wide text-white shadow-glow">
        PROMOTION ZONE
      </div>
    </div>
  );
}

function SignBoard({ object, label, tone }: { object: StoreObject; label: string; tone: "red" | "green" }) {
  const color = tone === "red" ? "#e0313d" : "#31e981";

  return (
    <div className="absolute z-50 -translate-x-1/2 -translate-y-1/2" style={{ ...pxPoint(object.position), width: 96, height: 34 }}>
      <div className="grid h-full place-items-center rounded border border-white/20 text-sm font-black text-white shadow-glow" style={{ background: color, boxShadow: `0 0 22px ${color}55` }}>
        {label}
      </div>
    </div>
  );
}

function CheckoutCounter({ object }: { object: StoreObject }) {
  const size = objectSize(object);

  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ ...pxPoint(object.position), width: size.width, height: size.height + 8 }}>
      <div className="h-full w-full skew-y-[-16deg] rounded bg-slate-200 shadow-[0_10px_20px_rgba(0,0,0,.45)]">
        <div className="absolute inset-x-1 top-1 h-2 rounded bg-[#203850]" />
      </div>
    </div>
  );
}

function ProductStack({ object, index }: { object: StoreObject; index: number }) {
  return (
    <div className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ ...pxPoint(object.position), width: 58, height: 42 }}>
      {Array.from({ length: 9 }).map((_, item) => (
        <span
          key={item}
          className="absolute h-3 w-4 rounded-sm shadow-[0_4px_8px_rgba(0,0,0,.35)]"
          style={{
            left: `${(item % 3) * 18}px`,
            top: `${Math.floor(item / 3) * 11}px`,
            background: palette[(index + item) % palette.length]
          }}
        />
      ))}
    </div>
  );
}

function WaypointNode({ point, active }: { point: MapRoutePoint; active: boolean }) {
  return (
    <span
      className={`absolute z-40 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${active ? "animate-pulse bg-white" : "bg-cyan"}`}
      style={{ ...pxPoint({ x: point.x, y: 0.24, z: point.z }), boxShadow: "0 0 18px #35d5ff" }}
    />
  );
}

function RobotMarker({ route, safetyActive }: { route: MapRoutePoint[]; safetyActive: boolean }) {
  const currentIndex = Math.max(1, route.findIndex((point) => point.status === "current" || point.status === "in_progress"));
  const point = route[currentIndex] ?? route[0];

  return (
    <div className="absolute z-50 -translate-x-1/2 -translate-y-1/2" style={{ ...pxPoint({ x: point.x, y: 0.52, z: point.z }), width: 54, height: 70 }}>
      <div className={`absolute bottom-0 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full border ${safetyActive ? "border-danger" : "border-cyan"} animate-pulse`} style={{ boxShadow: safetyActive ? "0 0 20px #ff4d67" : "0 0 20px #35d5ff" }} />
      <div className="absolute bottom-5 left-1/2 h-10 w-8 -translate-x-1/2 rounded-b-xl rounded-t-2xl bg-slate-100 shadow-[0_10px_20px_rgba(0,0,0,.5)]">
        <div className="absolute left-1/2 top-2 h-3 w-6 -translate-x-1/2 rounded bg-[#06101d]">
          <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-cyan" />
          <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-cyan" />
        </div>
        <div className="absolute bottom-2 left-1/2 h-1.5 w-5 -translate-x-1/2 rounded bg-danger" />
      </div>
    </div>
  );
}

function ZoneLabel({ title, description, color, position }: { title: string; description: string; color: string; position: Vec3 }) {
  return (
    <div className="absolute z-50 min-w-36 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-[#051121]/90 px-3 py-2 text-xs shadow-glow backdrop-blur" style={{ ...pxPoint(position), borderColor: color }}>
      <div className="font-bold text-slate-100">{title}</div>
      <div className="text-[10px] text-slate-400">Zone</div>
      <div className="text-[11px] text-slate-300">{description}</div>
    </div>
  );
}

function EventMarker({ event }: { event: MapEvent }) {
  const color = event.severity === "danger" ? "#ff4d67" : event.severity === "success" ? "#31e981" : event.severity === "warning" ? "#f6b743" : "#35d5ff";

  return (
    <span
      className="absolute z-50 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border border-white/40"
      title={event.event_name}
      style={{ ...pxPoint(event.position), background: color, boxShadow: `0 0 18px ${color}` }}
    />
  );
}

function BoundaryWalls() {
  return (
    <>
      <div className="absolute left-[7%] top-[20%] z-10 h-[48%] w-3 -rotate-[28deg] rounded bg-[#15263b] shadow-[0_0_18px_rgba(53,213,255,.15)]" />
      <div className="absolute right-[9%] top-[19%] z-10 h-[49%] w-3 rotate-[28deg] rounded bg-[#15263b] shadow-[0_0_18px_rgba(53,213,255,.15)]" />
      <div className="absolute left-[19%] top-[9%] z-10 h-3 w-[58%] rotate-[-1deg] rounded bg-[#15263b] shadow-[0_0_18px_rgba(53,213,255,.15)]" />
      <div className="absolute bottom-[11%] left-[19%] z-10 h-3 w-[62%] rotate-[-1deg] rounded bg-[#15263b] shadow-[0_0_18px_rgba(53,213,255,.15)]" />
    </>
  );
}

export default function ThreeDStoreMap({ route, safetyActive }: { route?: AnalyticsRoutePoint[]; safetyActive: boolean }) {
  const [is2D, setIs2D] = useState(false);
  const routePoints = useMemo(() => normalizeRoute(route), [route]);
  const shelves = storeObjectsData.filter((object) => object.object_type === "shelf");
  const freezers = storeObjectsData.filter((object) => object.object_type === "freezer_cabinet");
  const productStacks = storeObjectsData.filter((object) => object.object_type === "product_stack");
  const checkouts = storeObjectsData.filter((object) => object.object_type === "checkout_counter");
  const promotionGate = storeObjectsData.find((object) => object.object_type === "promotion_gate");
  const makroSign = storeObjectsData.find((object) => object.object_type === "makro_sign");
  const miniSign = storeObjectsData.find((object) => object.object_type === "mini_corner_sign");

  return (
    <Card className="h-[640px] overflow-hidden rounded-lg border-blue-900/50">
      <CardHeader className="relative z-10 h-14 items-center">
        <div>
          <div className="flex items-center gap-3">
            <CardTitle>3D STORE MAP - LIVE VIEW</CardTitle>
            <span className="rounded-full border border-green/40 bg-green/15 px-2 py-1 text-[10px] font-bold text-green">LIVE</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Premium isometric Makro hypermarket diorama</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-blue-700/70 bg-blue-700 px-3 py-2 text-xs font-bold text-white" onClick={() => setIs2D(false)}>
            3D
          </button>
          <button className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300" onClick={() => setIs2D(true)}>
            2D
          </button>
          {[Focus, Plus, Minus, RotateCcw].map((Icon, index) => (
            <button key={index} className="grid h-8 w-8 place-items-center rounded-md border border-slate-700 bg-slate-900 text-slate-300" title="Map control">
              <Icon size={15} />
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="relative h-[584px] overflow-hidden bg-[#06101d] p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_28%,rgba(53,213,255,.16),transparent_30%),linear-gradient(135deg,rgba(9,23,39,.96),rgba(2,8,16,.98))]" />
        <div className={`absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ${is2D ? "scale-[1.04]" : "scale-[.98] rotate-x-[0deg]"}`}>
          <div className="absolute left-[12%] top-[8%] h-[76%] w-[76%] skew-y-[-16deg] rounded-xl border border-cyan/15 bg-[#162536] shadow-[inset_0_0_60px_rgba(53,213,255,.08),0_30px_60px_rgba(0,0,0,.55)]" />
          <div className="absolute left-[12%] top-[8%] h-[76%] w-[76%] skew-y-[-16deg] rounded-xl opacity-40" style={{ backgroundImage: "linear-gradient(#244c7030 1px,transparent 1px),linear-gradient(90deg,#244c7030 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
          <BoundaryWalls />
          {zonesData.map((zone) => (
            <div
              key={zone.zone_id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 skew-y-[-16deg] rounded-lg opacity-20"
              style={{ ...pxPoint(zone.position), width: zone.size.width * 36, height: zone.size.depth * 18, background: zone.color }}
            />
          ))}
          <RouteSvg route={routePoints} />
          {freezers.map((object) => (
            <FreezerCabinet key={object.object_id} object={object} />
          ))}
          {shelves.map((object, index) => (
            <ShelfModule key={object.object_id} object={object} index={index} />
          ))}
          {productStacks.map((object, index) => (
            <ProductStack key={object.object_id} object={object} index={index} />
          ))}
          {checkouts.map((object) => (
            <CheckoutCounter key={object.object_id} object={object} />
          ))}
          {promotionGate && <PromotionGate object={promotionGate} />}
          {makroSign && <SignBoard object={makroSign} label="makro" tone="red" />}
          {miniSign && <SignBoard object={miniSign} label="MINI CORNER" tone="green" />}
          {routePoints.map((point, index) => (
            <WaypointNode key={point.id} point={point} active={index === Math.max(1, routePoints.findIndex((item) => item.status === "current" || item.status === "in_progress"))} />
          ))}
          {mapEventsData.map((event) => (
            <EventMarker key={event.event_id} event={event} />
          ))}
          <RobotMarker route={routePoints} safetyActive={safetyActive} />
          <ZoneLabel title="Frozen Food" description="Refrigerated Aisle" color="#35d5ff" position={{ x: -6.6, y: 1.6, z: -4.4 }} />
          <ZoneLabel title="Promotion Zone" description="Active Promotion" color="#9c6cff" position={{ x: -2.5, y: 1.55, z: 1.7 }} />
          <ZoneLabel title="Mini Corner" description="High Traffic Area" color="#31e981" position={{ x: 6.4, y: 1.55, z: -1.3 }} />
        </div>
        <div className="absolute bottom-4 left-4 z-[80] flex flex-wrap gap-3 rounded-lg border border-slate-700/80 bg-[#07101f]/90 p-2 text-xs backdrop-blur">
          <span className="flex items-center gap-1 text-cyan"><Bot size={13} /> Robot</span>
          <span className="flex items-center gap-1 text-cyan"><Box size={13} /> Route</span>
          <span className="flex items-center gap-1 text-cyan"><Crosshair size={13} /> Waypoint</span>
          <span className="flex items-center gap-1 text-purple"><Box size={13} /> Zone</span>
          <span className="flex items-center gap-1 text-danger"><AlertTriangle size={13} /> Obstacle</span>
          <span className="flex items-center gap-1 text-green"><Zap size={13} /> Charging</span>
        </div>
      </CardContent>
    </Card>
  );
}
