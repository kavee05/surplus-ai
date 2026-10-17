import { Check } from "lucide-react";
import { materialById, type EngineData } from "@/lib/engine/context";
import { dateMs, fmtDate, fmtMonth, fmtNum } from "@/lib/format";
import type { Forecast, Phase } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Shared timeline markup. Server-safe: no hooks. Interactivity is injected by the caller. */

export interface TimelineNeed {
  siteId: string;
  phaseId: string;
  materialId: string;
  qty: number;
  neededBy: string;
}

export interface TimelineProps {
  data: Pick<EngineData, "sites" | "phases" | "materials" | "today">;
  forecasts: Forecast[];
  materialId?: string; // "all" or a material id
  siteId?: string; // "all" or a site id
  need?: TimelineNeed;
  highlightForecastId?: string;
  from?: string;
  to?: string;
  compact?: boolean;
}

export interface MarkerInfo {
  f: Forecast;
  label: string;
  confirmed: boolean;
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
  unit: string;
  name: string;
}

export interface NeedInfo {
  label: string;
  className: string;
  style: React.CSSProperties;
}

const MIN_R = 7;
const MAX_R = 18;

export function todayPosition(today: string, from = "2026-09-01", to = "2027-03-31") {
  const start = dateMs(from);
  const end = dateMs(to);
  return Math.min(100, Math.max(0, ((dateMs(today) - start) / (end - start)) * 100));
}

