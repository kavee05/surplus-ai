import type { World, WorldSelection, WorldSite } from "@/lib/engine/world";

/**
 * Where everything sits, in world units (x east, z south), shared by the 3D
 * scene and the 2D map so both put each object in the same place. Sites keep
 * their rough geography but are nudged apart so their yards never overlap.
 */

export const WORLD_W = 26;
export const WORLD_D = 17;
const HALF_W = WORLD_W / 2 - 1.6;
const HALF_D = WORLD_D / 2 - 1.6;
const MIN_GAP = 4.8;
const RING = 1.12;
const SLOTS = 12;

export interface Pt {
  x: number;
  z: number;
}

export interface Placed extends Pt {
  sel: WorldSelection;
  siteId?: string;
}

export interface Layout {
  sites: Record<string, Pt>;
  objects: Placed[];
  landfill: Pt;
  /** Curve control point for each transfer, so two lorries on one road never overlap. */
  routes: Record<string, { from: Pt; ctrl: Pt; to: Pt }>;
  roads: { from: Pt; ctrl: Pt; to: Pt }[];
}

function curve(a: Pt, b: Pt, bend: number) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return { from: a, to: b, ctrl: { x: (a.x + b.x) / 2 - dz * bend, z: (a.z + b.z) / 2 + dx * bend } };
}

/** Point at t along a quadratic curve. */
export function along(c: { from: Pt; ctrl: Pt; to: Pt }, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * c.from.x + 2 * u * t * c.ctrl.x + t * t * c.to.x,
    z: u * u * c.from.z + 2 * u * t * c.ctrl.z + t * t * c.to.z,
  };
}

export function layoutWorld(world: World): Layout {
  // 1. Geography to world units, stretched so the sites fill the board (the real
  //    spread is lopsided), then push crowded sites apart.
  const span = (vals: number[]) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return (v: number) => (hi - lo < 1e-6 ? 0 : ((v - lo) / (hi - lo)) * 2 - 1);
  };
  const sx = span(world.sites.map((s) => s.x));
  const sz = span(world.sites.map((s) => s.y));
  const pts = world.sites.map((s) => ({ id: s.id, x: sx(s.x) * HALF_W, z: sz(s.y) * HALF_D }));
  for (let iter = 0; iter < 160; iter++) {
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i];
        const b = pts[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d = Math.hypot(dx, dz) || 0.01;
        if (d >= MIN_GAP) continue;
        const push = (MIN_GAP - d) / 2;
        a.x -= (dx / d) * push;
        a.z -= (dz / d) * push;
        b.x += (dx / d) * push;
        b.z += (dz / d) * push;
      }
    for (const p of pts) {
      p.x = Math.max(-HALF_W, Math.min(HALF_W, p.x));
      p.z = Math.max(-HALF_D, Math.min(HALF_D, p.z));
    }
  }
  const sites: Record<string, Pt> = Object.fromEntries(pts.map((p) => [p.id, { x: round(p.x), z: round(p.z) }]));

  // 2. A ring of yard slots around each building: logged piles, then forecasts, then needs.
  const objects: Placed[] = [];
  for (const s of world.sites) {
    const c = sites[s.id];
    objects.push({ ...c, sel: { kind: "site", id: s.id }, siteId: s.id });
    const items: WorldSelection[] = [
      ...s.piles.map((p) => ({ kind: "pile" as const, id: p.id })),
      ...s.ghosts.map((g) => ({ kind: "ghost" as const, id: g.id })),
      ...s.needs.slice(0, SLOTS - s.piles.length - s.ghosts.length).map((n) => ({ kind: "need" as const, id: n.id })),
    ];
    items.forEach((sel, i) => {
      const a = -Math.PI / 2 + (i + 0.5) * ((Math.PI * 2) / SLOTS);
      objects.push({ x: round(c.x + Math.cos(a) * RING), z: round(c.z + Math.sin(a) * RING), sel, siteId: s.id });
    });
  }

  // 3. Lorries on curved roads. Repeat trips on one road bow out further.
  const seen = new Map<string, number>();
  const routes: Layout["routes"] = {};
  for (const t of world.transfers) {
    const key = `${t.fromSiteId}>${t.toSiteId}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    routes[t.id] = curve(sites[t.fromSiteId], sites[t.toSiteId], 0.16 + n * 0.12);
    objects.push({ ...along(routes[t.id], 0.5), sel: { kind: "transfer", id: t.id } });
  }
  const roads = world.roads.map((r) => curve(sites[r.fromSiteId], sites[r.toSiteId], 0.16));

  // 4. The landfill sits in the emptiest corner, away from every site.
  const corners: Pt[] = [
    { x: -HALF_W, z: HALF_D },
    { x: HALF_W, z: HALF_D },
    { x: -HALF_W, z: -HALF_D },
    { x: HALF_W, z: -HALF_D },
  ];
  const clearance = (p: Pt) => Math.min(...Object.values(sites).map((s) => Math.hypot(s.x - p.x, s.z - p.z)));
  const landfill = corners.sort((a, b) => clearance(b) - clearance(a))[0];
  objects.push({ ...landfill, sel: { kind: "landfill", id: "landfill" } });

  return { sites, objects, landfill, routes, roads };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Building storeys, shared so page labels sit just above the roof. */
export const FLOOR = 0.32;
export function siteFloors(site: WorldSite) {
  return site.phaseStatus === "planned" ? 0 : Math.max(1, Math.round((site.progressPct / 100) * 8));
}
export function siteLabelY(site: WorldSite) {
  return Math.max(2.2, siteFloors(site) * FLOOR + 1.55);
}
/** The landfill mound shrinks as the share of reused material grows. */
export function landfillRadius(world: World) {
  return 0.9 + (1 - world.impact.reusedShare) * 1.3;
}
