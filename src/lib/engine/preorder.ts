import { addDays, diffDays, fmtDate, fmtNum } from "../format";
import type { Forecast, Listing } from "../types";
import { materialById, siteName, type EngineData } from "./context";
import { computeForecasts, riskLabel } from "./forecast";
import { siteDistanceKm } from "./geo";
import { savingsFor, sumSavings, type Savings } from "./savings";

export interface PreOrderInput {
  siteId: string;
  phaseId: string;
  materialId: string;
  qty: number;
  neededBy: string;
  conservative?: boolean;
}

export interface ListingAllocation {
  listing: Listing;
  distanceKm: number;
  qty: number;
  needsApproval: boolean;
  savings: Savings;
  /** Already reserved by this buyer. */
  secured?: boolean;
}

export interface Exclusion {
  kind: "listing" | "forecast";
  id: string;
  siteId: string;
  qty: number;
  reason: string;
}

export interface ForecastCandidate {
  forecast: Forecast;
  distanceKm: number;
  slackDays: number;
  score: number;
  scoreParts: { coverage: number; distance: number; timing: number; confidence: number };
  availableQty: number;
  reservedQty: number;
  /** Quantity this buyer already holds against the forecast. */
  alreadyReserved: number;
  savings: Savings;
  explanation: string[];
}

export interface PreOrderResult {
  input: PreOrderInput;
  unit: string;
  fromListings: ListingAllocation[];
  listingQty: number;
  forecasts: ForecastCandidate[];
  reservedForecast: number;
  orderNow: number;
  confidence: number | null;
  risk: "High" | "Medium" | "Low" | null;
  decisionDate: string;
  leadTimeDays: number;
  securedQty: number;
  exclusions: Exclusion[];
  expected: ReturnType<typeof sumSavings>;
  bestCase: ReturnType<typeof sumSavings> & { qty: number };
  worstCase: ReturnType<typeof sumSavings> & { qty: number };
  explanation: string[];
}

/** Transfers this buyer (same site, phase and material) has already set up. */
export function buyerTransfers(data: EngineData, input: Pick<PreOrderInput, "siteId" | "phaseId" | "materialId">) {
  return data.transfers.filter((t) => {
    if (t.status === "Cancelled" || t.toSiteId !== input.siteId || t.materialId !== input.materialId) return false;
    const phaseId = t.toPhaseId ?? data.needs.find((n) => n.id === t.needId)?.phaseId;
    return phaseId === input.phaseId;
  });
}

/** Forecast quantity already promised to other buyers through forecast reservations. */
function heldAgainstForecast(data: EngineData, forecastId: string, excludeIds: Set<string>): number {
  return data.transfers
    .filter((t) => t.forecastId === forecastId && !t.listingId && t.status !== "Cancelled" && !excludeIds.has(t.id))
    .reduce((a, t) => a + t.qty, 0);
}

