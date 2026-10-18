import { globalAssumptions } from "../assumptions";
import type { PhotoAnalysis } from "../ai/schema";
import { materialById, siteName, type EngineData } from "../engine/context";
import { expectedSurplusQty } from "../engine/forecast";
import { siteDistanceKm } from "../engine/geo";
import type { Match } from "../engine/matching";
import type { PreOrderInput, PreOrderResult } from "../engine/preorder";
import { savingsFor, type Savings } from "../engine/savings";
import { addDays, diffDays, fmtDate, fmtNum, fmtPct, fmtRm } from "../format";
import type { Forecast, Need, Phase, Transfer } from "../types";
import type { Alternative, AssumptionUsed, CalculationStep, Certainty, CertaintyLevel, EvidenceRef, Explanation, Reason } from "./types";

/** Progress older than this many days is flagged as stale. */
export const STALE_PROGRESS_DAYS = 21;

const ORDER: CertaintyLevel[] = ["insufficient", "tentative", "moderate", "strong"];
export const weakest = (...levels: CertaintyLevel[]) => levels.reduce((a, b) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b));

const NO_BACKTEST = "We have not yet checked this forecast rule against real past projects. The score is a rule of thumb, not a measured probability.";

const g = (data: EngineData, key: keyof typeof globalAssumptions): AssumptionUsed => ({
  key,
  label: globalAssumptions[key].label,
  value: `${data.assumptions.global[key]} ${globalAssumptions[key].unit}`,
});

function phaseFreshness(phase: Phase, today: string) {
  if (!phase.progressAsOf) return { stale: true, age: null as number | null };
  const age = diffDays(phase.progressAsOf, today);
  return { stale: age > STALE_PROGRESS_DAYS, age };
}

function savingsSteps(s: Savings, name: string, materialId: string, distanceKm: number, data: EngineData): CalculationStep[] {
  const mv = data.assumptions.materials[materialId];
  const rate = data.assumptions.global.haulCostRmPerKm;
  return [
    { label: `${name}: purchase avoided`, formula: `${fmtNum(s.qty)} × RM ${fmtNum(mv.unitCostRm, 2)}`, result: fmtRm(s.valueRm) },
    { label: `${name}: haulage`, formula: `${s.trips} load${s.trips === 1 ? "" : "s"} × ${fmtNum(distanceKm, 1)} km × 2 × RM ${fmtNum(rate, 2)}`, result: fmtRm(s.haulRm) },
    { label: `${name}: estimated saving`, formula: `${fmtRm(s.valueRm)} − ${fmtRm(s.haulRm)}`, result: fmtRm(s.savedRm) },
    { label: `${name}: weight reused`, formula: `${fmtNum(s.qty)} × ${fmtNum(mv.kgPerUnit, 1)} kg`, result: `${fmtNum(s.tonnes, 2)} t` },
    { label: `${name}: CO2e, illustrative`, formula: `${fmtNum(s.tonnes * 1000)} kg × ${fmtNum(mv.co2ePerKg, 3)}`, result: `${fmtNum(s.co2eKg)} kg` },
  ];
}

/* ------------------------------------------------------------------ */
/* Forecast                                                            */
/* ------------------------------------------------------------------ */

export function forecastCertainty(f: Forecast, phase: Phase, today: string): Certainty {
  if (f.status !== "Forecast") {
    return {
      level: "strong",
      basis: `The actual surplus was logged and checked on site, so this is now ${f.status.toLowerCase()} rather than predicted.`,
      calibrated: false,
      missing: [],
      couldChange: ["A recount at collection."],
    };
  }
  const fresh = phaseFreshness(phase, today);
  const missing = [NO_BACKTEST, "The ordered amount comes from the purchase plan. Actual deliveries and returns were not checked."];
  if (fresh.stale) missing.push(fresh.age === null ? "Phase progress has no reported date." : `Phase progress was last reported ${fresh.age} days ago.`);
  let level: CertaintyLevel = phase.progressPct >= 60 ? "moderate" : "tentative";
  if (fresh.stale) level = weakest(level, "tentative");
  return {
    level,
    basis:
      level === "moderate"
        ? `The phase is ${phase.progressPct}% complete, so most of the ordered material has been used and the remaining quantity is easier to judge.`
        : `The phase is only ${phase.progressPct}% complete${fresh.stale ? " and its progress report is out of date" : ""}, so much of the order is still to be used.`,
    calibrated: false,
    score: { value: f.confidence, label: `Worked out from phase progress with a rule of thumb you can change on the Assumptions page (score ${f.confidence.toFixed(2)}). It is a guide, not a calibrated probability.` },
    missing,
    couldChange: ["Design changes or breakage that use more material than planned.", "Ordered quantities being returned to the supplier.", "A late or early phase finish."],
  };
}

