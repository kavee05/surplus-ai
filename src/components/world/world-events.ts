import type { WorldSelection } from "@/lib/engine/world";

/**
 * Lets the guided tour point at something in Surplus World without importing
 * the world code into every page: it sends an event, the world listens.
 */
export const WORLD_SELECT = "surplus-ai:world-select";

export function selectInWorld(sel: WorldSelection | null) {
  window.dispatchEvent(new CustomEvent<WorldSelection | null>(WORLD_SELECT, { detail: sel }));
}
