import type { EngineData } from "@/lib/engine/context";
import { fmtNum } from "@/lib/format";
import type { Forecast } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The Surplus Network: a schematic site plan of the townships, placed by
 * approximate coordinates (plain SVG, no map API). Flow lines are transfers,
 * rings are forecast surplus. A ring turns solid green once confirmed.
 * Server-safe (no hooks), so the landing page can render it statically.
 */

const W = 640;
const H = 400;
const PAD = 44;
const BOUNDS = { minLat: 2.64, maxLat: 3.25, minLng: 101.24, maxLng: 102.03 };

/** Hand-placed label offsets so names never collide. */
const LABEL: Record<string, { dx: number; dy: number; anchor: "start" | "end" | "middle" }> = {
  elmina: { dx: -12, dy: -10, anchor: "end" },
  bbr: { dx: -12, dy: 18, anchor: "end" },
  kleast: { dx: 12, dy: -10, anchor: "start" },
  sjcc: { dx: 12, dy: -12, anchor: "start" },
  putra: { dx: -12, dy: 16, anchor: "end" },
  serenia: { dx: 12, dy: 18, anchor: "start" },
  nilai: { dx: 12, dy: 4, anchor: "start" },
  ainsdale: { dx: -12, dy: 18, anchor: "end" },
};

export function project(lat: number, lng: number) {
  const x = PAD + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (W - PAD * 2);
  const y = PAD + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (H - PAD * 2);
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

/** The point halfway along arc(a, b, bend). */
function arcMid(a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.18) {
  const cx = (a.x + b.x) / 2 - (b.y - a.y) * bend;
  const cy = (a.y + b.y) / 2 + (b.x - a.x) * bend;
  return { x: 0.25 * a.x + 0.5 * cx + 0.25 * b.x, y: 0.25 * a.y + 0.5 * cy + 0.25 * b.y, side: cx < (a.x + b.x) / 2 ? -1 : 1 };
}

/** A gentle curve between two points, bowing to one side. */
function arc(a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.18) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return `M ${a.x} ${a.y} Q ${mx - dy * bend} ${my + dx * bend} ${b.x} ${b.y}`;
}

export interface NetworkSuggestion {
  fromSiteId: string;
  toSiteId: string;
  label: string;
}

