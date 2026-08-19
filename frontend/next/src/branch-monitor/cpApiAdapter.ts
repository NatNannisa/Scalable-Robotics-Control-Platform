import branches from "@/src/data/branches.json";
import robots from "@/src/data/robots.json";
import cameraEvents from "@/src/data/cameraEvents.json";
import robotAlerts from "@/src/data/robotAlerts.json";
import routes from "@/src/data/routes.json";
import type { AdapterHealth, BranchAlert, BranchEvent, BranchRow, BranchSnapshot, RobotSnapshot, SupportTicket } from "@/src/branch-monitor/types";

function adapterHealthFor(status: string): AdapterHealth {
  if (status === "online" || status === "ready") return "healthy";
  if (status === "warning") return "degraded";
  return "offline";
}

export async function listBranches(allowedBranchIds: string[]): Promise<BranchRow[]> {
  return branches
    .filter((branch) => allowedBranchIds.includes(branch.branch_id))
    .map((branch) => ({
      branchId: branch.branch_id,
      branchName: branch.branch_name,
      city: branch.city,
      status: branch.status,
      robotId: branch.active_robot_id,
      routeId: branch.route_id,
      cameraId: branch.live_camera_id,
      primaryZone: branch.primary_zone,
      adapterHealth: adapterHealthFor(branch.status)
    }));
}

export async function getBranchSnapshot(branchId: string): Promise<BranchSnapshot> {
  const branch = branches.find((item) => item.branch_id === branchId) ?? branches[0];
  const row = (await listBranches(branches.map((item) => item.branch_id))).find((item) => item.branchId === branch.branch_id)!;
  const robot = robots.find((item) => item.robot_id === branch.active_robot_id) ?? robots[0];
  const route = routes.find((item) => item.route_id === branch.route_id);
  const events = cameraEvents
    .filter((event) => event.branch_id === branch.branch_id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map<BranchEvent>((event) => ({
      eventId: event.event_id,
      timestamp: event.timestamp,
      eventName: event.event_name,
      eventType: event.event_type,
      zone: event.zone,
      severity: event.severity,
      actionTaken: event.action_taken
    }));
  const alerts = robotAlerts
    .filter((alert) => alert.branch_id === branch.branch_id)
    .map<BranchAlert>((alert) => ({
      alertId: alert.alert_id,
      severity: alert.severity,
      status: alert.status,
      message: alert.message,
      owner: alert.owner,
      createdAt: alert.created_at
    }));

  const tickets: SupportTicket[] = alerts.map((alert, index) => ({
    ticketId: `TKT-${branch.branch_id}-${index + 1}`,
    title: alert.message,
    status: alert.status === "resolved" ? "closed" : "open",
    owner: alert.owner
  }));

  const robotSnapshot: RobotSnapshot = {
    robotId: robot.robot_id,
    robotName: robot.robot_name,
    status: robot.status,
    battery: robot.battery_percent,
    signal: robot.signal_percent,
    currentZone: robot.current_zone,
    currentAction: robot.current_action,
    speedMps: robot.speed_mps,
    routeProgress: robot.route_progress_percent
  };

  return {
    branch: row,
    robot: robotSnapshot,
    events,
    alerts,
    tickets,
    map: {
      routeLabel: route?.route_name ?? branch.route_id,
      activeZone: robot.current_zone,
      chargingPercent: robot.battery_percent,
      routeProgress: robot.route_progress_percent
    }
  };
}
