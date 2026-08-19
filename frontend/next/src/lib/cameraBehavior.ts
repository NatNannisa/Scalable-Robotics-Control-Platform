export type CameraStatus = "live" | "warning" | "offline" | "maintenance";
export type StreamType = "mock_image" | "mock_video" | "external_hls";
export type CameraMediaType = "video" | "image" | "hls" | "placeholder";
export type SignalStrength = "strong" | "medium" | "weak";
export type SafetyStatus = "safe" | "warning";
export type CameraOverlayState =
  | "none"
  | "detection_box"
  | "script_wave"
  | "success_marker"
  | "warning_marker"
  | "offline";

export type LiveCamera = {
  camera_id: string;
  camera_name: string;
  branch_id: string;
  branch_name: string;
  robot_id: string;
  robot_name: string;
  campaign_id: string;
  campaign_name: string;
  camera_status: CameraStatus;
  stream_type: StreamType;
  image_url: string | null;
  video_url: string | null;
  hls_url: string | null;
  current_zone: string;
  current_action: string;
  battery_percent: number;
  speed_mps: number;
  signal_strength: SignalStrength;
  safety_status: SafetyStatus;
  last_updated: string;
};

export type CameraEventType =
  | "camera_online"
  | "customer_detected"
  | "script_played"
  | "sampling_interest"
  | "obstacle_detected"
  | "robot_resumed"
  | "signal_warning"
  | "battery_warning"
  | "battery_low"
  | "stream_connected"
  | "stream_disconnected";

export type CameraEvent = {
  event_id: string;
  camera_id: string;
  robot_id: string;
  branch_id: string;
  campaign_id: string;
  timestamp: string;
  event_type: CameraEventType;
  event_name: string;
  zone: string;
  distance_m: number | null;
  angle_degree: number | null;
  confidence_score: number | null;
  action_taken: string;
  severity: "success" | "info" | "warning";
};

export const CAMERA_PLACEHOLDER_SOURCE = "/camera/robot-pov-placeholder.png";

export function getSelectedCamera(cameras: LiveCamera[], cameraId?: string) {
  return cameras.find((camera) => camera.camera_id === cameraId) ?? cameras[0] ?? null;
}

