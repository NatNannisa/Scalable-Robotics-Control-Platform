export type SystemStatus =
  | "online"
  | "offline"
  | "warning"
  | "critical"
  | "live"
  | "pending"
  | "approved"
  | "rejected"
  | "ready"
  | "maintenance"
  | "success";

export function normalizeStatus(status?: string): SystemStatus {
  const value = (status ?? "offline").toLowerCase();
  if (isSystemStatus(value)) return value;
  if (value === "running" || value === "active" || value === "resolved") return "online";
  if (value === "blocked" || value === "error") return "critical";
  return "warning";
}

export function getStatusLabel(status?: string) {
  const normalized = normalizeStatus(status);
  const labels: Record<SystemStatus, string> = {
    online: "Online",
    offline: "Offline",
    warning: "Warning",
    critical: "Critical",
    live: "Live",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    ready: "Ready",
    maintenance: "Maintenance",
    success: "Success"
  };
  return labels[normalized];
}

export function getStatusTone(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "online" || normalized === "live" || normalized === "approved" || normalized === "ready" || normalized === "success") {
    return "green";
  }
  if (normalized === "warning" || normalized === "pending" || normalized === "maintenance") return "amber";
  if (normalized === "critical" || normalized === "offline" || normalized === "rejected") return "red";
  return "blue";
}

export function getBatteryStatus(batteryPercent = 0): SystemStatus {
  if (batteryPercent <= 15) return "critical";
  if (batteryPercent < 30) return "warning";
  return "online";
}

export function getSignalStatus(signalPercent = 0): SystemStatus {
  if (signalPercent <= 35) return "critical";
  if (signalPercent < 70) return "warning";
  return "online";
}

function isSystemStatus(value: string): value is SystemStatus {
  return [
    "online",
    "offline",
    "warning",
    "critical",
    "live",
    "pending",
    "approved",
    "rejected",
    "ready",
    "maintenance",
    "success"
  ].includes(value);
}
