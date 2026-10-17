import { cn } from "@/lib/utils";

export type Tone = "neutral" | "brand" | "forecast" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  brand: "border-brand/25 bg-brand-soft text-brand-strong",
  forecast: "border-forecast/50 bg-forecast-soft text-forecast-ink",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
  info: "border-info/30 bg-info-soft text-info",
};

export function StatusBadge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export const riskTone = (r: "High" | "Medium" | "Low" | null): Tone => (r === "High" ? "success" : r === "Medium" ? "warning" : r === "Low" ? "danger" : "neutral");