export function getCameraEvents(events: CameraEvent[], cameraId: string) {
  return events
    .filter((event) => event.camera_id === cameraId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getLatestCameraEvent(events: CameraEvent[], cameraId: string) {
  const cameraEvents = getCameraEvents(events, cameraId);
  return cameraEvents[cameraEvents.length - 1] ?? null;
}

export function getCameraCurrentAction(latestEvent: CameraEvent | null) {
  if (!latestEvent) return "Waiting for camera feed";

  const actions: Record<CameraEventType, string> = {
    camera_online: "Route Moving",
    customer_detected: "Customer Detected",
    script_played: "Invitation Script Playing",
    sampling_interest: "Sampling Interest",
    obstacle_detected: "Obstacle Detected",
    robot_resumed: "Route Moving",
    signal_warning: "Signal Warning",
    battery_warning: "Battery Warning",
    battery_low: "Battery Low",
    stream_connected: "Camera Stream Connected",
    stream_disconnected: "Camera Stream Offline"
  };

  return actions[latestEvent.event_type];
}

export function getCameraSafetyStatus(
  camera: Pick<LiveCamera, "battery_percent" | "safety_status">,
  latestEvent: CameraEvent | null
): SafetyStatus {
  if (camera.battery_percent < 30) return "warning";
  if (!latestEvent) return camera.safety_status;
  if (latestEvent.event_type === "obstacle_detected") return "warning";
  if (latestEvent.event_type === "signal_warning") return "warning";
  if (latestEvent.event_type === "battery_warning") return "warning";
  if (latestEvent.event_type === "battery_low") return "warning";
  if (latestEvent.event_type === "stream_disconnected") return "warning";
  if (latestEvent.event_type === "robot_resumed" || latestEvent.event_type === "stream_connected") return "safe";
  return camera.safety_status;
}

export function getCameraOverlayState(latestEvent: CameraEvent | null): CameraOverlayState {
  if (!latestEvent) return "none";

  const overlays: Partial<Record<CameraEventType, CameraOverlayState>> = {
    customer_detected: "detection_box",
    script_played: "script_wave",
    sampling_interest: "success_marker",
    obstacle_detected: "warning_marker",
    signal_warning: "warning_marker",
    battery_warning: "warning_marker",
    battery_low: "warning_marker",
    stream_disconnected: "offline"
  };

  return overlays[latestEvent.event_type] ?? "none";
}

export function getCameraMediaType(
  camera: Pick<LiveCamera, "stream_type" | "video_url" | "image_url" | "hls_url">
): CameraMediaType {
  if (camera.stream_type === "mock_video" && camera.video_url) return "video";
  if (camera.stream_type === "external_hls" && camera.hls_url) return "hls";
  if (camera.image_url) return "image";
  return "placeholder";
}

export function getCameraMediaSource(
  camera: Pick<LiveCamera, "stream_type" | "video_url" | "image_url" | "hls_url">
) {
  if (camera.stream_type === "mock_image") return camera.image_url ?? CAMERA_PLACEHOLDER_SOURCE;
  if (camera.stream_type === "mock_video") return camera.video_url ?? camera.image_url ?? CAMERA_PLACEHOLDER_SOURCE;
  if (camera.stream_type === "external_hls") return camera.hls_url ?? camera.image_url ?? CAMERA_PLACEHOLDER_SOURCE;
  return camera.image_url ?? CAMERA_PLACEHOLDER_SOURCE;
}

export function getCameraHealth(cameras: LiveCamera[], events: CameraEvent[]) {
  return cameras.map((camera) => {
    const latestEvent = getLatestCameraEvent(events, camera.camera_id);
    const safetyStatus = getCameraSafetyStatus(camera, latestEvent);
    const cameraStatus = getCameraStatus(camera, latestEvent);
    const alert = getCameraAlert(camera, latestEvent, safetyStatus);

    return {
      camera_id: camera.camera_id,
      robot_id: camera.robot_id,
      branch_id: camera.branch_id,
      cameraStatus,
      currentAction: getCameraCurrentAction(latestEvent),
      safetyStatus,
      overlay: getCameraOverlayState(latestEvent),
      alert,
      batteryPercent: camera.battery_percent,
      signalStrength: camera.signal_strength,
      mediaType: getCameraMediaType(camera),
      mediaSource: getCameraMediaSource(camera),
      latestEvent
    };
  });
}

export function getCameraMetrics(cameras: LiveCamera[], events: CameraEvent[]) {
  const health = getCameraHealth(cameras, events);
  const totalCameras = cameras.length;
  const camerasOnline = health.filter((camera) => camera.cameraStatus === "live").length;
  const avgBattery = totalCameras
    ? Math.round(cameras.reduce((total, camera) => total + camera.battery_percent, 0) / totalCameras)
    : 0;
  const avgSignal = getAverageSignal(cameras);
  const detectionEvents = events.filter((event) => event.event_type === "customer_detected").length;
  const safetyAlerts = events.filter((event) =>
    ["obstacle_detected", "signal_warning", "battery_warning", "battery_low", "stream_disconnected"].includes(event.event_type)
  ).length;

  return {
    camerasOnline,
    totalCameras,
    avgBattery,
    avgSignal,
    detectionEvents,
    safetyAlerts
  };
}

function getCameraStatus(camera: Pick<LiveCamera, "camera_status">, latestEvent: CameraEvent | null): CameraStatus {
  if (latestEvent?.event_type === "stream_disconnected") return "offline";
  if (latestEvent?.event_type === "signal_warning") return "warning";
  if (latestEvent?.event_type === "stream_connected") return "live";
  return camera.camera_status;
}

function getCameraAlert(
  camera: Pick<LiveCamera, "battery_percent">,
  latestEvent: CameraEvent | null,
  safetyStatus: SafetyStatus
) {
  if (camera.battery_percent < 30) return "battery_low";
  if (latestEvent?.event_type === "stream_disconnected") return "stream_disconnected";
  if (safetyStatus === "warning") return latestEvent?.event_type ?? "warning";
  return null;
}

function getAverageSignal(cameras: Pick<LiveCamera, "signal_strength">[]) {
  if (!cameras.length) return "weak";

  const scoreBySignal: Record<SignalStrength, number> = {
    weak: 1,
    medium: 2,
    strong: 3
  };
  const average = cameras.reduce((total, camera) => total + scoreBySignal[camera.signal_strength], 0) / cameras.length;

  if (average >= 2.5) return "strong";
  if (average >= 1.5) return "medium";
  return "weak";
}
