import { Bell, CalendarDays, Search, Settings, UserRound } from "lucide-react";
import { LiveBadge } from "@/src/components/dashboard/LiveBadge";

export function SearchBar() {
  return (
    <label className="hidden min-w-[280px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 lg:flex">
      <Search size={16} className="text-cyan-200" />
      <input className="w-full bg-transparent outline-none placeholder:text-slate-500" placeholder="Search robot, branch, campaign" />
    </label>
  );
}

export function DateFilter() {
  return (
    <button className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 md:flex">
      <CalendarDays size={16} className="text-cyan-200" />
      Today
    </button>
  );
}

export function ProfileMenu() {
  return (
    <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-100">
      <UserRound size={18} />
    </button>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#060b1c]/80 px-6 backdrop-blur-xl">
      <div>
        <div className="flex items-center gap-3">
          <LiveBadge />
          <span className="text-sm font-semibold text-cyan-100/80">Session CP-AI-0613</span>
        </div>
        <div className="mt-1 text-xs text-slate-400">CP Hypermarket AI Robot Control Room</div>
      </div>
      <div className="flex items-center gap-3">
        <SearchBar />
        <DateFilter />
        <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-100">
          <Bell size={17} />
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-100">
          <Settings size={17} />
        </button>
        <ProfileMenu />
      </div>
    </header>
  );
}
