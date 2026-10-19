import { forecastCertainty } from "../explain/builders";
import type { CertaintyLevel } from "../explain/types";
import { diffDays, fmtDate, fmtNum, fmtRm, fmtTonnes } from "../format";
import type { Category, Forecast, ListingStatus, Phase, TransferStatus } from "../types";
import { materialById, type EngineData } from "./context";
import { siteDistanceKm } from "./geo";
import { impactSummary, listingValueRm } from "./impact";

/**
 * Surplus World: one description of the network that both the 3D scene and
 * the 2D map draw from. Every object carries what its info card shows, so the
 * two views can never disagree. Positions are approximate, data is simulated.
 */

/** Map bounds shared with the Surplus Network SVG. */
const BOUNDS = { minLat: 2.64, maxLat: 3.25, minLng: 101.24, maxLng: 102.03 };

/** Approximate position mapped to [-1, 1] on both axes. North is -1 (top). */
export function worldXY(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 2 - 1;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 2 - 1;
  return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
}

export interface WorldPile {
  id: string; // listing id
  siteId: string;
  materialId: string;
  materialName: string;
  category: Category;
  qty: number;
  unit: string;
  valueRm: number;
  status: Extract<ListingStatus, "available" | "reserved">;
  /** 0 to 1, relative to the biggest pile in the world. Drives pile size. */
  scale: number;
}

export interface WorldGhost {
  id: string; // forecast id
  siteId: string;
  materialId: string;
  materialName: string;
  category: Category;
  qty: number;
  unit: string;
  valueRm: number;
  availableFrom: string;
  certainty: CertaintyLevel;
  reserved: boolean;
  scale: number;
}

export interface WorldNeed {
  id: string;
  siteId: string;
  materialName: string;
  qty: number;
  unit: string;
  neededBy: string;
  status: "open" | "matched";
}

export interface WorldSite {
  id: string;
  name: string;
  x: number;
  y: number;
  phaseName: string;
  phaseStatus: Phase["status"];
  /** 0 to 100. Completed phases count as 100, planned as 0. */
  progressPct: number;
  piles: WorldPile[];
  ghosts: WorldGhost[];
  needs: WorldNeed[];
  /** Objects left out of the scene to keep it readable; still counted in the card. */
  hiddenPiles: number;
  hiddenGhosts: number;
}

export interface WorldTransfer {
  id: string;
  fromSiteId: string;
  toSiteId: string;
  materialName: string;
  qty: number;
  unit: string;
  status: TransferStatus;
  distanceKm: number;
  /** Held against a forecast, before the leftovers are logged. */
  onForecast: boolean;
}

export interface WorldImpact {
  savedRm: number;
  tonnes: number;
  co2eKg: number;
  completed: number;
  /** Logged leftovers nobody has claimed yet: what would go to landfill. */
  atRiskRm: number;
  /** 0 to 1: share of logged and moved material that was reused. Drives the landfill mound. */
  reusedShare: number;
}

export interface World {
  today: string;
  sites: WorldSite[];
  transfers: WorldTransfer[];
  /** Completed routes, drawn as faint roads. Unique site pairs. */
  roads: { fromSiteId: string; toSiteId: string }[];
  impact: WorldImpact;
}

export type WorldKind = "site" | "pile" | "ghost" | "need" | "transfer" | "landfill";
export interface WorldSelection {
  kind: WorldKind;
  id: string;
}

const MAX_PILES = 4;
const MAX_GHOSTS = 3;

