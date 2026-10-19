"use client";

import { Box, Map as MapIcon, Maximize2, Minimize2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildWorld, worldObjects, type WorldSelection } from "@/lib/engine/world";
import { fmtRm } from "@/lib/format";
import { useForecasts, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { landfillRadius, layoutWorld, siteLabelY } from "./layout";
import { WorldCard } from "./world-card";
import { WorldMap2D } from "./world-map-2d";

// three.js only downloads when the 3D view is actually used.
const WorldScene3D = dynamic(() => import("./world-scene-3d"), { ssr: false });

type View = "3d" | "2d";
type Pref = View | "auto";
const PREF_KEY = "surplus-ai:world-view";
const MIN_FPS = 20;

interface Device {
  webgl: boolean;
  /** Why this device starts on the light view, if it does. */
  lowReason: string | null;
  reducedMotion: boolean;
}

function checkDevice(): Device {
  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    webgl = false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lowReason: string | null = null;
  if (!webgl) lowReason = "This browser cannot draw 3D, so you are seeing the lighter view.";
  else if (reducedMotion) lowReason = "Reduced motion is on, so you are seeing the still, lighter view.";
  else if ((nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2) lowReason = "Showing the lighter view for this device.";
  return { webgl, lowReason, reducedMotion };
}

function readPref(): Pref {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === "3d" || v === "2d" ? v : "auto";
  } catch {
    return "auto";
  }
}

/**
 * Surplus World: the network as a small world you can click. Starts on the
 * 2D map (instant, works everywhere), then swaps in the 3D scene once it has
 * loaded, if the device can take it. Too slow in its first seconds: back to 2D.
 */
export function SurplusWorld({ className }: { className?: string }) {
  const { state } = useStore();
  const forecasts = useForecasts();
  const world = useMemo(() => buildWorld(state, forecasts), [state, forecasts]);
  const labels = useMemo(() => new Map(worldObjects(world).map((o) => [`${o.kind}:${o.id}`, o.label])), [world]);

  const [selection, setSelection] = useState<WorldSelection | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [pref, setPref] = useState<Pref>("auto");
  const [slow, setSlow] = useState(false);
  const [ready3d, setReady3d] = useState(false);
  const [full, setFull] = useState(false);
  const [hover, setHover] = useState<WorldSelection | null>(null);
  const onHover = useCallback((s: WorldSelection | null) => setHover(s), []);
  const frame = useRef<HTMLDivElement>(null);
  const labelLayer = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => layoutWorld(world), [world]);
  const lit = (kind: WorldSelection["kind"], id: string) => (selection?.kind === kind && selection.id === id) || (hover?.kind === kind && hover.id === id);

  useEffect(() => {
    setDevice(checkDevice());
    setPref(readPref());
  }, []);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // A selection can vanish when the data changes (a lorry arrives, a pile is moved).
  useEffect(() => {
    if (selection && !labels.has(`${selection.kind}:${selection.id}`)) setSelection(null);
  }, [labels, selection]);

  const want3d = !!device?.webgl && (pref === "3d" || (pref === "auto" && !device.lowReason && !slow));
  const view: View = want3d ? "3d" : "2d";
  const animate = !device?.reducedMotion;
  const showing3d = want3d && ready3d;

  const choose = (v: View) => {
    setPref(v);
    setSlow(false);
    try {
      localStorage.setItem(PREF_KEY, v);
    } catch {
      // Private mode: the choice just lasts for this visit.
    }
  };

  const note =
    pref === "auto" && device
      ? slow
        ? "Switched to the lighter view for this device."
        : device.lowReason
      : pref === "3d" && device && !device.webgl
        ? "This browser cannot draw 3D, so you are seeing the lighter view."
        : null;

  return (
    <section aria-labelledby="world-h" className={cn("overflow-hidden rounded-2xl bg-card shadow-card", className)} data-demo="surplus-world">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id="world-h" className="font-semibold">
            Surplus World
          </h2>
          <p className="text-xs text-muted-foreground">
            Every site, pile, lorry and need, live from your data. {view === "3d" ? "Drag to turn, scroll to zoom, click to open." : "Click anything to open it."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="World view" className="flex rounded-xl bg-muted p-0.5">
            {(
              [
                { v: "3d", label: "3D", icon: Box, disabled: device ? !device.webgl : false },
                { v: "2d", label: "2D", icon: MapIcon, disabled: false },
              ] as const
            ).map((b) => (
              <button
                key={b.v}
                type="button"
                aria-pressed={view === b.v}
                disabled={b.disabled}
                onClick={() => choose(b.v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  view === b.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <b.icon className="size-3.5" aria-hidden /> {b.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => (full ? document.exitFullscreen() : frame.current?.requestFullscreen?.())}
            aria-label={full ? "Exit full screen" : "Full screen"}
            className="hidden size-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground sm:grid"
          >
            {full ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      <div ref={frame} className={cn("grid grid-cols-1 bg-card lg:grid-cols-[minmax(0,1fr)_300px]", full && "h-full lg:grid-cols-[minmax(0,1fr)_340px]")}>
        <div className={cn("relative min-w-0 bg-[#f4f8f6]", full ? "h-full" : view === "3d" ? "h-[320px] sm:h-[440px]" : "")}>
          {/* The 2D map is always there first; the 3D scene fades in over it once ready. */}
          <div
            className={cn(
              "transition-opacity duration-500",
              view === "3d" && "absolute inset-0 flex items-center justify-center overflow-hidden p-2",
              showing3d && "pointer-events-none opacity-0",
            )}
          >
            <WorldMap2D world={world} selection={selection} onSelect={setSelection} labels={labels} animate={animate} className={view === "3d" ? "h-full max-h-full w-auto max-w-full" : undefined} />
          </div>
          {want3d && (
            <div className={cn("absolute inset-0 transition-opacity duration-700", showing3d ? "opacity-100" : "opacity-0")}>
              <WorldScene3D
                world={world}
                selection={selection}
                onSelect={setSelection}
                onHover={onHover}
                labelLayer={labelLayer}
                animate={animate}
                quality={device?.lowReason ? "low" : "high"}
                onReady={() => setReady3d(true)}
                onFps={(fps) => {
                  if (pref === "auto" && fps < MIN_FPS) setSlow(true);
                }}
              />
              {/* Name tags, moved every frame by the scene to sit over their buildings. */}
              <div ref={labelLayer} className="@container pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                {world.sites.map((s) => (
                  <div key={s.id} data-x={layout.sites[s.id].x} data-y={siteLabelY(s)} data-z={layout.sites[s.id].z} className={cn("absolute top-0 left-0 opacity-0 will-change-transform", !lit("site", s.id) && "@max-[600px]:hidden")}>
                    <div className={cn("rounded-lg px-2 py-1 text-center leading-tight whitespace-nowrap shadow-md transition-colors", lit("site", s.id) ? "bg-brand text-white" : "bg-card/95 text-foreground")}>
                      <div className="text-xs font-semibold">{s.name}</div>
                      <div className={cn("text-[11px] @max-[600px]:hidden", lit("site", s.id) ? "text-white/85" : "text-muted-foreground")}>
                        {s.phaseStatus === "planned" ? "Not started" : s.phaseStatus === "completed" ? "Completed" : `${s.progressPct}% built`}
                      </div>
                    </div>
                  </div>
                ))}
                <div data-x={layout.landfill.x} data-y={landfillRadius(world) * 0.7 + 1} data-z={layout.landfill.z} className="absolute top-0 left-0 opacity-0 will-change-transform">
                  <div className={cn("rounded-lg px-2 py-1 text-center leading-tight whitespace-nowrap shadow-md", lit("landfill", "landfill") ? "bg-brand text-white" : "bg-card/95")}>
                    <div className={cn("text-[11px] @max-[600px]:hidden", lit("landfill", "landfill") ? "text-white/85" : "text-muted-foreground")}>Landfill</div>
                    <div className={cn("text-xs font-bold @max-[600px]:text-[11px]", lit("landfill", "landfill") ? "text-white" : "text-success")}>{fmtRm(world.impact.savedRm)} kept out</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showing3d && hover && (
            <p className="pointer-events-none absolute top-3 left-3 max-w-[80%] truncate rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
              {labels.get(`${hover.kind}:${hover.id}`)}
            </p>
          )}
          {view === "3d" && !showing3d && (
            <p className="absolute top-3 left-3 rounded-lg bg-card/90 px-2.5 py-1 text-xs text-muted-foreground shadow-sm">Loading the 3D world...</p>
          )}
          {note && <p className="absolute bottom-3 left-3 rounded-lg bg-card/90 px-2.5 py-1 text-xs text-muted-foreground shadow-sm">{note}</p>}
          {view === "3d" && showing3d && (
            <p className="pointer-events-none absolute right-3 bottom-3 rounded-lg bg-card/80 px-2 py-0.5 text-[11px] text-muted-foreground">Simulated data. Positions approximate.</p>
          )}
        </div>
        <div className={cn("min-w-0 border-t lg:border-t-0 lg:border-l", full && "overflow-y-auto")}>
          <WorldCard world={world} selection={selection} onSelect={setSelection} />
        </div>
      </div>
    </section>
  );
}
