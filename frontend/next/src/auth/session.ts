"use client";

import type { ControlRoomSession, UserRole } from "@/src/auth/types";

const roleKey = "cp-control-room-role";
const validRoles: UserRole[] = ["owner", "operations", "store_manager", "supplier", "viewer"];

export function getCurrentUserSession(): ControlRoomSession {
  const storedRole = typeof window !== "undefined" ? window.localStorage.getItem(roleKey) : null;
  const role = validRoles.includes(storedRole as UserRole) ? (storedRole as UserRole) : "operations";

  return {
    userId: `demo-${role}`,
    displayName: role === "supplier" ? "Supplier Partner" : "Control Room Operator",
    role,
    branchIds: role === "supplier" ? ["BR-BANGNA"] : ["BR-BANGNA", "BR-CHIANGMAI", "BR-ONLINE-TEST"]
  };
}

export function setDemoRole(role: UserRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(roleKey, role);
  window.location.reload();
}
