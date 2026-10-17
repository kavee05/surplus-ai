import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimulatedBadge({ className, label = "Simulated data" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-dashed border-forecast-ink/50 px-1.5 py-px text-[11px] font-medium whitespace-nowrap text-forecast-ink",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      {label}
    </span>
  );
}
