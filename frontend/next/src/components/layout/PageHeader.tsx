import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/75">CP Hypermarket</div>
        <h1 className="mt-2 text-3xl font-black text-white">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