export function buildWorld(data: EngineData, forecasts: Forecast[]): World {
  const mat = (id: string) => materialById(data, id);
  const unitCost = (id: string) => data.assumptions.materials[id]?.unitCostRm ?? 0;
  const live = data.transfers.filter((t) => t.status !== "Cancelled");

  const allPiles: WorldPile[] = data.listings
    .filter((l): l is typeof l & { status: "available" | "reserved" } => l.status === "available" || l.status === "reserved")
    .map((l) => {
      const m = mat(l.materialId);
      return { id: l.id, siteId: l.siteId, materialId: l.materialId, materialName: m.name, category: m.category, qty: l.qty, unit: m.unit, valueRm: listingValueRm(data, l), status: l.status, scale: 0 };
    });

  const allGhosts: WorldGhost[] = forecasts
    .filter((f) => f.status === "Forecast" && f.qty > 0)
    .map((f) => {
      const m = mat(f.materialId);
      const phase = data.phases.find((p) => p.id === f.phaseId);
      return {
        id: f.id,
        siteId: f.siteId,
        materialId: f.materialId,
        materialName: m.name,
        category: m.category,
        qty: f.qty,
        unit: m.unit,
        valueRm: f.qty * unitCost(f.materialId),
        availableFrom: f.availableFrom,
        certainty: phase ? forecastCertainty(f, phase, data.today).level : "insufficient",
        reserved: live.some((t) => t.forecastId === f.id),
        scale: 0,
      };
    });

  // Size piles on a square-root scale of value, so one huge pile does not dwarf the rest.
  const maxValue = Math.max(1, ...allPiles.map((p) => p.valueRm), ...allGhosts.map((g) => g.valueRm));
  for (const o of [...allPiles, ...allGhosts]) o.scale = Math.round(Math.sqrt(o.valueRm / maxValue) * 1000) / 1000;

  const byValue = <T extends { valueRm: number }>(a: T, b: T) => b.valueRm - a.valueRm;

  const sites: WorldSite[] = data.sites.map((s) => {
    const phases = data.phases.filter((p) => p.siteId === s.id);
    const phase =
      phases.find((p) => p.status === "active") ??
      [...phases].filter((p) => p.status === "planned").sort((a, b) => a.start.localeCompare(b.start))[0] ??
      [...phases].sort((a, b) => b.plannedEnd.localeCompare(a.plannedEnd))[0];
    const piles = allPiles.filter((p) => p.siteId === s.id).sort(byValue);
    const ghosts = allGhosts.filter((g) => g.siteId === s.id).sort(byValue);
    const { x, y } = worldXY(s.lat, s.lng);
    return {
      id: s.id,
      name: s.township,
      x,
      y,
      phaseName: phase?.name ?? "No phase",
      phaseStatus: phase?.status ?? "planned",
      progressPct: !phase ? 0 : phase.status === "completed" ? 100 : phase.status === "planned" ? 0 : phase.progressPct,
      piles: piles.slice(0, MAX_PILES),
      ghosts: ghosts.slice(0, MAX_GHOSTS),
      needs: data.needs
        .filter((n) => n.siteId === s.id && n.status !== "fulfilled")
        .map((n) => {
          const m = mat(n.materialId);
          return { id: n.id, siteId: s.id, materialName: m.name, qty: n.qty, unit: m.unit, neededBy: n.neededBy, status: n.status as "open" | "matched" };
        }),
      hiddenPiles: Math.max(0, piles.length - MAX_PILES),
      hiddenGhosts: Math.max(0, ghosts.length - MAX_GHOSTS),
    };
  });

  const transfers: WorldTransfer[] = live
    .filter((t) => t.status !== "Completed" && t.fromSiteId !== t.toSiteId)
    .map((t) => {
      const m = mat(t.materialId);
      return {
        id: t.id,
        fromSiteId: t.fromSiteId,
        toSiteId: t.toSiteId,
        materialName: m.name,
        qty: t.qty,
        unit: m.unit,
        status: t.status,
        distanceKm: siteDistanceKm(data.sites, t.fromSiteId, t.toSiteId),
        onForecast: !!t.forecastId && !t.listingId,
      };
    });

  const roadKeys = new Set<string>();
  const roads: World["roads"] = [];
  for (const t of live) {
    if (t.fromSiteId === t.toSiteId) continue;
    const key = [t.fromSiteId, t.toSiteId].sort().join("|");
    if (roadKeys.has(key)) continue;
    roadKeys.add(key);
    roads.push({ fromSiteId: t.fromSiteId, toSiteId: t.toSiteId });
  }

  const sum = impactSummary(data);
  const atRiskRm = sum.unclaimedValueRm;
  const reusedShare = sum.savedRm + atRiskRm > 0 ? sum.savedRm / (sum.savedRm + atRiskRm) : 0;

  return {
    today: data.today,
    sites,
    transfers,
    roads,
    impact: { savedRm: sum.savedRm, tonnes: sum.tonnes, co2eKg: sum.co2eKg, completed: sum.completed.length, atRiskRm, reusedShare },
  };
}

