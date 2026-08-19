import robots from "@/src/data/robots.json";
import branches from "@/src/data/branches.json";
import zones from "@/src/data/zones.json";
import routes from "@/src/data/routes.json";
import routePoints from "@/src/data/routePoints.json";
import robotEventLogs from "@/src/data/robotEventLogs.json";
import robotAlerts from "@/src/data/robotAlerts.json";
import { getBatteryStatus as getBatterySystemStatus, getSignalStatus as getSignalSystemStatus, normalizeStatus } from "@/src/lib/statusRules";

export type Robot = (typeof robots)[number];
export type RobotEventLog = (typeof robotEventLogs)[number];
const robotRows = robots as any[];
const routePointRows = routePoints as any[];

export function getCurrentRobotState(robotId = "CP-BOT-01") {
  const robot = robotRows.find((item) => item.robot_id === robotId) ?? robotRows[0];
  const latestEvent = robotEventLogs
    .filter((event) => event.robot_id === robot.robot_id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .at(-1);

  return {
    ...robot,
    robot,
    latestEvent,
    status: getRobotStatus(robot, latestEvent),
    current_action: getCurrentAction(robot, latestEvent),
    currentAction: getCurrentAction(robot, latestEvent),
    current_zone: getCurrentZone(robot.current_zone_id),
    currentZone: getCurrentZone(robot.current_zone_id),
    batteryStatus: getBatteryStatus(robot),
    signalStatus: getSignalStatus(robot),
    route_progress: getRouteProgress(robot.robot_id),
    routeProgress: getRouteProgress(robot.robot_id),
    activeAlerts: getActiveAlerts(robot.robot_id)
  };
}

export function getRobotStatus(robot: Pick<Robot, "status" | "battery_percent"> & { signal_percent?: number; signal_strength?: string }, latestEvent?: RobotEventLog) {
  const signalPercent = robot.signal_percent ?? signalStrengthToPercent(robot.signal_strength);
  if (latestEvent?.event_type === "obstacle_detected") return "warning";
  if (latestEvent?.event_type === "battery_low") return "warning";
  if (robot.battery_percent < 15 || signalPercent < 35) return "critical";
  if (robot.battery_percent < 30 || signalPercent < 70) return "warning";
  return normalizeStatus(robot.status);
}

export function getCurrentAction(robot: Pick<Robot, "current_action">, latestEvent?: Pick<RobotEventLog, "event_type">) {
  const actions: Record<string, string> = {
    route_started: "Route Started",
    zone_entered: "Scanning Active Zone",
    customer_detected: "Customer Detected",
    script_played: "Invitation Script Playing",
    sampling_interest: "Sampling Interest Recorded",
    obstacle_detected: "Obstacle Detected",
    robot_resumed: "Route Moving",
    battery_low: "Battery Warning",
    route_completed: "Route Completed"
  };
  return latestEvent ? actions[latestEvent.event_type] ?? robot.current_action : robot.current_action;
}

export function getCurrentZone(zoneId?: string) {
  return zones.find((zone) => zone.zone_id === zoneId)?.zone_name ?? "Unknown Zone";
}

export function getBatteryStatus(robot: Pick<Robot, "battery_percent">) {
  return getBatterySystemStatus(robot.battery_percent);
}

export function getSignalStatus(robot: { signal_percent?: number; signal_strength?: string }) {
  return getSignalSystemStatus(robot.signal_percent ?? signalStrengthToPercent(robot.signal_strength));
}

export function getRouteProgress(robotId: string) {
  const robot = robotRows.find((item) => item.robot_id === robotId);
  if (!robot) return 0;
  const points = routePointRows.filter((point) => point.route_id === robot.route_id);
  const robotProgress = robot.route_progress ?? robot.route_progress_percent ?? 0;
  if (!points.length) return robotProgress;
  const completedBySequence = Math.round((points.filter((point) => point.route_status === "completed").length / points.length) * 100);
  return Math.max(robotProgress, completedBySequence);
}

export function getActiveAlerts(robotId?: string) {
  return robotAlerts.filter((alert) => {
    const status = normalizeStatus(alert.status);
    return (!robotId || alert.robot_id === robotId) && status !== "offline" && status !== "success";
  });
}

export function getRobotFleet() {
  return robots.map((robot) => ({
    ...robot,
    branch_name: branches.find((branch) => branch.branch_id === robot.branch_id)?.branch_name ?? robot.branch_id,
    route_name: routes.find((route) => route.route_id === robot.route_id)?.route_name ?? robot.route_id,
    state: getCurrentRobotState(robot.robot_id)
  }));
}

function signalStrengthToPercent(signal?: string) {
  if (signal === "weak") return 35;
  if (signal === "medium") return 65;
  return 92;
}