export function explainForecast(f: Forecast, data: EngineData): Explanation {
  const plan = data.plans.find((p) => p.id === f.planId)!;
  const phase = data.phases.find((p) => p.id === f.phaseId)!;
  const m = materialById(data, f.materialId);
  const mv = data.assumptions.materials[f.materialId];
  const needed = plan.plannedQty * (1 + mv.wastageAllowance);
  const fresh = phaseFreshness(phase, data.today);
  const outcome = data.outcomes.find((o) => o.forecastId === f.id);
  const site = siteName(data, f.siteId);
  return {
    kind: "forecast",
    method: "Deterministic rule: ordered quantity minus planned quantity with wastage. No AI model is involved.",
    recommendation: `Expect about ${fmtNum(f.qty)} ${m.unit} of ${m.name.toLowerCase()} spare at ${site}, ${phase.name}, from ${fmtDate(f.availableFrom)}.`,
    outcome: "Buyers on other sites can reserve this before ordering, so the same material is not bought new.",
    reasons: [
      { code: "ORDER_EXCEEDS_PLAN", label: "More ordered than the plans need", detail: `${fmtNum(plan.orderedQty)} ordered against ${fmtNum(needed)} needed including ${fmtPct(mv.wastageAllowance)} wastage.`, effect: "supports" },
      {
        code: "PHASE_PROGRESS",
        label: `Phase ${phase.progressPct}% complete`,
        detail: phase.progressPct >= 60 ? "Most of the order has already been used, so the leftover is easier to judge." : "Much of the order is still to be used; the leftover could shrink.",
        effect: phase.progressPct >= 60 ? "supports" : "weakens",
      },
      ...(fresh.stale
        ? [{ code: "STALE_PROGRESS", label: "Progress report is out of date", detail: fresh.age === null ? "No progress date recorded." : `Last reported ${fresh.age} days ago (limit ${STALE_PROGRESS_DAYS}).`, effect: "weakens" as const }]
        : []),
      { code: "AVAILABLE_DATE", label: `Available from ${fmtDate(f.availableFrom)}`, detail: "Taken from the phase's planned end date.", effect: "supports" },
    ],
    evidence: [
      { id: plan.id, kind: "purchase-plan", label: "Purchase plan line", detail: `${m.name}: planned ${fmtNum(plan.plannedQty)}, ordered ${fmtNum(plan.orderedQty)} ${m.unit}`, provenance: "recorded", href: `/app/radar?forecast=${f.id}` },
      { id: phase.id, kind: "phase", label: `${site}, ${phase.name}`, detail: `${phase.progressPct}% complete, planned end ${fmtDate(phase.plannedEnd)}`, provenance: "recorded", asOf: phase.progressAsOf, stale: fresh.stale },
      ...(outcome ? [{ id: f.id, kind: "listing" as const, label: "Actual surplus logged", detail: `${fmtNum(outcome.actualQty)} ${m.unit} on ${fmtDate(outcome.loggedAt)}`, provenance: "recorded" as const, asOf: outcome.loggedAt }] : []),
    ],
    facts: [
      { label: "Ordered", value: `${fmtNum(plan.orderedQty)} ${m.unit}`, provenance: "recorded" },
      { label: "Planned (bill of quantities)", value: `${fmtNum(plan.plannedQty)} ${m.unit}`, provenance: "recorded" },
      { label: "Wastage allowance", value: fmtPct(mv.wastageAllowance), provenance: "assumption" },
      { label: "Expected surplus", value: `${fmtNum(f.qty)} ${m.unit}`, provenance: "calculated" },
    ],
    assumptions: [
      { key: `${f.materialId}.wastage`, label: `${m.name} wastage allowance`, value: fmtPct(mv.wastageAllowance) },
      g(data, "confidenceMin"),
      g(data, "confidenceMax"),
      g(data, "progressLow"),
      g(data, "progressHigh"),
    ],
    calculations: [
      { label: "Quantity the phase should use", formula: `${fmtNum(plan.plannedQty)} × (1 + ${mv.wastageAllowance})`, result: `${fmtNum(needed)} ${m.unit}` },
      { label: "Expected surplus", formula: `max(0, ${fmtNum(plan.orderedQty)} − ${fmtNum(needed)})`, result: `${fmtNum(expectedSurplusQty(plan.orderedQty, plan.plannedQty, mv.wastageAllowance))} ${m.unit}` },
      { label: "Progress-based score", formula: `rises linearly from ${data.assumptions.global.confidenceMin} at ${data.assumptions.global.progressLow}% to ${data.assumptions.global.confidenceMax} at ${data.assumptions.global.progressHigh}%`, result: f.confidence.toFixed(2) },
    ],
    limitations: ["Based on simulated purchase plans.", "Does not know about breakage, theft, design changes or returns."],
    alternatives: [],
    certainty: forecastCertainty(f, phase, data.today),
    requiresHumanApproval: false,
  };
}

