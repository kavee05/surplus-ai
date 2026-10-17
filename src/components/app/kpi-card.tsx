import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  action,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "forecast" | "success" | "warning";
  action?: React.ReactNode;
  className?: string;
}) {
  const toneCls = {
    default: "bg-brand-soft text-brand",
    forecast: "bg-forecast-soft text-forecast-ink",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  }[tone];
  return (
    <div className={cn("flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 shadow-card", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn("grid size-8 place-items-center rounded-lg", toneCls)}>
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <div className="tabular text-2xl font-semibold tracking-tight">{value}</div>
      {(hint || action) && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="min-w-0">{hint}</span>
          {action}
        </div>
      )}
    </div>
  );
}
