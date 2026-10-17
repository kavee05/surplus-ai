import { seedState, STATE_VERSION, type AppState } from "@/data/initial";
import { people } from "@/data/seed";

export const STORAGE_KEY = "surplus-ai:state";

export type LoadStatus = "fresh" | "restored" | "migrated" | "reset";

export interface LoadResult {
  state: AppState;
  status: LoadStatus;
  /** Plain reason when saved data was discarded. */
  reason?: string;
}

const ARRAY_KEYS = ["sites", "phases", "materials", "plans", "listings", "needs", "transfers", "outcomes", "communityOffers", "decisions", "dismissedMatches"] as const;

/** Returns a reason if the saved state cannot be used safely, otherwise null. */
export function invalidReason(s: unknown): string | null {
  if (!s || typeof s !== "object") return "not an object";
  const o = s as Record<string, unknown>;
  for (const k of ARRAY_KEYS) if (!Array.isArray(o[k])) return `${k} is missing`;
  if (typeof o.today !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.today)) return "demo date is invalid";
  if (typeof o.role !== "string" || !(o.role in people)) return "role is unknown";
  const a = o.assumptions as Record<string, unknown> | undefined;
  if (!a || typeof a.global !== "object" || typeof a.materials !== "object" || !a.global || !a.materials) return "assumptions are missing";
  const st = s as AppState;
  if (!st.sites.length || !st.materials.length) return "sites or materials are empty";
  const materialIds = new Set(st.materials.map((m) => m.id));
  const siteIds = new Set(st.sites.map((x) => x.id));
  for (const t of st.transfers) {
    if (!materialIds.has(t.materialId) || !siteIds.has(t.fromSiteId) || !siteIds.has(t.toSiteId)) return "a transfer points at an unknown record";
  }
  for (const m of st.materials) if (!(m.id in st.assumptions.materials)) return "a material has no assumptions";
  return null;
}

/**
 * Older saved versions are upgraded by filling any new top-level fields from the
 * seed. Version 1 had no decision log or dismissed matches.
 */
function migrate(old: Record<string, unknown>): AppState {
  const seed = seedState();
  return { ...seed, ...old, decisions: (old.decisions as AppState["decisions"]) ?? [], dismissedMatches: (old.dismissedMatches as AppState["dismissedMatches"]) ?? [], version: STATE_VERSION };
}

/** Reads saved demo state. Never throws: anything unreadable falls back to the seed. */
export function loadState(raw: string | null): LoadResult {
  if (!raw) return { state: seedState(), status: "fresh" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: seedState(), status: "reset", reason: "the saved data could not be read" };
  }
  const version = (parsed as { version?: unknown } | null)?.version;
  if (typeof version !== "number" || version > STATE_VERSION) {
    return { state: seedState(), status: "reset", reason: "the saved data is from an unknown version" };
  }
  const candidate = version < STATE_VERSION ? migrate(parsed as Record<string, unknown>) : (parsed as AppState);
  const bad = invalidReason(candidate);
  if (bad) return { state: seedState(), status: "reset", reason: `the saved data was incomplete (${bad})` };
  return { state: candidate, status: version < STATE_VERSION ? "migrated" : "restored" };
}
