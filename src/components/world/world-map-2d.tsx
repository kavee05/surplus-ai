"use client";

import { useMemo } from "react";
import type { World, WorldSelection } from "@/lib/engine/world";
import { fmtNum, fmtRm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { along, layoutWorld, WORLD_D, WORLD_W, type Placed } from "./layout";
import { C, lorryColour, lorryMoving, MATERIAL } from "./palette";

/**
 * The light view: the same world seen from straight above, drawn in SVG. Every
 * object is a real button, so it works with a keyboard and a screen reader,
 * and it is what low-powered devices get instead of the 3D scene.
 */

const S = 30; // px per world unit
const W = WORLD_W * S;
const H = WORLD_D * S;
const px = (x: number) => Math.round((x + WORLD_W / 2) * S * 10) / 10;
const pz = (z: number) => Math.round((z + WORLD_D / 2) * S * 10) / 10;

function path(c: { from: { x: number; z: number }; ctrl: { x: number; z: number }; to: { x: number; z: number } }) {
  return `M ${px(c.from.x)} ${pz(c.from.z)} Q ${px(c.ctrl.x)} ${pz(c.ctrl.z)} ${px(c.to.x)} ${pz(c.to.z)}`;
}

export function WorldMap2D({
  world,
  selection,
  onSelect,
  labels,
  animate,
  className,
}: {
  world: World;
  selection: WorldSelection | null;
  onSelect: (s: WorldSelection | null) => void;
  labels: Map<string, string>;
  animate: boolean;
  className?: string;
}) {
  const layout = useMemo(() => layoutWorld(world), [world]);
  const isSel = (p: Placed) => selection?.kind === p.sel.kind && selection.id === p.sel.id;
  const key = (p: Placed) => `${p.sel.kind}:${p.sel.id}`;

  const hit = (p: Placed, child: React.ReactNode, r = 14) => (
    <g
      key={key(p)}
      role="button"
      tabIndex={0}
      aria-label={labels.get(key(p)) ?? p.sel.id}
      aria-pressed={isSel(p)}
      className="world-hit cursor-pointer outline-none"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSel(p) ? null : p.sel);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(isSel(p) ? null : p.sel);
        }
      }}
    >
      <circle cx={px(p.x)} cy={pz(p.z)} r={r} fill="transparent" />
      <circle className="world-focus" cx={px(p.x)} cy={pz(p.z)} r={r + 2} fill="none" stroke={C.select} strokeWidth="2.5" opacity={isSel(p) ? 1 : 0} />
      {child}
    </g>
  );

  const site = (id: string) => world.sites.find((s) => s.id === id)!;
  const pile = (id: string) => world.sites.flatMap((s) => s.piles).find((p) => p.id === id)!;
  const ghost = (id: string) => world.sites.flatMap((s) => s.ghosts).find((g) => g.id === id)!;
  const transfer = (id: string) => world.transfers.find((t) => t.id === id)!;

  // Draw order: yard items first, buildings on top, lorries and landfill last.
  const order = { pile: 0, ghost: 0, need: 1, site: 2, transfer: 3, landfill: 3 } as const;
  const objects = [...layout.objects].sort((a, b) => order[a.sel.kind] - order[b.sel.kind]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="Surplus World, seen from above. Each object is a button that opens its details."
      className={cn("block h-auto w-full select-none", className)}
      onClick={() => onSelect(null)}
    >
      <defs>
        <pattern id="w2-grid" width={S * 2} height={S * 2} patternUnits="userSpaceOnUse">
          <path d={`M ${S * 2} 0 L 0 0 0 ${S * 2}`} fill="none" stroke={C.groundEdge} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} rx="18" fill={C.ground} />
      <rect width={W} height={H} rx="18" fill="url(#w2-grid)" opacity="0.6" />

      {layout.roads.map((r, i) => (
        <path key={i} d={path(r)} fill="none" stroke={C.road} strokeWidth="7" strokeLinecap="round" opacity="0.7" />
      ))}
      {world.transfers.map((t) => {
        const r = layout.routes[t.id];
        const col = lorryColour(t.status, t.onForecast);
        return (
          <g key={`route-${t.id}`}>
            <path id={`w2-route-${t.id}`} d={path(r)} fill="none" stroke={col} strokeWidth="2.5" strokeDasharray={t.onForecast ? "7 5" : undefined} strokeLinecap="round" />
            {animate && lorryMoving(t.status) && (
              <circle r="4" fill={col} stroke="#fff" strokeWidth="1.5">
                <animateMotion dur="7s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear">
                  <mpath href={`#w2-route-${t.id}`} />
                </animateMotion>
              </circle>
            )}
          </g>
        );
      })}

      {objects.map((p) => {
        const x = px(p.x);
        const y = pz(p.z);
        switch (p.sel.kind) {
          case "site": {
            const s = site(p.sel.id);
            const h = 26;
            const fill = (s.progressPct / 100) * h;
            return hit(
              p,
              <>
                <rect x={x - 13} y={y - 13} width="26" height="26" rx="6" fill={C.pad} stroke={C.ink} strokeWidth="1.5" />
                <rect x={x - 11} y={y + 13 - 2 - Math.max(0, fill - 4)} width="22" height={Math.max(0, fill - 4)} rx="3" fill={C.brand} opacity="0.85" />
                <text x={x} y={y + 30} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={C.ink} paintOrder="stroke" stroke={C.ground} strokeWidth="4" strokeLinejoin="round">
                  {s.name}
                </text>
                <text x={x} y={y + 44} textAnchor="middle" fontSize="10.5" fill="#475569" paintOrder="stroke" stroke={C.ground} strokeWidth="4" strokeLinejoin="round">
                  {s.phaseStatus === "planned" ? "Not started" : s.phaseStatus === "completed" ? "Completed" : `${s.progressPct}% built`}
                </text>
              </>,
              18,
            );
          }
          case "pile": {
            const it = pile(p.sel.id);
            const sz = 7 + it.scale * 9;
            return hit(
              p,
              <rect x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} rx="2.5" fill={MATERIAL[it.category]} stroke={it.status === "reserved" ? C.brandStrong : C.available} strokeWidth="2.5" />,
              11,
            );
          }
          case "ghost": {
            const it = ghost(p.sel.id);
            const sz = 7 + it.scale * 9;
            return hit(
              p,
              <rect x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} rx="2.5" fill={C.forecast} fillOpacity="0.22" stroke={C.forecastInk} strokeWidth="1.5" strokeDasharray="3 2" />,
              11,
            );
          }
          case "need":
            return hit(
              p,
              <>
                <line x1={x - 3} y1={y + 7} x2={x - 3} y2={y - 7} stroke={C.ink} strokeWidth="1.5" />
                <path d={`M ${x - 3} ${y - 7} L ${x + 7} ${y - 3.5} L ${x - 3} ${y}`} fill={C.need} />
              </>,
              10,
            );
          case "transfer": {
            const t = transfer(p.sel.id);
            const r = layout.routes[t.id];
            const a = along(r, 0.48);
            const b = along(r, 0.52);
            const ang = (Math.atan2(pz(b.z) - pz(a.z), px(b.x) - px(a.x)) * 180) / Math.PI;
            return hit(
              p,
              <g transform={`translate(${x} ${y}) rotate(${ang})`}>
                <rect x="-10" y="-5.5" width="14" height="11" rx="2" fill={lorryColour(t.status, t.onForecast)} stroke="#fff" strokeWidth="1.5" />
                <rect x="4" y="-4.5" width="6" height="9" rx="1.5" fill={C.ink} stroke="#fff" strokeWidth="1.5" />
              </g>,
              13,
            );
          }
          case "landfill": {
            const rad = 16 + (1 - world.impact.reusedShare) * 22;
            const left = layout.landfill.x < 0;
            const top = layout.landfill.z < 0;
            const ty = top ? y + rad + 18 : y - rad - 22;
            return hit(
              p,
              <>
                <ellipse cx={x} cy={y} rx={rad} ry={rad * 0.72} fill={C.landfill} opacity="0.85" />
                <ellipse cx={x - rad * 0.15} cy={y - rad * 0.12} rx={rad * 0.55} ry={rad * 0.38} fill={C.landfillTop} />
                <text x={x + (left ? -rad : rad)} y={ty} textAnchor={left ? "start" : "end"} fontSize="11" fill="#475569" paintOrder="stroke" stroke={C.ground} strokeWidth="4" strokeLinejoin="round">
                  Landfill
                </text>
                <text x={x + (left ? -rad : rad)} y={ty + 15} textAnchor={left ? "start" : "end"} fontSize="12.5" fontWeight="700" fill={C.success} paintOrder="stroke" stroke={C.ground} strokeWidth="4" strokeLinejoin="round">
                  {fmtRm(world.impact.savedRm)} kept out
                </text>
              </>,
              rad,
            );
          }
        }
      })}
      <text x={W - 14} y={H - 12} textAnchor="end" fontSize="10.5" fill="#64748b">
        {`Simulated data. Positions approximate. ${fmtNum(world.sites.length)} sites.`}
      </text>
    </svg>
  );
}