export function TimelineCore({
  data,
  forecasts,
  materialId = "all",
  siteId = "all",
  need,
  highlightForecastId,
  from = "2026-09-01",
  to = "2027-03-31",
  compact = false,
  renderMarker,
  renderNeed,
}: TimelineProps & { renderMarker: (m: MarkerInfo) => React.ReactNode; renderNeed: (n: NeedInfo) => React.ReactNode }) {
  const start = dateMs(from);
  const end = dateMs(to);
  const pos = (d: string) => Math.min(100, Math.max(0, ((dateMs(d) - start) / (end - start)) * 100));

  const visibleF = forecasts.filter((f) => (materialId === "all" || f.materialId === materialId) && (siteId === "all" || f.siteId === siteId));
  const maxQtyByMat = new Map<string, number>();
  for (const f of forecasts) maxQtyByMat.set(f.materialId, Math.max(maxQtyByMat.get(f.materialId) ?? 0, f.qty));

  // Rows: phases that overlap the window, filtered; the buyer's phase is always shown.
  const rows: Phase[] = data.phases
    .filter((p) => p.plannedEnd >= from && p.start <= to)
    .filter((p) => siteId === "all" || p.siteId === siteId || p.id === need?.phaseId)
    .filter((p) => materialId === "all" || visibleF.some((f) => f.phaseId === p.id) || p.id === need?.phaseId)
    .sort((a, b) => {
      const ta = data.sites.findIndex((s) => s.id === a.siteId);
      const tb = data.sites.findIndex((s) => s.id === b.siteId);
      return ta - tb || a.start.localeCompare(b.start);
    });

  const months: string[] = [];
  for (let d = from; d <= to; ) {
    months.push(d);
    const [y, m] = d.split("-").map(Number);
    d = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  }

  const rowH = compact ? 40 : 48;
  const labelW = compact ? "w-32 sm:w-40" : "w-32 sm:w-52";

  return (
    <>
      <div className={cn("relative", compact ? "min-w-[520px]" : "min-w-[760px]")}>
        <div className="flex border-b text-xs text-muted-foreground">
          <div data-label-col className={cn("sticky left-0 z-20 shrink-0 border-r bg-card px-3 py-2 font-medium text-foreground", labelW)}>
            Township and phase
          </div>
          <div className="relative flex-1">
            {months.map((m) => (
              <span key={m} className="absolute top-2 pl-1.5" style={{ left: `${pos(m)}%` }}>
                {fmtMonth(m)}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          {rows.map((p) => {
            const site = data.sites.find((s) => s.id === p.siteId)!;
            const rowF = visibleF.filter((f) => f.phaseId === p.id);
            const left = pos(p.start);
            const right = pos(p.plannedEnd);
            return (
              <div key={p.id} className="flex border-b last:border-b-0" style={{ height: rowH }}>
                <div className={cn("sticky left-0 z-20 flex shrink-0 flex-col justify-center border-r bg-card px-3", labelW)}>
                  <span className="truncate text-sm font-medium">{site.township}</span>
                  <span className="truncate text-xs text-muted-foreground">{p.name}</span>
                </div>
                <div className="relative flex-1">
                  {months.map((m) => (
                    <span key={m} className="absolute inset-y-0 w-px bg-border/60" style={{ left: `${pos(m)}%` }} aria-hidden />
                  ))}
                  <div
                    className={cn(
                      "tl-bar absolute top-1/2 h-3 -translate-y-1/2 rounded-full",
                      p.status === "planned" && "border border-dashed border-brand/50 bg-brand-soft",
                      p.status === "active" && "bg-brand/80",
                      p.status === "completed" && "bg-[var(--stone-300)]",
                    )}
                    style={{ left: `${left}%`, width: `${Math.max(0.8, right - left)}%` }}
                    aria-hidden
                  />
                  {need?.phaseId === p.id &&
                    renderNeed({
                      label: `Need: ${fmtNum(need.qty)} ${materialById(data, need.materialId).unit} by ${fmtDate(need.neededBy)}`,
                      className: "absolute top-1/2 z-10 size-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] border-2 border-card bg-foreground",
                      style: { left: `${pos(need.neededBy)}%` },
                    })}
                  {rowF.map((f) => {
                    const m = materialById(data, f.materialId);
                    const rel = f.qty / (maxQtyByMat.get(f.materialId) || 1);
                    const r = MIN_R + Math.sqrt(rel) * (MAX_R - MIN_R) * (compact ? 0.85 : 1);
                    const confirmed = f.status !== "Forecast";
                    return (
                      <span key={f.id} className="contents">
                        {renderMarker({
                          f,
                          name: m.name,
                          unit: m.unit,
                          confirmed,
                          label: `${m.name}: ${fmtNum(f.qty)} ${m.unit} ${confirmed ? f.status.toLowerCase() : "forecast"} at ${site.township}, from ${fmtDate(f.availableFrom)}, progress-based score ${f.confidence.toFixed(2)}`,
                          className: cn(
                            "absolute top-1/2 z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2",
                            confirmed ? "border-success bg-success text-white" : "border-forecast-ink/40",
                            highlightForecastId === f.id && "ring-4 ring-forecast/35",
                          ),
                          style: {
                            left: `${pos(f.availableFrom)}%`,
                            width: r * 2,
                            height: r * 2,
                            backgroundColor: confirmed ? undefined : `color-mix(in oklab, var(--forecast) ${Math.round(25 + f.confidence * 75)}%, white)`,
                          },
                          children: confirmed ? <Check className="size-3.5" aria-hidden /> : null,
                        })}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className={cn("pointer-events-none absolute inset-y-0", compact ? "left-32 sm:left-40" : "left-32 sm:left-52")} style={{ right: 0 }} aria-hidden>
            <div className="relative h-full w-full">
              <div className="absolute inset-y-0 w-px bg-danger" style={{ left: `${pos(data.today)}%` }} />
            </div>
          </div>
        </div>
      </div>
      {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No phases match these filters.</p>}
    </>
  );
}

/** Non-interactive timeline for server rendering (landing page). */
export function RadarTimelineStatic({ className, ...props }: TimelineProps & { className?: string }) {
  return (
    <div className={cn("blueprint relative overflow-x-auto rounded-xl border", className)}>
      <TimelineCore
        {...props}
        renderMarker={(m) => (
          <span role="img" aria-label={m.label} title={m.label} className={m.className} style={m.style}>
            {m.children}
          </span>
        )}
        renderNeed={(n) => <span role="img" aria-label={n.label} title={n.label} className={n.className} style={n.style} />}
      />
    </div>
  );
}

export function RadarLegend({ today, className }: { today: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-full bg-brand/80" /> Active phase
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-full border border-dashed border-brand/50 bg-brand-soft" /> Planned phase
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-full border border-forecast-ink/40 bg-forecast" /> Forecast surplus (size: quantity, shade: progress-based score)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="grid size-3 place-items-center rounded-full bg-success" /> Confirmed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rotate-45 rounded-[2px] bg-foreground" /> Buyer need date
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-px bg-danger" /> Today, {fmtDate(today)}
      </span>
    </div>
  );
}
