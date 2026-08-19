import { Bell, Power, Settings } from "lucide-react";
import type { PageKey } from "@/components/Sidebar";
import { pageTitles } from "@/components/Sidebar";

export default function TopSessionBar({ uptime, activePage }: { uptime: string; activePage: PageKey }) {
  const meta = pageTitles[activePage];

  return (
    <header className="flex flex-col gap-3 border-b border-slate-800/80 bg-[#061124]/82 px-6 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white">{meta.title}</h1>
          {activePage === "data-science-lab" ? (
            <span className="rounded-lg border border-purple/35 bg-purple/15 px-3 py-1 text-xs font-bold text-purple">Private Lab</span>
          ) : (
            <span className="rounded-lg border border-green/40 bg-green/15 px-3 py-1 text-xs font-bold text-green shadow-live">LIVE</span>
          )}
          <span className="text-cyan">〰</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden rounded-lg border border-green/40 bg-green/15 px-4 py-2 text-sm font-bold text-green lg:block">● LIVE</div>
        <div className="hidden border-l border-slate-800 px-5 text-right lg:block">
          <div className="text-xl font-bold text-white">10:20:01</div>
          <div className="text-xs text-slate-400">24 พฤษภาคม 2567</div>
        </div>
        <div className="hidden rounded-lg border border-slate-800 bg-slate-950/55 px-3 py-2 text-xs text-slate-400 2xl:block">
          Uptime <span className="font-semibold text-green">{uptime}</span>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan" title="Notifications">
          <Bell size={18} />
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan" title="Settings">
          <Settings size={18} />
        </button>
        <button className="flex h-10 items-center gap-2 rounded-md bg-danger px-4 text-sm font-bold text-white shadow-danger">
          <Power size={17} />
          End Session
        </button>
      </div>
    </header>
  );
}
