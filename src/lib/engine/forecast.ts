import type { AssumptionsState } from "../assumptions";
import { fmtDate, fmtNum, fmtPct } from "../format";
import type { Forecast, ForecastOutcome, Phase, PurchasePlan } from "../types";
import { materialById, type EngineData } from "./context";

/** expected surplus = max(0, ordered - planned x (1 + wastage)) */
export function expectedSurplusQty(orderedQty: number, plannedQty: number, wastageAllowance: number): number {
  return Math.max(0, Math.round(orderedQty - plannedQty * (1 + wastageAllowance)));
}

/**
 * Confidence rises with phase progress: confidenceMin below progressLow,
 * linear up to confidenceMax at progressHigh or more. Rounded to 2 decimals.
 */
export function confidenceFor(progressPct: number, g: AssumptionsState["global"]): number {
  const { confidenceMin: lo, confidenceMax: hi, progressLow: pLo, progressHigh: pHi } = g;
  let c: number;
  if (progressPct < pLo) c = lo;
  else if (progressPct >= pHi) c = hi;
  else c = lo + ((progressPct - pLo) / (pHi - pLo)) * (hi - lo);
  return Math.round(c * 100) / 100;
}

export function riskLabel(confidence: number, g: AssumptionsState["global"]): "High" | "Medium" | "Low" {
  if (confidence >= g.riskHigh) return "High";
  if (confidence >= g.riskMedium) return "Medium";
  return "Low";
}

export function forecastId(planId: string): string {
  return `fc-${planId}`;
}

export function forecastForPlan(
  plan: PurchasePlan,
  phase: Phase,
  data: Pick<EngineData, "materials" | "assumptions">,
  outcome?: ForecastOutcome,
): Forecast | null {
  if (phase.status === "completed" && !outcome) return null;
  const mv = data.assumptions.materials[plan.materialId];
  const g = data.assumptions.global;
  const qty = expectedSurplusQty(plan.orderedQty, plan.plannedQty, mv.wastageAllowance);
  if (qty <= 0) return null;
  const m = materialById(data, plan.materialId);
  const confidence = confidenceFor(phase.progressPct, g);
  const needed = plan.plannedQty * (1 + mv.wastageAllowance);
  const explanation = [
    `Ordered ${fmtNum(plan.orderedQty)} ${m.unit} against a BoQ quantity of ${fmtNum(plan.plannedQty)} ${m.unit}.`,
    `With a ${fmtPct(mv.wastageAllowance)} wastage allowance the phase should use ${fmtNum(plan.plannedQty)} × ${fmtNum(1 + mv.wastageAllowance, 2)} = ${fmtNum(needed)} ${m.unit}.`,
    `Expected surplus: ${fmtNum(plan.orderedQty)} − ${fmtNum(needed)} = ${fmtNum(qty)} ${m.unit}.`,
    `The phase is ${phase.progressPct}% complete, so the progress-based score is ${confidence.toFixed(2)} (it starts at ${g.confidenceMin.toFixed(2)} below ${g.progressLow}% progress and rises to ${g.confidenceMax.toFixed(2)} at ${g.progressHigh}%).`,
    `Available from ${fmtDate(phase.plannedEnd)}, the planned end of the phase.`,
  ];
  if (outcome) {
    const diff = outcome.actualQty - outcome.forecastQty;
    explanation.push(
      `${outcome.status} on ${fmtDate(outcome.loggedAt)}: actual ${fmtNum(outcome.actualQty)} ${m.unit} logged, ${diff >= 0 ? "+" : ""}${fmtNum(diff)} against the forecast.`,
    );
  }
  return {
    id: forecastId(plan.id),
    planId: plan.id,
    phaseId: phase.id,
    siteId: phase.siteId,
    materialId: plan.materialId,
    qty,
    confidence,
    availableFrom: phase.plannedEnd,
    status: outcome ? outcome.status : "Forecast",
    explanation,
  };
}

export function computeForecasts(data: Pick<EngineData, "plans" | "phases" | "materials" | "assumptions" | "outcomes">): Forecast[] {
  const out: Forecast[] = [];
  for (const plan of data.plans) {
    const phase = data.phases.find((p) => p.id === plan.phaseId);
    if (!phase) continue;
    const outcome = data.outcomes.find((o) => o.forecastId === forecastId(plan.id));
    const f = forecastForPlan(plan, phase, data, outcome);
    if (f) out.push(f);
  }
  return out;
}

/** Compare an actual logged surplus with its forecast. */
export function recordActual(forecast: Pick<Forecast, "id" | "qty" | "materialId" | "siteId">, actualQty: number, loggedAt: string, tolerancePct: number): ForecastOutcome {
  const errPct = forecast.qty > 0 ? (Math.abs(actualQty - forecast.qty) / forecast.qty) * 100 : 100;
  return {
    forecastId: forecast.id,
    status: errPct <= tolerancePct ? "Confirmed" : "Revised",
    forecastQty: forecast.qty,
    actualQty,
    loggedAt,
    materialId: forecast.materialId,
    siteId: forecast.siteId,
  };
}

/** 1 minus mean absolute percentage error, each error capped at 100%. */
export function forecastAccuracy(outcomes: ForecastOutcome[]): number | null {
  if (outcomes.length === 0) return null;
  const errs = outcomes.map((o) => Math.min(1, Math.abs(o.actualQty - o.forecastQty) / Math.max(1, o.forecastQty)));
  return 1 - errs.reduce((a, b) => a + b, 0) / errs.length;
}