export function SurplusNetwork({
  data,
  forecasts,
  suggestion,
  highlightSiteIds = [],
  className,
  title = "Surplus Network: townships, transfers and forecast surplus",
}: {
  data: Pick<EngineData, "sites" | "transfers" | "assumptions" | "outcomes">;
  forecasts: Forecast[];
  suggestion?: NetworkSuggestion;
  highlightSiteIds?: string[];
  className?: string;
  title?: string;
}) {
  const pos = Object.fromEntries(data.sites.map((s) => [s.id, project(s.lat, s.lng)]));
  const value = (f: Forecast) => f.qty * data.assumptions.materials[f.materialId].unitCostRm;
  const rings = data.sites.map((s) => {
    const open = forecasts.filter((f) => f.siteId === s.id && f.status === "Forecast");
    const confirmed = forecasts.filter((f) => f.siteId === s.id && f.status !== "Forecast");
    const v = open.reduce((a, f) => a + value(f), 0);
    return { s, v, confirmed: confirmed.length > 0, r: v > 0 ? 9 + Math.sqrt(v) / 9 : 0 };
  });
  const active = data.transfers.filter((t) => t.status !== "Cancelled" && t.status !== "Completed");
  const completed = data.transfers.filter((t) => t.status === "Completed" && t.fromSiteId !== t.toSiteId);
  const tenKm = (0.09 / (BOUNDS.maxLat - BOUNDS.minLat)) * (H - PAD * 2);

  return (
    <div className="@container">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="net-title net-desc" className={cn("net-svg h-auto w-full", className)}>
      <title id="net-title">{title}</title>
      <desc id="net-desc">
        {`${data.sites.length} townships placed by approximate location. ${active.length} active transfers, ${completed.length} completed. Rings show forecast surplus value; green rings are confirmed by logged surplus.`}
      </desc>
      <defs>
        <pattern id="net-grid-sm" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="var(--brand)" strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
        <pattern id="net-grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="url(#net-grid-sm)" />
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="var(--brand)" strokeOpacity="0.1" strokeWidth="1" />
        </pattern>
        <marker id="net-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--brand)" />
        </marker>
        <marker id="net-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--forecast-ink)" />
        </marker>
      </defs>
      <rect width={W} height={H} fill="url(#net-grid)" />

      {/* Completed transfers: faint history */}
      {completed.map((t) => (
        <path key={t.id} d={arc(pos[t.fromSiteId], pos[t.toSiteId])} fill="none" stroke="var(--brand)" strokeOpacity="0.16" strokeWidth="1.25" />
      ))}

      {/* Forecast rings, solid green when confirmed */}
      {rings.map(({ s, r, v, confirmed }) => (
        <g key={`ring-${s.id}`} className="net-ring" data-confirmed={confirmed || undefined}>
          {r > 0 && (
            <circle cx={pos[s.id].x} cy={pos[s.id].y} r={r} fill="var(--forecast)" fillOpacity="0.12" stroke="var(--forecast-ink)" strokeOpacity="0.55" strokeWidth="1.25" strokeDasharray="3 3">
              <title>{`${s.township}: about RM ${fmtNum(Math.round(v))} of forecast surplus`}</title>
            </circle>
          )}
          <circle
            className="net-confirmed"
            cx={pos[s.id].x}
            cy={pos[s.id].y}
            r={Math.max(r, 12) + 3}
            fill="none"
            stroke="var(--success)"
            strokeWidth="2"
            style={{ transformOrigin: `${pos[s.id].x}px ${pos[s.id].y}px` }}
          />
        </g>
      ))}

      {/* Active transfers: real surplus solid teal, forecast holds dashed amber */}
      {active.map((t) => {
        const hold = !!t.forecastId && !t.listingId;
        return (
          <path
            key={t.id}
            d={arc(pos[t.fromSiteId], pos[t.toSiteId])}
            fill="none"
            stroke={hold ? "var(--forecast-ink)" : "var(--brand)"}
            strokeWidth="2"
            strokeDasharray={hold ? "5 4" : undefined}
            markerEnd={hold ? "url(#net-arrow-amber)" : "url(#net-arrow)"}
          />
        );
      })}

      {/* Suggested transfer (Pre-Order Check result), drawn as a proposal */}
      {suggestion && pos[suggestion.fromSiteId] && pos[suggestion.toSiteId] && (
        <g>
          <path d={arc(pos[suggestion.fromSiteId], pos[suggestion.toSiteId], -0.35)} fill="none" stroke="var(--forecast-ink)" strokeWidth="2.25" strokeDasharray="6 4" markerEnd="url(#net-arrow-amber)" />
          {(() => {
            const m = arcMid(pos[suggestion.fromSiteId], pos[suggestion.toSiteId], -0.35);
            return (
          <text
            x={m.x - m.side * 8}
            y={m.y + 4}
            textAnchor={m.side < 0 ? "start" : "end"}
            paintOrder="stroke"
            stroke="var(--card)"
            strokeWidth="4"
            strokeLinejoin="round"
            fontSize="12"
            fontWeight="600"
            fill="var(--forecast-ink)"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {suggestion.label}
          </text>
            );
          })()}
        </g>
      )}

      {/* Townships */}
      {data.sites.map((s) => {
        const p = pos[s.id];
        const l = LABEL[s.id] ?? { dx: 10, dy: 4, anchor: "start" as const };
        const hl = highlightSiteIds.includes(s.id);
        return (
          <g key={s.id}>
            <rect x={p.x - 5} y={p.y - 5} width="10" height="10" rx="2" fill={hl ? "var(--brand)" : "var(--ink)"} stroke="var(--card)" strokeWidth="2" />
            <text x={p.x + l.dx} y={p.y + l.dy} textAnchor={l.anchor} fontSize="12.5" fontWeight={hl ? 600 : 500} fill="var(--foreground)" paintOrder="stroke" stroke="var(--background)" strokeWidth="4" strokeLinejoin="round">
              {s.township}
            </text>
          </g>
        );
      })}

      {/* Scale bar */}
      <g transform={`translate(${W - PAD - tenKm}, ${H - 18})`}>
        <line x1="0" y1="0" x2={tenKm} y2="0" stroke="var(--muted-foreground)" strokeWidth="1.5" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--muted-foreground)" strokeWidth="1.5" />
        <line x1={tenKm} y1="-4" x2={tenKm} y2="4" stroke="var(--muted-foreground)" strokeWidth="1.5" />
        <text className="net-small" x={tenKm / 2} y="-7" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
          about 10 km
        </text>
      </g>
    </svg>
    </div>
  );
}

export function NetworkLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground", className)}>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] bg-[var(--ink)]" aria-hidden /> Township (approximate location)
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-0.5 w-5 bg-brand" aria-hidden /> Transfer of logged surplus
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-0 w-5 border-t-2 border-dashed border-forecast-ink" aria-hidden /> Hold on forecast surplus
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full border border-dashed border-forecast-ink bg-forecast/15" aria-hidden /> Forecast surplus (size: value)
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full border-2 border-success" aria-hidden /> Confirmed by logged surplus
      </li>
    </ul>
  );
}