/* ------------------------------------------------------------------ */
/* Info cards: the same text whichever view the object was clicked in. */
/* ------------------------------------------------------------------ */

export interface WorldCard {
  eyebrow: string;
  title: string;
  rows: { label: string; value: string }[];
  note?: string;
  href?: string;
  hrefLabel?: string;
  tone: "brand" | "forecast" | "success" | "warning" | "ink";
}

const certaintyText: Record<CertaintyLevel, string> = {
  strong: "Strong",
  moderate: "Moderate",
  tentative: "Tentative",
  insufficient: "Not enough data",
};

export function findSite(world: World, id: string) {
  return world.sites.find((s) => s.id === id);
}

export function describe(world: World, sel: WorldSelection): WorldCard | null {
  const site = (id: string) => findSite(world, id)?.name ?? id;

  if (sel.kind === "landfill") {
    const i = world.impact;
    return {
      eyebrow: "Landfill",
      title: "What stayed out of the landfill",
      rows: [
        { label: "Saved by reuse", value: fmtRm(i.savedRm) },
        { label: "Kept out of landfill", value: fmtTonnes(i.tonnes) },
        { label: "Carbon avoided, rough", value: `${fmtNum(i.co2eKg)} kg CO2e` },
        { label: "Completed transfers", value: fmtNum(i.completed) },
        { label: "Unclaimed leftovers at risk", value: fmtRm(i.atRiskRm) },
      ],
      note: "The mound shrinks as more leftovers are reused. Estimated prices, simulated records.",
      href: "/app/transfers",
      hrefLabel: "See transfers",
      tone: "success",
    };
  }

  if (sel.kind === "transfer") {
    const t = world.transfers.find((x) => x.id === sel.id);
    if (!t) return null;
    return {
      eyebrow: t.onForecast ? "Lorry, held on forecast" : "Lorry, transfer",
      title: `${fmtNum(t.qty)} ${t.unit} ${t.materialName}`,
      rows: [
        { label: "From", value: site(t.fromSiteId) },
        { label: "To", value: site(t.toSiteId) },
        { label: "Distance", value: `about ${fmtNum(t.distanceKm, 1)} km` },
        { label: "Status", value: t.status },
      ],
      note: t.onForecast ? "Reserved before the leftovers exist. It firms up once the source site logs them." : undefined,
      href: `/app/transfers?transfer=${t.id}`,
      hrefLabel: "Open transfer",
      tone: t.onForecast ? "forecast" : "brand",
    };
  }

  for (const s of world.sites) {
    if (sel.kind === "site" && s.id === sel.id) {
      const piles = s.piles.length + s.hiddenPiles;
      const ghosts = s.ghosts.length + s.hiddenGhosts;
      return {
        eyebrow: "Site",
        title: s.name,
        rows: [
          { label: "Phase", value: s.phaseName },
          { label: "Progress", value: s.phaseStatus === "completed" ? "Completed" : s.phaseStatus === "planned" ? "Not started" : `${s.progressPct}% built` },
          { label: "Leftovers logged", value: piles === 0 ? "None" : `${piles} ${piles === 1 ? "listing" : "listings"}` },
          { label: "Leftovers forecast", value: ghosts === 0 ? "None" : `${ghosts} ${ghosts === 1 ? "forecast" : "forecasts"}` },
          { label: "Open needs", value: s.needs.length === 0 ? "None" : fmtNum(s.needs.length) },
        ],
        href: `/app/surplus?q=${encodeURIComponent(s.name)}`,
        hrefLabel: "See its leftovers",
        tone: "ink",
      };
    }
    if (sel.kind === "pile") {
      const p = s.piles.find((x) => x.id === sel.id);
      if (p)
        return {
          eyebrow: p.status === "reserved" ? "Leftovers, reserved" : "Leftovers, ready to reuse",
          title: `${fmtNum(p.qty)} ${p.unit} ${p.materialName}`,
          rows: [
            { label: "At", value: s.name },
            { label: "Worth new", value: fmtRm(p.valueRm) },
            { label: "Type", value: p.category },
            { label: "Status", value: p.status === "reserved" ? "Reserved for another site" : "Available" },
          ],
          href: `/app/surplus?listing=${p.id}`,
          hrefLabel: "Open listing",
          tone: p.status === "reserved" ? "brand" : "success",
        };
    }
    if (sel.kind === "ghost") {
      const g = s.ghosts.find((x) => x.id === sel.id);
      if (g) {
        const days = diffDays(world.today, g.availableFrom);
        return {
          eyebrow: "Forecast leftovers, not logged yet",
          title: `About ${fmtNum(g.qty)} ${g.unit} ${g.materialName}`,
          rows: [
            { label: "At", value: s.name },
            { label: "Expected", value: days > 0 ? `${fmtDate(g.availableFrom)}, in ${days} days` : fmtDate(g.availableFrom) },
            { label: "Worth new", value: fmtRm(g.valueRm) },
            { label: "Certainty", value: certaintyText[g.certainty] },
            { label: "Reserved", value: g.reserved ? "Yes, another site is holding it" : "Not yet" },
          ],
          note: "A prediction from the site's order and progress. It turns solid once the site engineer logs it.",
          href: `/app/radar?forecast=${g.id}`,
          hrefLabel: "Open in Radar",
          tone: "forecast",
        };
      }
    }
    if (sel.kind === "need") {
      const n = s.needs.find((x) => x.id === sel.id);
      if (n)
        return {
          eyebrow: n.status === "matched" ? "Need, matched" : "Need, open",
          title: `${fmtNum(n.qty)} ${n.unit} ${n.materialName}`,
          rows: [
            { label: "For", value: s.name },
            { label: "Needed by", value: fmtDate(n.neededBy) },
            { label: "Status", value: n.status === "matched" ? "Matched to leftovers" : "Looking for leftovers" },
          ],
          href: `/app/needs?need=${n.id}`,
          hrefLabel: "Open need",
          tone: "warning",
        };
    }
  }
  return null;
}

