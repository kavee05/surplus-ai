import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimulatedBadge({ className, label = "Simulated data" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-forecast/50 bg-forecast-soft px-2 py-0.5 text-xs font-medium whitespace-nowrap text-forecast-ink",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      {label}
    </span>
  );
}
