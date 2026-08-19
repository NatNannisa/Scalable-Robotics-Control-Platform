export type RobotState =
  | "idle"
  | "session_started"
  | "moving"
  | "zone_entered"
  | "detecting"
  | "customer_detected"
  | "speaking"
  | "waiting_for_response"
  | "interaction_recorded"
  | "obstacle_detected"
  | "stopped"
  | "resuming"
  | "route_completed"
  | "session_ended";

export type RobotVisualState = "moving" | "detecting" | "speaking" | "stopped" | "warning" | "charging";

export type Position3D = { x: number; y: number; z: number };

export type RoutePoint3D = {
  route_event_id: string;
  sequence?: number;
  zone: string;
  position?: Position3D;
  x_position?: number;
  y_position?: number;
  z_position?: number;
  route_status: string;
  battery_percent?: number;
};

export type DetectionSignal = {
  distance_m: number;
  angle_degree: number;
  confidence_score: number;
  customer_movement: string;
  obstacle_distance_m?: number;
};

export type RobotEventLike = {
  event_type: string;
  zone?: string;
  event_timestamp?: string;
};

export function getCurrentZone(routeLog: RoutePoint3D[], currentRouteIndex: number) {
  return routeLog[Math.min(currentRouteIndex, routeLog.length - 1)]?.zone ?? "Unknown";
}

export function getCurrentRobotPosition(routeLog: RoutePoint3D[], currentRouteIndex: number): Position3D {
  const point = routeLog[Math.min(currentRouteIndex, routeLog.length - 1)];
  if (!point) return { x: 0, y: 0.15, z: 0 };
  if (point.position) return point.position;
  return {
    x: point.x_position ?? 0,
    y: point.z_position ?? 0.15,
    z: point.y_position ?? 0
  };
}

export function getRouteCompletion(routeLog: RoutePoint3D[], currentRouteIndex: number) {
  if (!routeLog.length) return 0;
  return Math.round((Math.min(currentRouteIndex + 1, routeLog.length) / routeLog.length) * 100);
}

export function shouldTriggerEngagement(detection: DetectionSignal) {
  return (
    detection.distance_m >= 0.8 &&
    detection.distance_m <= 2.0 &&
    detection.angle_degree >= -30 &&
    detection.angle_degree <= 30 &&
    detection.confidence_score >= 0.75 &&
    detection.customer_movement !== "fast_walk" &&
    (detection.obstacle_distance_m ?? 999) > 0.5
  );
}

export function shouldStopForObstacle(detection: Pick<DetectionSignal, "obstacle_distance_m">) {
  return (detection.obstacle_distance_m ?? 999) < 0.5;
}

export function shouldResumeFromObstacle(detection: Pick<DetectionSignal, "obstacle_distance_m">) {
  return (detection.obstacle_distance_m ?? 0) >= 0.7;
}

export function getRobotStateFromEvent(eventType?: string): RobotState {
  const map: Record<string, RobotState> = {
    session_started: "session_started",
    route_started: "moving",
    zone_entered: "zone_entered",
    customer_detected: "customer_detected",
    customer_approached: "detecting",
    invitation_script_played: "speaking",
    product_recommended: "speaking",
    product_faq_opened: "waiting_for_response",
    sampling_interest: "interaction_recorded",
    customer_ignored: "interaction_recorded",
    obstacle_detected: "obstacle_detected",
    safety_distance_warning: "obstacle_detected",
    robot_stopped: "stopped",
    robot_resumed: "resuming",
    route_completed: "route_completed",
    session_ended: "session_ended"
  };

  return eventType ? map[eventType] ?? "moving" : "idle";
}

export function getRobotVisualState(robotState: RobotState): RobotVisualState {
  if (robotState === "obstacle_detected") return "warning";
  if (robotState === "stopped") return "stopped";
  if (robotState === "speaking" || robotState === "waiting_for_response") return "speaking";
  if (robotState === "detecting" || robotState === "customer_detected") return "detecting";
  if (robotState === "session_ended" || robotState === "route_completed") return "charging";
  return "moving";
}

export function getCurrentAction(robotState: RobotState, latestEvent?: RobotEventLike) {
  if (latestEvent?.event_type === "obstacle_detected") return "Obstacle detected, stopping robot";
  if (latestEvent?.event_type === "robot_resumed") return "Obstacle cleared, resuming route";

  const action: Record<RobotState, string> = {
    idle: "Waiting for session",
    session_started: "Initializing live session",
    moving: "Following route through aisle corridors",
    zone_entered: "Scanning active zone",
    detecting: "Detecting shopper intent",
    customer_detected: "Evaluating shopper eligibility",
    speaking: "Playing sampling script",
    waiting_for_response: "Waiting for customer response",
    interaction_recorded: "Recording interaction result",
    obstacle_detected: "Obstacle detected",
    stopped: "Robot stopped for safety",
    resuming: "Resuming route",
    route_completed: "Route completed",
    session_ended: "Session ended"
  };

  return action[robotState];
}

export function interpolateRoutePosition(routeLog: RoutePoint3D[], segmentIndex: number, alpha: number): Position3D {
  const current = getCurrentRobotPosition(routeLog, segmentIndex);
  const next = getCurrentRobotPosition(routeLog, Math.min(segmentIndex + 1, routeLog.length - 1));
  const safeAlpha = Math.max(0, Math.min(alpha, 1));

  return {
    x: current.x + (next.x - current.x) * safeAlpha,
    y: current.y + (next.y - current.y) * safeAlpha,
    z: current.z + (next.z - current.z) * safeAlpha
  };
}

export function getCurrentRobotState(events: RobotEventLike[], routeLog: RoutePoint3D[], currentRouteIndex: number) {
  const latestEvent = events[events.length - 1];
  const robotState = getRobotStateFromEvent(latestEvent?.event_type);
  const position = getCurrentRobotPosition(routeLog, currentRouteIndex);

  return {
    robotState,
    visualState: getRobotVisualState(robotState),
    currentAction: getCurrentAction(robotState, latestEvent),
    currentZone: getCurrentZone(routeLog, currentRouteIndex),
    routeCompletion: getRouteCompletion(routeLog, currentRouteIndex),
    position
  };
}