/** Every clickable object, in reading order. Used by the 2D map and the list view. */
export function worldObjects(world: World): (WorldSelection & { label: string; siteId?: string })[] {
  const out: (WorldSelection & { label: string; siteId?: string })[] = [];
  for (const s of world.sites) {
    out.push({ kind: "site", id: s.id, label: s.name, siteId: s.id });
    for (const p of s.piles) out.push({ kind: "pile", id: p.id, label: `${fmtNum(p.qty)} ${p.unit} ${p.materialName} at ${s.name}`, siteId: s.id });
    for (const g of s.ghosts) out.push({ kind: "ghost", id: g.id, label: `Forecast: about ${fmtNum(g.qty)} ${g.unit} ${g.materialName} at ${s.name}`, siteId: s.id });
    for (const n of s.needs) out.push({ kind: "need", id: n.id, label: `${s.name} needs ${fmtNum(n.qty)} ${n.unit} ${n.materialName}`, siteId: s.id });
  }
  for (const t of world.transfers)
    out.push({ kind: "transfer", id: t.id, label: `Lorry: ${fmtNum(t.qty)} ${t.unit} ${t.materialName}, ${siteNameIn(world, t.fromSiteId)} to ${siteNameIn(world, t.toSiteId)}` });
  out.push({ kind: "landfill", id: "landfill", label: "Landfill: what reuse has saved" });
  return out;
}

function siteNameIn(world: World, id: string) {
  return findSite(world, id)?.name ?? id;
}

