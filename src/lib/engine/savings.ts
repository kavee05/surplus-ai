import type { AssumptionsState } from "../assumptions";
import { fmtNum, fmtRm } from "../format";

export interface Savings {
  qty: number;
  valueRm: number;
  haulRm: number;
  savedRm: number;
  tonnes: number;
  co2eKg: number;
  trips: number;
  explanation: string[];
}

/**
 * Money, weight and illustrative carbon for reusing `qty` units instead of buying new.
 * saved = qty x unit cost minus haul cost (return trip, per truckload).
 */
export function savingsFor(materialId: string, qty: number, distanceKm: number, cfg: AssumptionsState, unit = "units"): Savings {
  const m = cfg.materials[materialId];
  const g = cfg.global;
  const q = Math.max(0, qty);
  const valueRm = q * m.unitCostRm;
  const kg = q * m.kgPerUnit;
  const tonnes = kg / 1000;
  const trips = q > 0 ? Math.max(1, Math.ceil(tonnes / g.truckCapacityT)) : 0;
  const haulRm = trips * distanceKm * 2 * g.haulCostRmPerKm;
  const savedRm = Math.max(0, valueRm - haulRm);
  const co2eKg = kg * m.co2ePerKg;
  return {
    qty: q,
    valueRm,
    haulRm,
    savedRm,
    tonnes,
    co2eKg,
    trips,
    explanation: [
      `New purchase avoided: ${fmtNum(q)} ${unit} × RM ${fmtNum(m.unitCostRm, 2)} = ${fmtRm(valueRm)}.`,
      `Haul: ${trips} truckload${trips === 1 ? "" : "s"} × ${fmtNum(distanceKm, 1)} km × 2 (return) × RM ${fmtNum(g.haulCostRmPerKm, 2)} per km = ${fmtRm(haulRm)}.`,
      `Estimated saving: ${fmtRm(valueRm)} minus ${fmtRm(haulRm)} = ${fmtRm(savedRm)}.`,
      `Weight diverted: ${fmtNum(q)} × ${fmtNum(m.kgPerUnit, 1)} kg = ${fmtNum(tonnes, 2)} t.`,
      `CO2e avoided (illustrative): ${fmtNum(kg)} kg × ${fmtNum(m.co2ePerKg, 3)} kg CO2e per kg = ${fmtNum(co2eKg)} kg. Transport emissions are not deducted.`,
    ],
  };
}

export function sumSavings(list: Savings[]): Omit<Savings, "explanation" | "qty"> {
  return list.reduce(
    (acc, s) => ({
      valueRm: acc.valueRm + s.valueRm,
      haulRm: acc.haulRm + s.haulRm,
      savedRm: acc.savedRm + s.savedRm,
      tonnes: acc.tonnes + s.tonnes,
      co2eKg: acc.co2eKg + s.co2eKg,
      trips: acc.trips + s.trips,
    }),
    { valueRm: 0, haulRm: 0, savedRm: 0, tonnes: 0, co2eKg: 0, trips: 0 },
  );
}