/* ------------------------------------------------------------------ */
/* Pre-Order Check                                                     */
/* ------------------------------------------------------------------ */

export function explainPreOrder(r: PreOrderResult, data: EngineData): Explanation {
  const input: PreOrderInput = r.input;
  const m = materialById(data, input.materialId);
  const u = m.unit;
  const buyer = siteName(data, input.siteId);
  const used = r.forecasts.filter((c) => c.reservedQty > 0);
  const heldBefore = r.securedQty;

  const parts: string[] = [];
  if (r.listingQty > 0) parts.push(`use ${fmtNum(r.listingQty)} from logged surplus`);
  if (r.reservedForecast > 0) parts.push(`reserve ${fmtNum(r.reservedForecast)} from forecast surplus`);
  parts.push(`order ${fmtNum(r.orderNow)} new`);
  const recommendation = `For ${fmtNum(input.qty)} ${u} at ${buyer}: ${parts.join(", ")}.`;

  const reasons: Reason[] = [];
  if (heldBefore > 0) reasons.push({ code: "OWN_HOLD", label: "You already hold some of this", detail: `${fmtNum(heldBefore)} ${u} reserved earlier for this phase are counted first.`, effect: "supports" });
  for (const a of r.fromListings) {
    reasons.push({
      code: "LOGGED_SURPLUS",
      label: `Logged surplus at ${siteName(data, a.listing.siteId)}`,
      detail: `${fmtNum(a.qty)} ${u} available now, ${fmtNum(a.distanceKm, 1)} km away, condition ${a.listing.condition} (as recorded by ${a.listing.loggedBy}).`,
      effect: "supports",
    });
  }
  for (const c of used) {
    reasons.push({
      code: "FORECAST_IN_TIME",
      label: `Forecast at ${siteName(data, c.forecast.siteId)} arrives in time`,
      detail: `${fmtNum(c.availableQty)} ${u} expected from ${fmtDate(c.forecast.availableFrom)}, ${c.slackDays} days before your latest usable date, ${fmtNum(c.distanceKm, 1)} km away.`,
      effect: "supports",
    });
  }
  if (input.conservative && used.length) reasons.push({ code: "CONSERVATIVE", label: "Conservative mode is on", detail: "Only forecast × score is reserved, to leave room for a smaller actual surplus.", effect: "weakens" });
  if (r.orderNow > 0) reasons.push({ code: "SHORTFALL", label: `${fmtNum(r.orderNow)} ${u} still uncovered`, detail: "No other surplus passes the filters, so this part is ordered new now.", effect: "supports" });
  if (m.structural) reasons.push({ code: "STRUCTURAL", label: "Structural item", detail: "An engineer must approve any transfer before it is reserved.", effect: "blocks" });

  const evidence: EvidenceRef[] = [
    ...r.fromListings.map((a) => ({
      id: a.listing.id,
      kind: "listing" as const,
      label: `Listing ${a.listing.id}, ${siteName(data, a.listing.siteId)}`,
      detail: `${fmtNum(a.listing.qty)} ${u}, ${a.listing.condition}, logged ${fmtDate(a.listing.loggedAt)}${a.listing.aiEstimated ? ", quantity first estimated from a photo" : ""}`,
      provenance: "recorded" as const,
      href: `/app/surplus?listing=${a.listing.id}`,
      asOf: a.listing.loggedAt,
    })),
    ...used.flatMap((c) => {
      const phase = data.phases.find((p) => p.id === c.forecast.phaseId)!;
      const plan = data.plans.find((p) => p.id === c.forecast.planId)!;
      const fresh = phaseFreshness(phase, data.today);
      return [
        { id: c.forecast.id, kind: "forecast" as const, label: `Forecast for ${siteName(data, c.forecast.siteId)}, ${phase.name}`, detail: `${fmtNum(c.forecast.qty)} ${u} from ${fmtDate(c.forecast.availableFrom)}`, provenance: "calculated" as const, href: `/app/radar?forecast=${c.forecast.id}` },
        { id: plan.id, kind: "purchase-plan" as const, label: "Purchase plan line", detail: `Planned ${fmtNum(plan.plannedQty)}, ordered ${fmtNum(plan.orderedQty)} ${u}`, provenance: "recorded" as const },
        { id: phase.id, kind: "phase" as const, label: "Phase progress", detail: `${phase.progressPct}% complete`, provenance: "recorded" as const, asOf: phase.progressAsOf, stale: fresh.stale },
      ];
    }),
    ...data.needs
      .filter((n) => n.siteId === input.siteId && n.phaseId === input.phaseId && n.materialId === input.materialId)
      .map((n) => ({ id: n.id, kind: "need" as const, label: `Need ${n.id}`, detail: `${fmtNum(n.qty)} ${u} by ${fmtDate(n.neededBy)}, posted by ${n.postedBy}`, provenance: "recorded" as const, href: `/app/needs?need=${n.id}` })),
  ];

  const mv = data.assumptions.materials[input.materialId];
  const gl = data.assumptions.global;
  const calculations: CalculationStep[] = [
    { label: "Latest usable arrival", formula: `${fmtDate(input.neededBy)} − ${gl.handlingBufferDays} days handling`, result: fmtDate(addDays(input.neededBy, -gl.handlingBufferDays)) },
    ...used.map((c) => ({
      label: `Reserve from ${siteName(data, c.forecast.siteId)}`,
      formula: c.alreadyReserved > 0 ? `your existing hold of ${fmtNum(c.alreadyReserved)}` : input.conservative ? `min(still needed, ${fmtNum(c.availableQty)} × ${c.forecast.confidence.toFixed(2)})` : `min(still needed, ${fmtNum(c.availableQty)} available)`,
      result: `${fmtNum(c.reservedQty)} ${u}`,
    })),
    { label: "Order now", formula: `${fmtNum(input.qty)} − ${fmtNum(r.listingQty)} − ${fmtNum(r.reservedForecast)}`, result: `${fmtNum(r.orderNow)} ${u}` },
    { label: "Decision date", formula: `${fmtDate(input.neededBy)} − ${r.leadTimeDays} days lead time − ${gl.handlingBufferDays} days handling`, result: fmtDate(r.decisionDate) },
    ...used.map((c) => ({
      label: `Rank score, ${siteName(data, c.forecast.siteId)}`,
      formula: `${gl.weightCoverage}×${c.scoreParts.coverage.toFixed(2)} + ${gl.weightDistance}×${c.scoreParts.distance.toFixed(2)} + ${gl.weightTiming}×${c.scoreParts.timing.toFixed(2)} + ${gl.weightConfidence}×${c.scoreParts.confidence.toFixed(2)}`,
      result: c.score.toFixed(2),
    })),
    ...r.fromListings.flatMap((a) => savingsSteps(a.savings, `Listing ${a.listing.id}`, a.listing.materialId, a.distanceKm, data)),
    ...used.flatMap((c) => savingsSteps(c.savings, siteName(data, c.forecast.siteId), c.forecast.materialId, c.distanceKm, data)),
  ];

  // Certainty: weakest part of what is being relied on.
  const levels: CertaintyLevel[] = [];
  const missing: string[] = [];
  if (r.fromListings.length) levels.push("strong");
  for (const c of used) {
    const phase = data.phases.find((p) => p.id === c.forecast.phaseId)!;
    const fc = forecastCertainty(c.forecast, phase, data.today);
    levels.push(fc.level);
    missing.push(...fc.missing);
  }
  const level: CertaintyLevel = levels.length ? weakest(...levels) : "moderate";
  const certainty: Certainty = {
    level,
    basis: used.length
      ? `Relies on a forecast that is ${level === "moderate" ? "reasonably well supported" : "still uncertain"}. The order-now part is certain; the reserved part depends on the surplus actually appearing.`
      : r.fromListings.length
        ? "Relies only on surplus already logged on site."
        : "No surplus passes the filters today, so ordering in full is the safe default. New surplus could still be logged.",
    calibrated: false,
    score: r.confidence !== null ? { value: r.confidence, label: `The forecast part has a progress-based score of ${r.confidence.toFixed(2)}. It is a rule of thumb, not a calibrated probability.` } : undefined,
    missing: [...new Set(missing)],
    couldChange: [
      ...(used.length ? [`The source site logging a different quantity before ${fmtDate(r.decisionDate)}.`] : []),
      "Another buyer reserving the same surplus first.",
      "Changes to the haul limit, handling buffer or lead time on the Assumptions page.",
    ],
  };

  const alternatives: Alternative[] = [
    {
      id: "order-all",
      label: "Order everything new",
      summary: `Buy all ${fmtNum(input.qty)} ${u} now and ignore surplus.`,
      tradeoffs: ["No dependency on another site.", `Forgoes about ${fmtRm(r.expected.savedRm)} and ${fmtNum(r.expected.tonnes, 1)} t of reuse.`],
    },
    ...(used.length && !input.conservative
      ? [{ id: "conservative", label: "Conservative mode", summary: `Reserve ${fmtNum(r.worstCase.qty - r.listingQty)}, order ${fmtNum(input.qty - r.worstCase.qty)} now.`, tradeoffs: ["Less exposed if the surplus is smaller.", `Saves less: about ${fmtRm(r.worstCase.savedRm)}.`] }]
      : []),
    ...r.forecasts.filter((c) => c.reservedQty === 0).map((c) => ({
      id: c.forecast.id,
      label: `Forecast at ${siteName(data, c.forecast.siteId)}`,
      summary: `${fmtNum(c.availableQty)} ${u} from ${fmtDate(c.forecast.availableFrom)}, ${fmtNum(c.distanceKm, 1)} km.`,
      tradeoffs: [`Ranked lower (score ${c.score.toFixed(2)}).`],
      score: c.score,
    })),
    ...r.exclusions.map((e) => ({
      id: e.id,
      label: `${e.kind === "forecast" ? "Forecast" : "Listing"} at ${siteName(data, e.siteId)}`,
      summary: `${fmtNum(e.qty)} ${u}`,
      tradeoffs: [],
      excludedReason: e.reason,
    })),
  ];

  return {
    kind: "preorder",
    method: "Deterministic Pre-Order Check: your existing holds, then logged surplus, then ranked forecasts. No AI model is involved.",
    recommendation,
    outcome:
      r.reservedForecast + r.listingQty > 0
        ? `Saves an estimated ${fmtRm(r.expected.savedRm)} and keeps about ${fmtNum(r.expected.tonnes, 1)} t of material in use. Confirm the forecast by ${fmtDate(r.decisionDate)} or top up the order.`
        : "Nothing to reserve. Ordering in full avoids a gap.",
    reasons,
    evidence,
    facts: [
      { label: "Needed", value: `${fmtNum(input.qty)} ${u} by ${fmtDate(input.neededBy)}`, provenance: "recorded" },
      { label: "From logged surplus", value: `${fmtNum(r.listingQty)} ${u}`, provenance: "recorded" },
      { label: "Reserved from forecast", value: `${fmtNum(r.reservedForecast)} ${u}`, provenance: "calculated" },
      { label: "Order now", value: `${fmtNum(r.orderNow)} ${u}`, provenance: "calculated" },
      { label: "Estimated saving", value: fmtRm(r.expected.savedRm), provenance: "calculated" },
    ],
    assumptions: [
      g(data, "maxHaulKm"),
      g(data, "handlingBufferDays"),
      { key: `${input.materialId}.lead`, label: `${m.name} supplier lead time`, value: `${mv.leadTimeDays} days` },
      { key: `${input.materialId}.cost`, label: `${m.name} unit cost`, value: `RM ${mv.unitCostRm}` },
      g(data, "haulCostRmPerKm"),
      g(data, "truckCapacityT"),
    ],
    calculations,
    limitations: [
      "Distances are straight-line between approximate township centres, not road routes.",
      "Savings use assumed unit costs and haul rates, not quotes.",
      "Reserving here holds surplus in this prototype only. No supplier order is placed or cancelled.",
    ],
    alternatives,
    certainty,
    requiresHumanApproval: true,
    approvalReason: m.structural ? "Structural item: engineer approval is also needed before the transfer is reserved." : "Reserving commits another site's surplus to you, so a person confirms it.",
  };
}

