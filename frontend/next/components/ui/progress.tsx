import { cn } from "@/src/lib/utils";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-slate-800", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className="h-full rounded-full bg-cyan shadow-glow transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
