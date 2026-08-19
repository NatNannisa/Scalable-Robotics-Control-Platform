"use client";

import { AccessDeniedPage } from "@/src/access-denied/AccessDeniedPage";
import { getCurrentUserSession } from "@/src/auth/session";

export default function AccessDeniedRoute() {
  const session = getCurrentUserSession();
  return (
    <main className="min-h-screen bg-[#050712] p-6 text-slate-100">
      <AccessDeniedPage role={session.role} attemptedRoute="manual navigation" />
    </main>
  );
}
