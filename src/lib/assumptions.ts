import type { MaterialValues } from "./types";

/**
 * Every money, weight, carbon, timing and scoring value used by the engine.
 * Each one is an ASSUMPTION with a source still to confirm. Edit them in
 * Settings; the Radar and dashboard recalculate live.
 */
export interface Assumption {
  value: number;
  unit: string;
  label: string;
  tag: "ASSUMPTION";
  sourceToConfirm: string;
}

const a = (value: number, unit: string, label: string, sourceToConfirm: string): Assumption => ({
  value,
  unit,
  label,
  tag: "ASSUMPTION",
  sourceToConfirm,
});

export const globalAssumptions = {
  confidenceMin: a(0.3, "0 to 1", "Forecast confidence below the low progress mark", "Back-test against SDP phase close-out records"),
  confidenceMax: a(0.9, "0 to 1", "Forecast confidence at or above the high progress mark", "Back-test against SDP phase close-out records"),
  progressLow: a(25, "% progress", "Low progress mark", "Back-test against SDP phase close-out records"),
  progressHigh: a(80, "% progress", "High progress mark", "Back-test against SDP phase close-out records"),
  handlingBufferDays: a(3, "days", "Handling buffer before a need date", "Site storekeepers, pilot township"),
  maxHaulKm: a(60, "km", "Maximum haul distance between sites", "SDP logistics or main contractor"),
  truckCapacityT: a(10, "tonnes per trip", "Truck capacity for transfers", "Transport contractor quote"),
  haulCostRmPerKm: a(4, "RM per km", "Haul cost per km (return trip counted)", "Transport contractor quote"),
  riskHigh: a(0.75, "confidence", "High confidence threshold", "Pilot review of forecast accuracy"),
  riskMedium: a(0.5, "confidence", "Medium confidence threshold", "Pilot review of forecast accuracy"),
  weightCoverage: a(0.4, "weight", "Score weight: quantity coverage", "Procurement team workshop"),
  weightDistance: a(0.25, "weight", "Score weight: distance", "Procurement team workshop"),
  weightTiming: a(0.15, "weight", "Score weight: timing slack", "Procurement team workshop"),
  weightConfidence: a(0.2, "weight", "Score weight: confidence or condition", "Procurement team workshop"),
  confirmTolerancePct: a(15, "%", "Actual within this of forecast counts as Confirmed", "Pilot review of forecast accuracy"),
  unclaimedAlertDays: a(21, "days", "Alert when surplus is unclaimed for", "Sustainability team"),
  communityOfferDays: a(30, "days", "Offer to community projects after", "Sustainability team and township management"),
} satisfies Record<string, Assumption>;

export type GlobalAssumptionKey = keyof typeof globalAssumptions;

type MaterialAssumptions = { [K in keyof MaterialValues]: Assumption };

const COST_SRC = "Supplier quotes, Klang Valley, 2026";
const CARBON_SRC = "ICE database v3 (Circular Ecology) or supplier EPD";
const WEIGHT_SRC = "Manufacturer data sheet";
const LEAD_SRC = "SDP procurement records";
const WASTE_SRC = "SDP QS standard allowance";

function mat(unitCostRm: number, kgPerUnit: number, co2ePerKg: number, leadTimeDays: number, wastageAllowance: number, unit: string): MaterialAssumptions {
  return {
    unitCostRm: a(unitCostRm, `RM per ${unit}`, "Unit cost", COST_SRC),
    kgPerUnit: a(kgPerUnit, `kg per ${unit}`, "Weight", WEIGHT_SRC),
    co2ePerKg: a(co2ePerKg, "kg CO2e per kg", "Embodied carbon (illustrative)", CARBON_SRC),
    leadTimeDays: a(leadTimeDays, "days", "Supplier lead time", LEAD_SRC),
    wastageAllowance: a(wastageAllowance, "fraction", "Wastage allowance", WASTE_SRC),
  };
}

export const materialAssumptions: Record<string, MaterialAssumptions> = {
  "tile-porcelain": mat(14, 8, 0.78, 10, 0.05, "pc"),
  "tile-wall": mat(6, 3.2, 0.78, 10, 0.06, "pc"),
  plywood: mat(95, 32, 0.68, 7, 0.08, "sheet"),
  batten: mat(4.5, 2.1, 0.45, 7, 0.1, "m"),
  paver: mat(38, 130, 0.12, 7, 0.05, "m²"),
  kerb: mat(28, 75, 0.13, 14, 0.03, "pc"),
  rebar: mat(3.6, 1, 1.99, 7, 0.05, "kg"),
  "brc-mesh": mat(120, 38, 1.99, 7, 0.04, "sheet"),
  aggregate: mat(55, 1000, 0.005, 3, 0.05, "tonne"),
  sand: mat(60, 1000, 0.005, 3, 0.05, "tonne"),
  cement: mat(21, 50, 0.91, 3, 0.03, "bag"),
  prop: mat(85, 16, 1.55, 7, 0, "pc"),
  "u-drain": mat(145, 210, 0.13, 21, 0.03, "pc"),
  barrier: mat(180, 9, 1.9, 5, 0, "pc"),
  netting: mat(220, 12, 2.3, 5, 0, "roll"),
};

export type AssumptionsState = {
  global: Record<GlobalAssumptionKey, number>;
  materials: Record<string, MaterialValues>;
};

/** Plain numbers, as stored in app state and edited in Settings. */
export function defaultAssumptions(): AssumptionsState {
  const global = Object.fromEntries(
    Object.entries(globalAssumptions).map(([k, v]) => [k, v.value]),
  ) as Record<GlobalAssumptionKey, number>;
  const materials = Object.fromEntries(
    Object.entries(materialAssumptions).map(([id, m]) => [
      id,
      {
        unitCostRm: m.unitCostRm.value,
        kgPerUnit: m.kgPerUnit.value,
        co2ePerKg: m.co2ePerKg.value,
        leadTimeDays: m.leadTimeDays.value,
        wastageAllowance: m.wastageAllowance.value,
      },
    ]),
  ) as Record<string, MaterialValues>;
  return { global, materials };
}