/* ------------------------------------------------------------------ */
/* Need to listing match                                               */
/* ------------------------------------------------------------------ */

export function matchCertainty(x: Match, need: Need, data: EngineData): Certainty {
  const missing: string[] = ["Condition is as recorded by the source site; nobody from the receiving site has inspected it."];
  if (x.listing.aiEstimated) missing.push("Quantity was first estimated from a photo before the engineer confirmed it.");
  const coverage = x.qty / need.qty;
  const near = x.distanceKm <= data.assumptions.global.maxHaulKm / 2;
  let level: CertaintyLevel;
  if (!x.exactItem) level = "tentative";
  else if (x.needsApproval) level = "tentative";
  else if (coverage >= 1 && near && (x.listing.condition === "new" || x.listing.condition === "good")) level = "strong";
  else if (x.listing.condition === "poor") level = "tentative";
  else level = "moderate";
  return {
    level,
    basis:
      level === "strong"
        ? "Same item, covers the full need, nearby, and recorded in good condition."
        : level === "moderate"
          ? `Same item, but ${coverage < 1 ? "it covers only part of the need" : !near ? "it is further away" : "its condition is only usable"}.`
          : !x.exactItem
            ? "A substitute in the same category; the receiving site must check it is acceptable."
            : x.needsApproval
              ? "Structural item: suitable only after an engineer approves it."
              : "Recorded in poor condition.",
    calibrated: false,
    score: { value: x.score, label: `Rank score ${x.score.toFixed(2)} (weighted sum used for ordering, not a probability)` },
    missing,
    couldChange: ["An inspection finding a different condition.", "Another site claiming the listing first.", "A change in the need date or quantity."],
  };
}

