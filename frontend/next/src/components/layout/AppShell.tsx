"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { TopBar } from "@/src/components/layout/TopBar";

export function AppShell({ activePath, children }: { activePath: string; children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#030615] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_78%_4%,rgba(124,58,237,0.22),transparent_24%),linear-gradient(180deg,#07112b_0%,#040816_46%,#02030a_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-45 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:42px_42px]" />
      <Sidebar activePath={activePath} />
      <div className="relative xl:pl-72">
        <TopBar />
        <main className="mx-auto max-w-[1640px] px-5 py-6 lg:px-7">{children}</main>
      </div>
    </div>
  );
}
