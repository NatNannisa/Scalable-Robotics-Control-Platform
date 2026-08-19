import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-cyan-300/15 bg-slate-950/45 shadow-[0_20px_70px_rgba(2,8,23,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </section>
  );
}

export function DashboardCard({
  title,
  eyebrow,
  action,
  children,
  className = ""
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={className}>
      {title ? (
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            {eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">{eyebrow}</div> : null}
            <h2 className="mt-1 text-base font-bold text-white">{title}</h2>
          </div>
          {action}
        </div>
      ) : null}
      <div className={title ? "p-5" : ""}>{children}</div>
    </GlassCard>
  );
}
