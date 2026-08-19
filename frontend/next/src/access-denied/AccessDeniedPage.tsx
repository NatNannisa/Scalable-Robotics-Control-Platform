import Link from "next/link";
import type { DashboardPage } from "@/components/space-dashboard/SpaceDashboard";
import type { UserRole } from "@/src/auth/types";

export function AccessDeniedPage({ role, attemptedRoute }: { role: UserRole; attemptedRoute: DashboardPage | string }) {
  return (
    <section className="mx-auto mt-10 max-w-3xl rounded-[28px] border border-danger/30 bg-danger/10 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-danger/40 bg-danger/15 text-3xl font-black text-danger">!</div>
      <h2 className="text-3xl font-black text-white">Access Denied</h2>
      <p className="mt-3 text-slate-300">Role <b className="text-white">{role}</b> is not permitted to open <b className="text-white">{attemptedRoute}</b>.</p>
      <p className="mt-2 text-sm text-slate-400">Menus are hidden for convenience, but route access is also checked at render time.</p>
      <Link href="/control-center" className="mt-6 inline-flex rounded-full border border-cyan/30 bg-cyan/15 px-5 py-2 text-sm font-bold text-cyan">
        Back to Control Center
      </Link>
    </section>
  );
}
