import { cn } from "@/lib/utils";

/** A tiny trend line for KPI cards. Decorative: the value next to it carries the meaning. */
export function Sparkline({ values, className, tone = "brand" }: { values: number[]; className?: string; tone?: "brand" | "success" | "forecast" }) {
  if (values.length < 2) return null;
  const w = 80;
  const h = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const color = { brand: "var(--brand)", success: "var(--success)", forecast: "var(--forecast-ink)" }[tone];
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-6 w-20 overflow-visible", className)} aria-hidden>
      <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={color} fillOpacity="0.08" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  );
}
