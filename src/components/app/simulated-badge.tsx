import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimulatedBadge({ className, label = "Simulated data" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-amber-800",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      {label}
    </span>
  );
}