export function explainMatch(x: Match, need: Need, all: Match[], data: EngineData): Explanation {
  const lm = materialById(data, x.listing.materialId);
  const nm = materialById(data, need.materialId);
  const gl = data.assumptions.global;
  const coverage = x.qty / need.qty;
  const slack = diffDays(x.listing.availableFrom, need.neededBy);
  const from = siteName(data, x.listing.siteId);
  const to = siteName(data, need.siteId);
  return {
    kind: "match",
    method: "Deterministic matching: hard filters, then a weighted score. No AI model is involved.",
    recommendation: `Transfer ${fmtNum(x.qty)} ${lm.unit} of ${lm.name.toLowerCase()} from ${from} to ${to}.`,
    outcome: `${coverage >= 1 ? "Covers the whole need" : `Covers ${Math.round(coverage * 100)}% of the need; order the rest`}. Estimated saving ${fmtRm(x.savings.savedRm)}, ${fmtNum(x.savings.tonnes, 2)} t reused.`,
    reasons: [
      x.exactItem
        ? { code: "SAME_ITEM", label: "Same item", detail: `Listing is ${lm.name}, exactly what was requested.`, effect: "supports" }
        : { code: "SUBSTITUTE", label: "Substitute item", detail: `${lm.name} instead of ${nm.name}, same category and unit. Score halved.`, effect: "weakens" },
      { code: "COVERAGE", label: `Covers ${Math.round(coverage * 100)}% of the need`, detail: `${fmtNum(x.qty)} of ${fmtNum(need.qty)} ${nm.unit}.`, effect: coverage >= 1 ? "supports" : "weakens" },
      { code: "DISTANCE", label: `${fmtNum(x.distanceKm, 1)} km away`, detail: `Within the ${gl.maxHaulKm} km haul limit (straight-line, approximate).`, effect: x.distanceKm <= gl.maxHaulKm / 2 ? "supports" : "weakens" },
      { code: "TIMING", label: `Ready ${slack} days early`, detail: `Available ${fmtDate(x.listing.availableFrom)}, needed ${fmtDate(need.neededBy)}.`, effect: "supports" },
      { code: "CONDITION", label: `Condition: ${x.listing.condition}`, detail: `As recorded by ${x.listing.loggedBy}.`, effect: x.listing.condition === "new" || x.listing.condition === "good" ? "supports" : "weakens" },
      ...(x.needsApproval ? [{ code: "STRUCTURAL", label: "Needs engineer approval", detail: "Structural items cannot be reserved until a site engineer approves.", effect: "blocks" as const }] : []),
    ],
    evidence: [
      { id: x.listing.id, kind: "listing", label: `Listing ${x.listing.id}, ${from}`, detail: `${fmtNum(x.listing.qty)} ${lm.unit}, ${x.listing.condition}, logged ${fmtDate(x.listing.loggedAt)} by ${x.listing.loggedBy}`, provenance: "recorded", href: `/app/surplus?listing=${x.listing.id}`, asOf: x.listing.loggedAt },
      { id: need.id, kind: "need", label: `Need ${need.id}, ${to}`, detail: `${fmtNum(need.qty)} ${nm.unit} by ${fmtDate(need.neededBy)}, posted by ${need.postedBy}`, provenance: "recorded", href: `/app/needs?need=${need.id}` },
    ],
    facts: [
      { label: "Distance", value: `${fmtNum(x.distanceKm, 1)} km`, provenance: "calculated" },
      { label: "Quantity moved", value: `${fmtNum(x.qty)} ${lm.unit}`, provenance: "calculated" },
      { label: "Estimated saving", value: fmtRm(x.savings.savedRm), provenance: "calculated" },
    ],
    assumptions: [g(data, "maxHaulKm"), g(data, "weightCoverage"), g(data, "weightDistance"), g(data, "weightTiming"), g(data, "weightConfidence"), { key: `${lm.id}.cost`, label: `${lm.name} unit cost`, value: `RM ${data.assumptions.materials[lm.id].unitCostRm}` }],
    calculations: [
      {
        label: "Rank score",
        formula: `${gl.weightCoverage}×coverage ${Math.min(1, coverage).toFixed(2)} + ${gl.weightDistance}×distance + ${gl.weightTiming}×timing + ${gl.weightConfidence}×condition${x.exactItem ? "" : ", then ×0.5 for a substitute"}`,
        result: x.score.toFixed(2),
      },
      ...savingsSteps(x.savings, "This transfer", x.listing.materialId, x.distanceKm, data),
    ],
    limitations: ["Condition and quantity are as logged; check on collection.", "Distance is straight-line between approximate township centres."],
    alternatives: all.map((y) => ({
      id: y.listing.id,
      label: `${siteName(data, y.listing.siteId)}${y.exactItem ? "" : " (substitute)"}`,
      summary: `${fmtNum(y.qty)} ${materialById(data, y.listing.materialId).unit}, ${fmtNum(y.distanceKm, 1)} km, ${y.listing.condition}`,
      tradeoffs: [`Saves about ${fmtRm(y.savings.savedRm)}`, ...(y.needsApproval ? ["Needs engineer approval"] : [])],
      score: y.score,
      chosen: y.listing.id === x.listing.id,
    })),
    certainty: matchCertainty(x, need, data),
    requiresHumanApproval: true,
    approvalReason: x.needsApproval ? "Structural item: a site engineer must approve before it is reserved." : "Matching commits listed surplus to this need, so a person confirms it.",
  };
}

