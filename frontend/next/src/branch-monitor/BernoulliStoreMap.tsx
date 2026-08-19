import { Bot } from "lucide-react";
import type { BranchSnapshot } from "@/src/branch-monitor/types";

const zoneLabels = ["โซนเครื่องดื่ม", "โซนของใช้ในบ้าน", "โซนเบเกอรี่", "โซนอาหารสด"];

export function BernoulliStoreMap({ snapshot }: { snapshot: BranchSnapshot }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-cyan/20 bg-[#020a1c]/90 p-4 shadow-[0_28px_80px_rgba(0,0,0,.32),inset_0_1px_0_rgba(255,255,255,.08)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">3D Store Map <span className="rounded-full border border-green/40 bg-green/15 px-2 py-1 text-[10px] text-green">LIVE</span></h2>
          <p className="text-sm text-slate-400">แผนที่ร้านค้าแบบ 3 มิติ (Digital Twin)</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs">ชั้น 1</button>
          <button className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs">⛶</button>
        </div>
      </div>
      <div className="relative h-[360px] overflow-hidden rounded-[18px] border border-blue-500/30 bg-[radial-gradient(circle_at_46%_36%,rgba(0,180,255,.25),transparent_34%),linear-gradient(145deg,#041538,#010716)]">
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(0,157,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,157,255,.16)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="absolute left-[7%] top-[10%] h-[70%] w-[86%] -skew-y-6 rounded-2xl border border-cyan/30 bg-blue-950/20 shadow-[inset_0_0_70px_rgba(0,145,255,.18),0_30px_60px_rgba(0,0,0,.42)]" />
        {Array.from({ length: 42 }).map((_, index) => (
          <i
            key={index}
            className="absolute h-6 rounded border border-cyan/35 bg-cyan/5 shadow-[0_0_10px_rgba(53,213,255,.18)]"
            style={{ left: `${10 + (index % 7) * 12}%`, top: `${20 + Math.floor(index / 7) * 9}%`, width: index % 5 === 0 ? "9%" : "6%" }}
          />
        ))}
        <svg className="absolute inset-0 h-full w-full drop-shadow-[0_0_12px_rgba(53,213,255,.9)]" viewBox="0 0 100 100">
          <path d="M10 68 L22 58 L38 58 L48 47 L62 47 L70 58 L80 58 L88 45 L95 45" fill="none" stroke="#68e5ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
        </svg>
        <div className="absolute left-[42%] top-[48%] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-cyan bg-cyan/20 text-white shadow-[0_0_28px_rgba(53,213,255,.75)]">
          <Bot size={34} />
        </div>
        {zoneLabels.map((label, index) => (
          <span key={label} className="absolute rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs font-bold text-white shadow-[0_0_18px_rgba(53,213,255,.2)]" style={{ left: `${18 + index * 19}%`, top: `${index % 2 ? 24 : 56}%` }}>{label}</span>
        ))}
        <div className="absolute right-5 top-[45%] rounded-2xl border border-green/30 bg-green/10 px-3 py-2 text-xs font-black text-green">
          จุดชาร์จแบต
          <div className="text-base">100%</div>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-cyan/25 bg-slate-950/80 p-3 text-xs">
          <Bot className="text-cyan" size={24} />
          <div>
            <b className="text-white">{snapshot.robot.robotId}</b>
            <span className="ml-2 text-green">กำลังทำงาน</span>
            <div className="text-slate-400">กำลังเดินทางไป โซนเครื่องดื่ม</div>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          {["+", "-", "⛶"].map((label) => <button key={label} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-slate-950/70 text-white">{label}</button>)}
        </div>
      </div>
    </section>
  );
}
