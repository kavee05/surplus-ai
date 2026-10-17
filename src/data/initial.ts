import { defaultAssumptions } from "@/lib/assumptions";
import type { EngineData } from "@/lib/engine/context";
import type { DecisionRecord, DismissedMatch, OwnershipPolicy, Role } from "@/lib/types";
import * as seed from "./seed";

export interface AppState extends EngineData {
  version: number;
  role: Role;
  ownership: OwnershipPolicy;
  communityOffers: { listingId: string; projectId: string; at: string }[];
  decisions: DecisionRecord[];
  dismissedMatches: DismissedMatch[];
}

export const STATE_VERSION = 2;

/** A fresh copy of the simulated seed data. */
export function seedState(): AppState {
  return structuredClone({
    version: STATE_VERSION,
    today: seed.DEMO_TODAY,
    sites: seed.sites,
    phases: seed.phases,
    materials: seed.materials,
    plans: seed.purchasePlans,
    listings: seed.listings,
    needs: seed.needs,
    transfers: seed.transfers,
    outcomes: seed.forecastHistory,
    assumptions: defaultAssumptions(),
    role: "procurement" as Role,
    ownership: "shared" as OwnershipPolicy,
    communityOffers: [],
    decisions: seed.decisionHistory,
    dismissedMatches: seed.dismissedMatches,
  });
}

export const HERO_INPUT = {
  siteId: "bbr",
  phaseId: "bbr-2b",
  materialId: "tile-porcelain",
  qty: 1000,
  neededBy: "2026-12-07",
} as const;
