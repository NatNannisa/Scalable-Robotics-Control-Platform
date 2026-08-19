export type AdapterHealth = "healthy" | "degraded" | "offline";

export type BranchRow = {
  branchId: string;
  branchName: string;
  city: string;
  status: string;
  robotId: string;
  routeId: string;
  cameraId: string;
  primaryZone: string;
  adapterHealth: AdapterHealth;
};

export type RobotSnapshot = {
  robotId: string;
  robotName: string;
  status: string;
  battery: number;
  signal: number;
  currentZone: string;
  currentAction: string;
  speedMps: number;
  routeProgress: number;
};

export type BranchEvent = {
  eventId: string;
  timestamp: string;
  eventName: string;
  eventType: string;
  zone: string;
  severity: string;
  actionTaken: string;
};

export type BranchAlert = {
  alertId: string;
  severity: string;
  status: string;
  message: string;
  owner: string;
  createdAt: string;
};

export type SupportTicket = {
  ticketId: string;
  title: string;
  status: string;
  owner: string;
};

export type BranchSnapshot = {
  branch: BranchRow;
  robot: RobotSnapshot;
  events: BranchEvent[];
  alerts: BranchAlert[];
  tickets: SupportTicket[];
  map: {
    routeLabel: string;
    activeZone: string;
    chargingPercent: number;
    routeProgress: number;
  };
};
