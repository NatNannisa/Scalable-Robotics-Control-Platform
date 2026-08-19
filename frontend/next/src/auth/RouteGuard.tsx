"use client";

import type { ReactNode } from "react";
import type { DashboardPage } from "@/components/space-dashboard/SpaceDashboard";
import { AccessDeniedPage } from "@/src/access-denied/AccessDeniedPage";
import { canAccessDashboardPage } from "@/src/auth/permissions";
import type { ControlRoomSession } from "@/src/auth/types";

export function RouteGuard({ page, session, children }: { page: DashboardPage; session: ControlRoomSession; children: ReactNode }) {
  if (!canAccessDashboardPage(session.role, page)) {
    return <AccessDeniedPage role={session.role} attemptedRoute={page} />;
  }

  return <>{children}</>;
}
