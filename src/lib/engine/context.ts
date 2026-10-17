import type { AssumptionsState } from "../assumptions";
import type { ForecastOutcome, Listing, Material, Need, Phase, PurchasePlan, Site, Transfer } from "../types";

/** Everything the deterministic engine reads. No hidden inputs. */
export interface EngineData {
  today: string;
  sites: Site[];
  phases: Phase[];
  materials: Material[];
  plans: PurchasePlan[];
  listings: Listing[];
  needs: Need[];
  transfers: Transfer[];
  outcomes: ForecastOutcome[];
  assumptions: AssumptionsState;
}

export function materialById(data: Pick<EngineData, "materials">, id: string): Material {
  const m = data.materials.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown material ${id}`);
  return m;
}

export function siteName(data: Pick<EngineData, "sites">, id: string): string {
  return data.sites.find((s) => s.id === id)?.township ?? id;
}
