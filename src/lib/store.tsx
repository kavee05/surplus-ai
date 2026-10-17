"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { seedState, STATE_VERSION, type AppState } from "@/data/initial";
import { DEMO_LATER, HERO_FORECAST_ID, people } from "@/data/seed";
import { defaultAssumptions, type GlobalAssumptionKey } from "./assumptions";
import { computeForecasts, recordActual } from "./engine/forecast";
import { nextStatus } from "./engine/transfers";
import type { Listing, MaterialValues, Need, OwnershipPolicy, Role, Transfer, TransferEvent } from "./types";

const STORAGE_KEY = "surplus-ai:state";

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "reset" }
  | { type: "setRole"; role: Role }
  | { type: "setOwnership"; ownership: OwnershipPolicy }
  | { type: "setGlobal"; key: GlobalAssumptionKey; value: number }
  | { type: "setMaterial"; id: string; field: keyof MaterialValues; value: number }
  | { type: "resetAssumptions" }
  | { type: "addListing"; listing: Listing }
  | { type: "addNeed"; need: Need }
  | { type: "createTransfer"; transfer: Transfer }
  | { type: "advanceTransfer"; id: string; by: string }
  | { type: "approveTransfer"; id: string; by: string }
  | { type: "offerCommunity"; listingId: string; projectId: string }
  | { type: "advanceClock" };

function event(status: TransferEvent["status"], at: string, by: string, note?: string): TransferEvent {
  return { status, at, by, note };
}

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "hydrate":
      return a.state;
    case "reset":
      return { ...seedState(), role: s.role };
    case "setRole":
      return { ...s, role: a.role };
    case "setOwnership":
      return { ...s, ownership: a.ownership };
    case "setGlobal":
      return { ...s, assumptions: { ...s.assumptions, global: { ...s.assumptions.global, [a.key]: a.value } } };
    case "setMaterial":
      return {
        ...s,
        assumptions: {
          ...s.assumptions,
          materials: { ...s.assumptions.materials, [a.id]: { ...s.assumptions.materials[a.id], [a.field]: a.value } },
        },
      };
    case "resetAssumptions":
      return { ...s, assumptions: defaultAssumptions() };
    case "addListing": {
      const listing = { ...a.listing };
      let { outcomes, transfers, phases } = s;
      if (listing.forecastId) {
        const forecast = computeForecasts(s).find((f) => f.id === listing.forecastId);
        if (forecast) {
          const outcome = recordActual(forecast, listing.qty, s.today, s.assumptions.global.confirmTolerancePct);
          outcomes = [...outcomes.filter((o) => o.forecastId !== forecast.id), outcome];
          phases = phases.map((p) => (p.id === forecast.phaseId ? { ...p, progressPct: 100, status: "completed" } : p));
          // Forecast reservations now point at real surplus and can move on to Reserved.
          let held = 0;
          transfers = transfers.map((t) => {
            if (t.forecastId !== forecast.id || t.listingId || t.status === "Cancelled") return t;
            const qty = Math.min(t.qty, Math.max(0, listing.qty - held));
            held += qty;
            const next: Transfer = { ...t, qty, listingId: listing.id };
            const ns = nextStatus(next);
            return {
              ...next,
              status: ns ?? t.status,
              history: [
                ...t.history,
                event("Forecast confirmed", s.today, listing.loggedBy, `${outcome.status}: ${listing.qty} logged against ${forecast.qty} forecast.`),
                ...(ns ? [event(ns, s.today, "System")] : []),
              ],
            };
          });
          if (held >= listing.qty) listing.status = "reserved";
        }
      }
      return { ...s, listings: [listing, ...s.listings], outcomes, transfers, phases };
    }
    case "addNeed":
      return { ...s, needs: [a.need, ...s.needs] };
    case "createTransfer": {
      const t = a.transfer;
      return {
        ...s,
        transfers: [t, ...s.transfers],
        listings: t.listingId ? s.listings.map((l) => (l.id === t.listingId ? { ...l, status: "reserved" } : l)) : s.listings,
        needs: t.needId ? s.needs.map((n) => (n.id === t.needId ? { ...n, status: "matched" } : n)) : s.needs,
      };
    }
    case "approveTransfer":
      return {
        ...s,
        transfers: s.transfers.map((t) =>
          t.id === a.id && t.status === "Awaiting approval"
            ? { ...t, approvedBy: a.by, status: "Reserved", history: [...t.history, event("Approved", s.today, a.by), event("Reserved", s.today, a.by)] }
            : t,
        ),
      };
    case "advanceTransfer": {
      const t = s.transfers.find((x) => x.id === a.id);
      if (!t) return s;
      const ns = nextStatus(t);
      if (!ns) return s;
      const updated: Transfer = {
        ...t,
        status: ns,
        completedAt: ns === "Completed" ? s.today : t.completedAt,
        history: [...t.history, event(ns, s.today, a.by)],
      };
      return {
        ...s,
        transfers: s.transfers.map((x) => (x.id === a.id ? updated : x)),
        listings: ns === "Completed" && t.listingId ? s.listings.map((l) => (l.id === t.listingId ? { ...l, status: "transferred" } : l)) : s.listings,
        needs: ns === "Completed" && t.needId ? s.needs.map((n) => (n.id === t.needId ? { ...n, status: "fulfilled" } : n)) : s.needs,
      };
    }
    case "offerCommunity":
      return {
        ...s,
        communityOffers: [...s.communityOffers, { listingId: a.listingId, projectId: a.projectId, at: s.today }],
        listings: s.listings.map((l) => (l.id === a.listingId ? { ...l, status: "community" } : l)),
      };
    case "advanceClock":
      return {
        ...s,
        today: DEMO_LATER,
        phases: s.phases.map((p) => (p.id === "elm-p3" ? { ...p, progressPct: 100 } : p)),
      };
  }
}

interface Store {
  state: AppState;
  ready: boolean;
  dispatch: React.Dispatch<Action>;
  person: (typeof people)[Role];
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seedState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed.version === STATE_VERSION) dispatch({ type: "hydrate", state: parsed });
      }
    } catch {
      // Storage unavailable or corrupt: keep seed data.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota or privacy-mode errors.
    }
  }, [state, ready]);

  const value = useMemo(() => ({ state, ready, dispatch, person: people[state.role] }), [state, ready]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}

export function useForecasts() {
  const { state } = useStore();
  return useMemo(() => computeForecasts(state), [state]);
}

let counter = 0;
export function useNewId() {
  return useCallback((prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`, []);
}

export { HERO_FORECAST_ID };