export function preOrderCheck(data: EngineData, input: PreOrderInput): PreOrderResult {
  const g = data.assumptions.global;
  const mat = materialById(data, input.materialId);
  const mv = data.assumptions.materials[input.materialId];
  const unit = mat.unit;
  const exclusions: Exclusion[] = [];
  const explanation: string[] = [];
  let remaining = Math.max(0, input.qty);
  const mine = buyerTransfers(data, input);
  const mineIds = new Set(mine.map((t) => t.id));
  const securedQty = mine.reduce((a, t) => a + t.qty, 0);
  if (securedQty > 0) explanation.push(`You already hold ${fmtNum(securedQty)} ${unit} for this phase. It is counted first.`);

  // 1. Actual unclaimed listings that pass hard filters.
  const fromListings: ListingAllocation[] = [];
  const securedListingIds = new Set<string>();
  for (const t of mine.filter((x) => x.listingId)) {
    const l = data.listings.find((x) => x.id === t.listingId);
    if (!l || remaining <= 0) continue;
    const d = siteDistanceKm(data.sites, l.siteId, input.siteId);
    const take = Math.min(remaining, t.qty);
    remaining -= take;
    securedListingIds.add(l.id);
    fromListings.push({ listing: l, distanceKm: d, qty: take, needsApproval: mat.structural, secured: true, savings: savingsFor(l.materialId, take, d, data.assumptions, unit) });
  }
  const listingCands = data.listings
    .filter((l) => materialById(data, l.materialId).category === mat.category && l.materialId === input.materialId)
    .map((l) => ({ l, d: siteDistanceKm(data.sites, l.siteId, input.siteId) }))
    .sort((a, b) => a.d - b.d);

  for (const { l, d } of listingCands) {
    if (securedListingIds.has(l.id)) continue;
    let reason: string | null = null;
    if (l.status !== "available") reason = `Already ${l.status}.`;
    else if (l.availableFrom > input.neededBy) reason = `Available ${fmtDate(l.availableFrom)}, after the need date.`;
    else if (d > g.maxHaulKm) reason = `${fmtNum(d)} km away, beyond the ${g.maxHaulKm} km haul limit.`;
    else if (remaining <= 0) reason = "Need already covered.";
    if (reason) {
      exclusions.push({ kind: "listing", id: l.id, siteId: l.siteId, qty: l.qty, reason });
      continue;
    }
    const take = Math.min(remaining, l.qty);
    remaining -= take;
    fromListings.push({
      listing: l,
      distanceKm: d,
      qty: take,
      needsApproval: mat.structural,
      savings: savingsFor(l.materialId, take, d, data.assumptions, unit),
    });
  }
  const listingQty = input.qty - remaining;
  explanation.push(
    listingQty > 0
      ? `Step 1: ${fmtNum(listingQty)} ${unit} can come from surplus already logged, leaving ${fmtNum(remaining)} ${unit}.`
      : `Step 1: no logged surplus of this item passes the filters (same item, available before ${fmtDate(input.neededBy)}, within ${g.maxHaulKm} km, unclaimed).`,
  );
  if (mat.structural) explanation.push("This is a structural item, so an engineer must approve any transfer before it is reserved.");

  // 2. Forecasts from other sites, ranked by an explainable score.
  const latestAvail = addDays(input.neededBy, -g.handlingBufferDays);
  const forecasts = computeForecasts(data).filter((f) => f.materialId === input.materialId && f.siteId !== input.siteId);
  const needForScore = Math.max(1, remaining);
  const cands: ForecastCandidate[] = [];
  for (const f of forecasts) {
    const d = siteDistanceKm(data.sites, f.siteId, input.siteId);
    const held = heldAgainstForecast(data, f.id, mineIds);
    const availableQty = Math.max(0, f.qty - held);
    const alreadyReserved = mine.filter((t) => t.forecastId === f.id && !t.listingId).reduce((a, t) => a + t.qty, 0);
    let reason: string | null = null;
    if (alreadyReserved > 0) reason = null;
    else if (f.status !== "Forecast") reason = `Already ${f.status.toLowerCase()} as actual surplus. See logged listings.`;
    else if (f.availableFrom > latestAvail)
      reason = `Expected ${fmtDate(f.availableFrom)}, later than ${fmtDate(latestAvail)} (need date minus ${g.handlingBufferDays} days handling).`;
    else if (d > g.maxHaulKm) reason = `${fmtNum(d)} km away, beyond the ${g.maxHaulKm} km haul limit.`;
    else if (availableQty <= 0) reason = "Already fully reserved by other buyers.";
    if (reason) {
      exclusions.push({ kind: "forecast", id: f.id, siteId: f.siteId, qty: f.qty, reason });
      continue;
    }
    const slackDays = diffDays(f.availableFrom, latestAvail);
    const parts = {
      coverage: Math.min(1, availableQty / needForScore),
      distance: Math.max(0, 1 - d / g.maxHaulKm),
      timing: Math.min(1, slackDays / 30),
      confidence: f.confidence,
    };
    const score =
      g.weightCoverage * parts.coverage + g.weightDistance * parts.distance + g.weightTiming * parts.timing + g.weightConfidence * parts.confidence;
    cands.push({
      forecast: f,
      distanceKm: d,
      slackDays,
      score: Math.round(score * 100) / 100,
      scoreParts: parts,
      availableQty,
      reservedQty: 0,
      alreadyReserved,
      savings: savingsFor(f.materialId, 0, d, data.assumptions, unit),
      explanation: [
        `Score ${score.toFixed(2)} = ${g.weightCoverage} × coverage ${parts.coverage.toFixed(2)} + ${g.weightDistance} × distance ${parts.distance.toFixed(2)} + ${g.weightTiming} × timing ${parts.timing.toFixed(2)} + ${g.weightConfidence} × confidence ${parts.confidence.toFixed(2)}.`,
        `${fmtNum(d, 1)} km from the buying site; available ${slackDays} days before the latest usable date.`,
      ],
    });
  }
  cands.sort((a, b) => b.alreadyReserved - a.alreadyReserved || b.score - a.score);

  // 3. Reserve against ranked forecasts.
  let reservedForecast = 0;
  let confWeighted = 0;
  for (const c of cands) {
    if (remaining <= 0) break;
    // A hold the buyer already placed (possibly a modified quantity) is respected as-is.
    const usable = c.alreadyReserved > 0 ? c.alreadyReserved : input.conservative ? Math.floor(c.availableQty * c.forecast.confidence) : c.availableQty;
    const take = Math.min(remaining, usable);
    if (take <= 0) continue;
    c.reservedQty = take;
    c.savings = savingsFor(c.forecast.materialId, take, c.distanceKm, data.assumptions, unit);
    remaining -= take;
    reservedForecast += take;
    confWeighted += take * c.forecast.confidence;
  }
  const orderNow = remaining;
  const confidence = reservedForecast > 0 ? Math.round((confWeighted / reservedForecast) * 100) / 100 : null;
  const risk = confidence === null ? null : riskLabel(confidence, g);
  const decisionDate = addDays(input.neededBy, -(mv.leadTimeDays + g.handlingBufferDays));

  const top = cands.find((c) => c.reservedQty > 0);
  if (top) {
    const f = top.forecast;
    explanation.push(
      `Step 2: ${siteName(data, f.siteId)} is forecast to have ${fmtNum(top.availableQty)} ${unit} spare from ${fmtDate(f.availableFrom)} with a progress-based score of ${f.confidence.toFixed(2)}.`,
      input.conservative
        ? `Conservative mode: reserve only forecast × score, ${fmtNum(top.availableQty)} × ${f.confidence.toFixed(2)} = ${fmtNum(top.reservedQty)} ${unit}.`
        : `Reserve min(${fmtNum(listingQty > 0 ? input.qty - listingQty : input.qty)} still needed, ${fmtNum(top.availableQty)} forecast) = ${fmtNum(top.reservedQty)} ${unit}.`,
    );
  } else {
    explanation.push("Step 2: no forecast surplus from other sites arrives in time and within range.");
  }
  explanation.push(
    `Step 3: order ${fmtNum(orderNow)} ${unit} now.`,
    `Decision date: ${fmtDate(input.neededBy)} minus ${mv.leadTimeDays} days supplier lead time minus ${g.handlingBufferDays} days handling = ${fmtDate(decisionDate)}. Confirm the forecast by then, or place a top-up order for any shortfall.`,
  );

  const listingSavings = fromListings.map((a) => a.savings);
  const reservedSavings = cands.filter((c) => c.reservedQty > 0).map((c) => c.savings);
  const expected = sumSavings([...listingSavings, ...reservedSavings]);

  // Best case: every ranked forecast delivers its full quantity. Worst case: only the confidence-weighted share.
  const scenario = (weighted: boolean) => {
    let rem = input.qty - listingQty;
    const parts: Savings[] = [...listingSavings];
    let qty = listingQty;
    for (const c of cands) {
      if (rem <= 0) break;
      const usable = weighted ? Math.floor(c.availableQty * c.forecast.confidence) : c.availableQty;
      const take = Math.min(rem, usable);
      if (take <= 0) continue;
      rem -= take;
      qty += take;
      parts.push(savingsFor(c.forecast.materialId, take, c.distanceKm, data.assumptions, unit));
    }
    return { ...sumSavings(parts), qty };
  };

  return {
    input,
    unit,
    fromListings,
    listingQty,
    forecasts: cands,
    reservedForecast,
    orderNow,
    confidence,
    risk,
    decisionDate,
    leadTimeDays: mv.leadTimeDays,
    securedQty,
    exclusions,
    expected,
    bestCase: scenario(false),
    worstCase: scenario(true),
    explanation,
  };
}