/* ------------------------------------------------------------------ */
/* Photo classification                                                */
/* ------------------------------------------------------------------ */

export function explainPhoto(a: PhotoAnalysis, mode: "demo" | "live", data: Pick<EngineData, "materials">): Explanation {
  const unknown = a.materialId === "unknown";
  const m = unknown ? null : materialById(data, a.materialId);
  const unitMismatch = m && a.unit && a.unit !== m.unit;
  return {
    kind: "photo",
    method: mode === "live" ? "Photo read by a multimodal AI model (Gemini). The result is a suggestion only." : "Demo mode: a pre-written result for this sample photo. No model ran.",
    recommendation: unknown ? "No item recognised. Fill in the details yourself." : `Looks like ${a.itemName}: about ${fmtNum(a.estimatedQty)} ${a.unit}, condition ${a.condition}.`,
    outcome: "Nothing is saved until you check the item, condition and quantity and confirm.",
    reasons: unknown
      ? []
      : [
          { code: "MODEL_ITEM", label: "Item identified from the photo", detail: a.notes, effect: "supports" },
          { code: "MODEL_QTY", label: "Quantity counted from what is visible", detail: "Hidden layers, partial boxes and pieces out of frame are not counted.", effect: "weakens" },
          ...(a.needsEngineerApproval ? [{ code: "STRUCTURAL", label: "Structural item flagged", detail: "Any transfer will need engineer approval.", effect: "blocks" as const }] : []),
        ],
    evidence: [{ id: "photo", kind: "photo", label: mode === "demo" ? "Sample illustration" : "Your photo", detail: mode === "demo" ? "Canned demo result" : "Analysed on the server; the image is not stored", provenance: mode === "demo" ? "demo" : "model" }],
    facts: [
      { label: "Item", value: a.itemName, provenance: mode === "demo" ? "demo" : "model" },
      { label: "Estimated quantity", value: `${fmtNum(a.estimatedQty)} ${a.unit}`, provenance: mode === "demo" ? "demo" : "model" },
      { label: "Condition", value: a.condition, provenance: mode === "demo" ? "demo" : "model" },
    ],
    assumptions: [],
    calculations: [],
    limitations: [
      "A photo cannot show hidden damage, moisture, or what is underneath a stack.",
      ...(unitMismatch ? [`The model answered in ${a.unit}; this item is counted in ${m!.unit}. Convert before saving.`] : []),
    ],
    alternatives: [],
    certainty: {
      level: unknown ? "insufficient" : "tentative",
      basis: unknown ? "The photo did not give enough to identify the item." : "A photo-based guess until a person checks it on site.",
      calibrated: false,
      score: unknown ? undefined : { value: a.confidence, label: mode === "demo" ? `Demo value ${fmtPct(a.confidence)} (canned, not measured)` : `Model's own estimate ${fmtPct(a.confidence)} (self-reported, not calibrated)` },
      missing: ["A physical count.", "An inspection of the material's condition."],
      couldChange: ["Counting the stack by hand.", "Opening boxes to check for breakage."],
    },
    requiresHumanApproval: true,
    approvalReason: "AI output is a suggestion. The engineer confirms or edits every field before saving.",
  };
}

