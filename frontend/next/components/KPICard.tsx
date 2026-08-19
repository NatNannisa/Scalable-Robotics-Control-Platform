import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function KPICard({ label, value, detail, icon: Icon, tone = "cyan" }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: "cyan" | "green" | "amber" | "danger" | "purple" }) {
  const tones = {
    cyan: "text-cyan bg-cyan/10 border-cyan/25",
    green: "text-green bg-green/10 border-green/25",
    amber: "text-amber bg-amber/10 border-amber/25",
    danger: "text-danger bg-danger/10 border-danger/25",
    purple: "text-purple bg-purple/10 border-purple/25"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-bold text-white">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-md border ${tones[tone]}`}>
          <Icon size={19} />
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400">{detail}</div>
      </Card>
    </motion.div>
  );
}
