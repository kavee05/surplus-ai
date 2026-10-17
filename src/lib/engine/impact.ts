import { diffDays, fmtMonth } from "../format";
import type { Listing, Transfer } from "../types";
import { materialById, siteName, type EngineData } from "./context";
import { forecastAccuracy } from "./forecast";
import { siteDistanceKm } from "./geo";
import { savingsFor, type Savings } from "./savings";

export function transferSavings(data: EngineData, t: Transfer): Savings {
  const d = siteDistanceKm(data.sites, t.fromSiteId, t.toSiteId);
  return savingsFor(t.materialId, t.qty, d, data.assumptions, materialById(data, t.materialId).unit);
}

export function listingValueRm(data: EngineData, l: Listing): number {
  return l.qty * data.assumptions.materials[l.materialId].unitCostRm;
}

export function listingAgeDays(data: EngineData, l: Listing): number {
  return diffDays(l.loggedAt, data.today);
}

export function impactSummary(data: EngineData) {
  const completed = data.transfers.filter((t) => t.status === "Completed");
  const sv = completed.map((t) => ({ t, s: transferSavings(data, t) }));
  const savedRm = sv.reduce((a, x) => a + x.s.savedRm, 0);
  const tonnes = sv.reduce((a, x) => a + x.s.tonnes, 0);
  const co2eKg = sv.reduce((a, x) => a + x.s.co2eKg, 0);
  const activeMatches = data.transfers.filter((t) => !["Completed", "Cancelled"].includes(t.status)).length;
  const available = data.listings.filter((l) => l.status === "available");
  const unclaimedValueRm = available.reduce((a, l) => a + listingValueRm(data, l), 0);
  const alertDays = data.assumptions.global.unclaimedAlertDays;
  const alerts = available
    .map((l) => ({ listing: l, age: listingAgeDays(data, l), valueRm: listingValueRm(data, l) }))
    .filter((x) => x.age > alertDays)
    .sort((a, b) => b.age - a.age);
  const accuracy = forecastAccuracy(data.outcomes);
  const confirmed = data.outcomes.filter((o) => o.status === "Confirmed").length;
  return { completed: sv, savedRm, tonnes, co2eKg, activeMatches, unclaimedValueRm, alerts, accuracy, confirmed, outcomes: data.outcomes.length };
}

export function savingsByTownship(data: EngineData) {
  const map = new Map<string, { township: string; savedRm: number; tonnes: number }>();
  for (const t of data.transfers.filter((x) => x.status === "Completed")) {
    const s = transferSavings(data, t);
    const name = siteName(data, t.fromSiteId);
    const cur = map.get(name) ?? { township: name, savedRm: 0, tonnes: 0 };
    cur.savedRm += s.savedRm;
    cur.tonnes += s.tonnes;
    map.set(name, cur);
  }
  return [...map.values()].sort((a, b) => b.savedRm - a.savedRm);
}

export function savingsByCategory(data: EngineData) {
  const map = new Map<string, { category: string; savedRm: number; tonnes: number }>();
  for (const t of data.transfers.filter((x) => x.status === "Completed")) {
    const s = transferSavings(data, t);
    const cat = materialById(data, t.materialId).category;
    const cur = map.get(cat) ?? { category: cat, savedRm: 0, tonnes: 0 };
    cur.savedRm += s.savedRm;
    cur.tonnes += s.tonnes;
    map.set(cat, cur);
  }
  return [...map.values()].sort((a, b) => b.savedRm - a.savedRm);
}

/** Monthly savings, cumulative, from the first completed transfer up to the demo date. */
export function savingsByMonth(data: EngineData) {
  const completed = data.transfers.filter((x) => x.status === "Completed" && x.completedAt);
  if (!completed.length) return [];
  const months: string[] = [];
  const first = completed.map((t) => t.completedAt!).sort()[0].slice(0, 7);
  let [y, m] = first.split("-").map(Number);
  const [ey, em] = data.today.slice(0, 7).split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  let cum = 0;
  return months.map((mo) => {
    const inMonth = completed.filter((t) => t.completedAt!.startsWith(mo));
    const saved = inMonth.reduce((a, t) => a + transferSavings(data, t).savedRm, 0);
    const tonnes = inMonth.reduce((a, t) => a + transferSavings(data, t).tonnes, 0);
    cum += saved;
    return { month: fmtMonth(`${mo}-01`), savedRm: Math.round(saved), tonnes: Math.round(tonnes * 10) / 10, cumulativeRm: Math.round(cum) };
  });
}

/**
 * Simulated scale view: average annual saving per active township so far,
 * multiplied by the number of townships that join. Network effect is a stated
 * assumption: each extra township adds `networkUplift` more matching chances.
 */
export function scaleProjection(data: EngineData, maxTownships = 27, networkUplift = 0.03) {
  const months = Math.max(1, savingsByMonth(data).length);
  const total = impactSummary(data).savedRm;
  const activeTownships = new Set(data.sites.map((s) => s.id)).size;
  const perTownshipPerYear = (total / months) * 12 / activeTownships;
  const steps = [1, 3, 8, 15, 20, maxTownships];
  return {
    perTownshipPerYear,
    points: steps.map((n) => ({
      townships: n,
      annualRm: Math.round(perTownshipPerYear * n * (1 + networkUplift * (n - 1))),
    })),
  };
}