/* ------------------------------------------------------------------ */
/* Transfer impact                                                     */
/* ------------------------------------------------------------------ */

export function explainTransferImpact(t: Transfer, data: EngineData): Explanation {
  const m = materialById(data, t.materialId);
  const d = siteDistanceKm(data.sites, t.fromSiteId, t.toSiteId);
  const s = savingsFor(t.materialId, t.qty, d, data.assumptions, m.unit);
  const done = t.status === "Completed";
  return {
    kind: "impact",
    method: "Deterministic estimate from the transfer quantity, route distance and assumed unit cost, weight and carbon factors.",
    recommendation: `${done ? "Counted" : "Not yet counted"}: ${fmtRm(s.savedRm)} saved, ${fmtNum(s.tonnes, 2)} t reused, ${fmtNum(s.co2eKg)} kg CO2e avoided (illustrative).`,
    outcome: done ? "Included in the Impact totals because the transfer is completed." : "Appears in Impact totals only once the transfer is completed, so nothing is counted twice.",
    reasons: [],
    evidence: [
      { id: t.id, kind: "transfer", label: `Transfer ${t.id}`, detail: `${fmtNum(t.qty)} ${m.unit}, ${t.status}`, provenance: "recorded", href: `/app/transfers?transfer=${t.id}`, asOf: t.completedAt ?? t.history[t.history.length - 1]?.at },
      ...(t.listingId ? [{ id: t.listingId, kind: "listing" as const, label: `Listing ${t.listingId}`, detail: "Source surplus record", provenance: "recorded" as const, href: `/app/surplus?listing=${t.listingId}` }] : []),
    ],
    facts: [
      { label: "Quantity", value: `${fmtNum(t.qty)} ${m.unit}`, provenance: "recorded" },
      { label: "Distance", value: `${fmtNum(d, 1)} km`, provenance: "calculated" },
      { label: "Saving", value: fmtRm(s.savedRm), provenance: "calculated" },
      { label: "CO2e avoided", value: `${fmtNum(s.co2eKg)} kg`, provenance: "assumption" },
    ],
    assumptions: [
      { key: `${m.id}.cost`, label: `${m.name} unit cost`, value: `RM ${data.assumptions.materials[m.id].unitCostRm}` },
      { key: `${m.id}.kg`, label: `${m.name} weight`, value: `${data.assumptions.materials[m.id].kgPerUnit} kg per ${m.unit}` },
      { key: `${m.id}.co2e`, label: `${m.name} carbon factor`, value: `${data.assumptions.materials[m.id].co2ePerKg} kg CO2e per kg` },
      g(data, "haulCostRmPerKm"),
    ],
    calculations: savingsSteps(s, "Transfer", t.materialId, d, data),
    limitations: ["Carbon factors are placeholders to confirm against ICE v3 or supplier EPDs.", "Transport emissions are not deducted.", "Unit costs are assumed, not invoiced."],
    alternatives: [],
    certainty: {
      level: done ? "moderate" : "tentative",
      basis: done ? "The quantity is recorded; the money and carbon values rest on assumed factors." : "The transfer has not completed, so the quantity could still change.",
      calibrated: false,
      missing: ["Supplier invoice for the avoided purchase.", "Verified carbon factor for this product."],
      couldChange: ["Real unit prices.", "Actual collected quantity."],
    },
    requiresHumanApproval: false,
  };
}
