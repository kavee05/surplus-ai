import { HERO_FORECAST_ID, HERO_NEED_ID, people } from "@/data/seed";
import type { Listing, Transfer } from "./types";

export function forecastReservation(opts: {
  id: string;
  forecastId: string;
  fromSiteId: string;
  toSiteId: string;
  materialId: string;
  qty: number;
  needId?: string;
  by: string;
  today: string;
  structural: boolean;
}): Transfer {
  return {
    id: opts.id,
    forecastId: opts.forecastId,
    needId: opts.needId,
    fromSiteId: opts.fromSiteId,
    toSiteId: opts.toSiteId,
    materialId: opts.materialId,
    qty: opts.qty,
    status: "Matched",
    requiresApproval: opts.structural,
    createdAt: opts.today,
    history: [{ status: "Forecast reserved", at: opts.today, by: opts.by, note: "Held against forecast surplus. Moves to Reserved once the actual surplus is logged." }],
  };
}

export const HERO_TRANSFER_ID = "T-HERO";
export const HERO_LISTING_ID = "L-HERO";

export function heroReservation(today: string, qty = 800): Transfer {
  return forecastReservation({
    id: HERO_TRANSFER_ID,
    forecastId: HERO_FORECAST_ID,
    fromSiteId: "elmina",
    toSiteId: "bbr",
    materialId: "tile-porcelain",
    qty,
    needId: HERO_NEED_ID,
    by: people.procurement.name,
    today,
    structural: false,
  });
}

export function heroListing(today: string, qty: number): Listing {
  return {
    id: HERO_LISTING_ID,
    siteId: "elmina",
    phaseId: "elm-p3",
    materialId: "tile-porcelain",
    qty,
    condition: "new",
    availableFrom: today,
    loggedAt: today,
    loggedBy: people.engineer.name,
    status: "available",
    sampleId: "tiles",
    forecastId: HERO_FORECAST_ID,
    aiEstimated: true,
    notes: "Boxed porcelain tiles left after Phase 3 handover. Quantity estimated from photo, then counted.",
  };
}
