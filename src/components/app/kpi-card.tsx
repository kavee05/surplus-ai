import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * KPIs are laid out as one ruled strip (see KpiStrip), like the header row of a
 * material schedule, rather than as separate floating cards.
 */
export function KpiStrip({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("grid gap-px overflow-hidden rounded-xl border bg-border", className)}>{children}</div>;
}

const toneDot = {
  default: "bg-brand",
  forecast: "bg-forecast",
  success: "bg-success",
  warning: "bg-warning",
} as const;

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
  tone?: keyof typeof toneDot;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col bg-card px-3.5 py-3.5 sm:px-5 sm:py-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-start gap-2 text-[13px] text-muted-foreground sm:items-center">
          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full sm:mt-0", toneDot[tone])} aria-hidden />
          <span className="line-clamp-2 leading-snug sm:truncate">{label}</span>
        </span>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />}
      </div>
      <div className="tabular mt-3 text-[1.375rem] leading-none font-semibold tracking-[-0.025em] sm:text-[1.75rem]">{value}</div>
      {(hint || action) && (
        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="min-w-0">{hint}</span>
          {action}
        </div>
      )}
    </div>
  );
}
