import { diffDays, fmtDate, fmtNum } from "../format";
import type { Condition, Listing, Need } from "../types";
import { materialById, siteName, type EngineData } from "./context";
import { siteDistanceKm } from "./geo";
import { savingsFor, type Savings } from "./savings";

export const conditionScore: Record<Condition, number> = { new: 1, good: 0.85, usable: 0.6, poor: 0.2 };

export interface Match {
  listing: Listing;
  distanceKm: number;
  qty: number;
  score: number;
  exactItem: boolean;
  needsApproval: boolean;
  savings: Savings;
  explanation: string[];
}

export interface MatchResult {
  matches: Match[];
  excluded: { listing: Listing; reason: string }[];
}

/** Rank logged surplus against a need. Hard filters first, then an explainable score. */
export function matchNeed(data: EngineData, need: Need): MatchResult {
  const g = data.assumptions.global;
  const mat = materialById(data, need.materialId);
  const matches: Match[] = [];
  const excluded: MatchResult["excluded"] = [];

  for (const l of data.listings) {
    const lm = materialById(data, l.materialId);
    if (lm.category !== mat.category) continue;
    const exactItem = l.materialId === need.materialId;
    if (!exactItem && lm.unit !== mat.unit) continue;
    const d = siteDistanceKm(data.sites, l.siteId, need.siteId);
    let reason: string | null = null;
    if (l.status !== "available") reason = `Already ${l.status}.`;
    else if (l.availableFrom > need.neededBy) reason = `Available ${fmtDate(l.availableFrom)}, after the need date.`;
    else if (d > g.maxHaulKm) reason = `${fmtNum(d)} km away, beyond the ${g.maxHaulKm} km haul limit.`;
    if (reason) {
      excluded.push({ listing: l, reason });
      continue;
    }
    const qty = Math.min(need.qty, l.qty);
    const coverage = qty / need.qty;
    const distance = Math.max(0, 1 - d / g.maxHaulKm);
    const slack = diffDays(l.availableFrom, need.neededBy);
    const timing = Math.min(1, slack / 30);
    const cond = conditionScore[l.condition];
    let score = g.weightCoverage * coverage + g.weightDistance * distance + g.weightTiming * timing + g.weightConfidence * cond;
    if (!exactItem) score *= 0.5;
    score = Math.round(score * 100) / 100;
    const explanation = [
      `${fmtNum(l.qty)} ${lm.unit} at ${siteName(data, l.siteId)}, ${fmtNum(d, 1)} km away.`,
      `Covers ${fmtNum(qty)} of ${fmtNum(need.qty)} ${mat.unit} needed (${Math.round(coverage * 100)}%).`,
      `Ready ${slack} days before the need date. Condition: ${l.condition}.`,
      `Score ${score.toFixed(2)} = ${g.weightCoverage} × coverage ${coverage.toFixed(2)} + ${g.weightDistance} × distance ${distance.toFixed(2)} + ${g.weightTiming} × timing ${timing.toFixed(2)} + ${g.weightConfidence} × condition ${cond.toFixed(2)}${exactItem ? "" : ", halved because it is a substitute in the same category"}.`,
    ];
    if (lm.structural) explanation.push("Structural item: engineer approval is required before reserving.");
    matches.push({
      listing: l,
      distanceKm: d,
      qty,
      score,
      exactItem,
      needsApproval: lm.structural,
      savings: savingsFor(l.materialId, qty, d, data.assumptions, lm.unit),
      explanation,
    });
  }
  matches.sort((a, b) => b.score - a.score);
  return { matches, excluded };
}
