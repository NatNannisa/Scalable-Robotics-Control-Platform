import Image from "next/image";
import { cn } from "@/src/lib/utils";

export type RobotAssetVariant = "shrimpyJoy" | "missionToSpace" | "duo" | "mascot";
export type RobotAssetSize = "sm" | "md" | "lg";

const robotAssetMap: Record<RobotAssetVariant, string> = {
  shrimpyJoy: "/references/robot-shrimpy-joy.png",
  missionToSpace: "/references/robot-mission-space.png",
  duo: "/references/robot-duo.png",
  mascot: "/references/robot-mascot.png"
};

const sizeClasses: Record<RobotAssetSize, string> = {
  sm: "h-14 w-14",
  md: "h-32 w-28",
  lg: "h-56 w-44"
};

const imageSizes: Record<RobotAssetSize, number> = {
  sm: 56,
  md: 128,
  lg: 220
};

export default function RobotAsset({
  variant,
  size = "md",
  className,
  priority = false
}: {
  variant: RobotAssetVariant;
  size?: RobotAssetSize;
  className?: string;
  priority?: boolean;
}) {
  const dimension = imageSizes[size];

  return (
    <div className={cn("relative shrink-0 overflow-visible bg-transparent p-1 drop-shadow-[0_18px_28px_rgba(35,216,255,0.18)]", sizeClasses[size], className)}>
      <Image
        src={robotAssetMap[variant]}
        alt={`CP robot ${variant}`}
        width={dimension}
        height={dimension}
        className="h-full w-full object-contain"
        priority={priority}
      />
    </div>
  );
}
