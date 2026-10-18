"use client";

import { ArrowLeft, ArrowRight, Check, PlayCircle, Sparkles, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HERO_INPUT } from "@/data/initial";
import { HERO_ACTUAL_QTY } from "@/data/seed";
import { heroListing, heroReservation, HERO_LISTING_ID, HERO_TRANSFER_ID } from "@/lib/actions";
import { makeDecision } from "@/lib/decisions";
import { preOrderCheck } from "@/lib/engine/preorder";
import { explainPreOrder } from "@/lib/explain/builders";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  body: string;
  route: string;
  role: Role;
  target?: string;
  /** Optional shortcut for the step's action, so the demo never gets stuck. */
  action?: { label: string; run: (ctx: DemoCtx) => void; done: (ctx: DemoCtx) => boolean };
}

type DemoCtx = ReturnType<typeof useStore>;

const STEPS: Step[] = [
  {
    title: "A buyer is about to order 1,000 tiles",
    body: "Daniel Wong buys for Bandar Bukit Raja. Phase 2B starts on 7 Dec, five weeks away, and needs 1,000 porcelain floor tiles. Before ordering, he runs a Pre-Order Check.",
    route: "/app/radar",
    role: "procurement",
    target: "preorder-form",
  },
  {
    title: "Radar spots leftovers before they exist",
    body: "City of Elmina ordered 5,000 tiles but only needs about 4,200. When it finishes on 23 Nov, about 800 tiles will be left. The phase is 62% done, so this is a fair guess, not a certainty. Nobody has recorded them yet.",
    route: "/app/radar",
    role: "procurement",
    target: "radar-timeline",
  },
  {
    title: "Reserve 800, order only 200",
    body: "The advice: reserve 800 of Elmina's expected tiles and buy only 200 new. Confirm by 24 Nov, or buy the rest then. Open “Why this recommendation” to see how it was worked out. Conservative mode plays it safer: reserve 560, buy 440.",
    route: "/app/radar",
    role: "procurement",
    target: "preorder-result",
  },
  {
    title: "Reserve the expected tiles",
    body: "Daniel reserves the 800 tiles. Elmina now knows someone wants them, so they will not be thrown away.",
    route: "/app/radar",
    role: "procurement",
    target: "reserve-button",
    action: {
      label: "Reserve 800 tiles",
      run: ({ state, dispatch, person }) => {
        dispatch({ type: "createTransfer", transfer: heroReservation(state.today) });
        const e = explainPreOrder(preOrderCheck(state, { ...HERO_INPUT }), state);
        dispatch({
          type: "logDecision",
          decision: makeDecision({ e, kind: "preorder", outcome: "accepted", subjectId: "bbr:bbr-2b:tile-porcelain", subjectLabel: "Pre-Order Check, Porcelain floor tile 600 x 600", by: person.name, role: state.role, today: state.today, detail: "Held 800 pcs.", href: "/app/transfers" }),
        });
      },
      done: ({ state }) => state.transfers.some((t) => t.id === HERO_TRANSFER_ID),
    },
  },
  {
    title: "Three weeks later at City of Elmina",
    body: "It is now 23 Nov. Elmina's phase is finished and Aina, the site engineer, has boxes of tiles left. She takes a photo; the AI suggests what it is and roughly how many, and she checks and confirms.",
    route: "/app/surplus/log",
    role: "engineer",
    target: "log-form",
    action: {
      label: "Move the clock to 23 Nov",
      run: ({ dispatch }) => dispatch({ type: "advanceClock" }),
      done: ({ state }) => state.today >= "2026-11-23",
    },
  },
  {
    title: "The forecast turns Confirmed",
    body: `Aina records ${HERO_ACTUAL_QTY.toLocaleString("en-MY")} tiles. That is close to the 800 expected, so the forecast is marked Confirmed and Daniel's reservation is now firm.`,
    route: "/app/surplus/log",
    role: "engineer",
    target: "log-form",
    action: {
      label: `Log ${HERO_ACTUAL_QTY} tiles for me`,
      run: ({ state, dispatch }) => {
        if (state.today < "2026-11-23") dispatch({ type: "advanceClock" });
        dispatch({ type: "addListing", listing: heroListing("2026-11-23", HERO_ACTUAL_QTY) });
      },
      done: ({ state }) => state.listings.some((l) => l.id === HERO_LISTING_ID),
    },
  },
  {
    title: "Collect and complete the transfer",
    body: "The tiles travel about 13 km from Elmina to Bandar Bukit Raja. Every step is recorded: Matched, Reserved, Collected, Completed.",
    route: "/app/transfers",
    role: "procurement",
    target: "hero-transfer",
    action: {
      label: "Collect and complete",
      run: ({ state, dispatch, person }) => {
        let t = state.transfers.find((x) => x.id === HERO_TRANSFER_ID);
        if (!t) {
          dispatch({ type: "createTransfer", transfer: heroReservation(state.today) });
        }
        if (!state.listings.some((l) => l.id === HERO_LISTING_ID)) {
          if (state.today < "2026-11-23") dispatch({ type: "advanceClock" });
          dispatch({ type: "addListing", listing: heroListing("2026-11-23", HERO_ACTUAL_QTY) });
        }
        t = state.transfers.find((x) => x.id === HERO_TRANSFER_ID);
        const steps = t?.status === "Collected" ? 1 : 2;
        for (let i = 0; i < steps; i++) dispatch({ type: "advanceTransfer", id: HERO_TRANSFER_ID, by: person.name });
      },
      done: ({ state }) => state.transfers.find((x) => x.id === HERO_TRANSFER_ID)?.status === "Completed",
    },
  },
  {
    title: "Management sees the result",
    body: "The dashboard now counts the tiles: money saved, tonnes kept out of landfill, a rough carbon estimate, and one more correct forecast. All figures are simulated.",
    route: "/app/impact",
    role: "management",
    target: "impact-kpis",
  },
];

interface DemoApi {
  active: boolean;
  step: number;
  start: () => void;
  exit: () => void;
}

const DemoContext = createContext<DemoApi | null>(null);
const KEY = "surplus-ai:demo";

export function useDemo(): DemoApi {
  const c = useContext(DemoContext);
  if (!c) throw new Error("useDemo must be used inside GuidedDemoProvider");
  return c;
}

function AutoStart({ onStart }: { onStart: () => void }) {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("demo") === "start") onStart();
  }, [params, onStart]);
  return null;
}

export function GuidedDemoProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const { dispatch, ready } = store;
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState(-1);

  useEffect(() => {
    try {
      const s = Number(sessionStorage.getItem(KEY) ?? "-1");
      if (s >= 0 && s < STEPS.length) setStep(s);
    } catch {}
  }, []);

  const go = useCallback(
    (i: number) => {
      setStep(i);
      try {
        sessionStorage.setItem(KEY, String(i));
      } catch {}
      if (i >= 0) {
        dispatch({ type: "setRole", role: STEPS[i].role });
        router.push(STEPS[i].route);
      }
    },
    [dispatch, router],
  );

  const start = useCallback(() => {
    dispatch({ type: "reset" });
    go(0);
    toast.success("Demo data reset. Guided demo started.");
  }, [dispatch, go]);

  const exit = useCallback(() => {
    setStep(-1);
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
    router.replace(pathname);
  }, [router, pathname]);

  // Highlight the element this step is about.
  const target = step >= 0 ? STEPS[step].target : undefined;
  useEffect(() => {
    if (!target) return;
    let el: Element | null = null;
    const t = window.setTimeout(() => {
      el = document.querySelector(`[data-demo="${target}"]`);
      if (el) {
        el.classList.add("demo-highlight");
        el.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    }, 350);
    return () => {
      window.clearTimeout(t);
      el?.classList.remove("demo-highlight");
    };
  }, [target, pathname, step]);

  const api = useMemo(() => ({ active: step >= 0, step, start, exit }), [step, start, exit]);

  return (
    <DemoContext.Provider value={api}>
      {children}
      <Suspense fallback={null}>{ready && <AutoStart onStart={start} />}</Suspense>
      {step >= 0 && <DemoPanel step={step} go={go} exit={exit} store={store} />}
    </DemoContext.Provider>
  );
}

function DemoPanel({ step, go, exit, store }: { step: number; go: (i: number) => void; exit: () => void; store: DemoCtx }) {
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const actionDone = s.action ? s.action.done(store) : true;
  return (
    <div
      role="dialog"
      aria-label="Guided demo"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border bg-card p-4 shadow-overlay sm:inset-x-auto sm:right-6 sm:w-[380px] md:bottom-6"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
          <PlayCircle className="size-3.5" aria-hidden />
          Guided demo, step {step + 1} of {STEPS.length}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={exit} aria-label="Exit guided demo">
          <X />
        </Button>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {STEPS.map((_, i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-brand" : "bg-muted")} />
        ))}
      </div>
      <h2 className="mt-3 font-semibold text-balance">{s.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">{s.body}</p>
      {s.action && (
        <Button
          variant={actionDone ? "secondary" : "outline"}
          className="mt-3 w-full"
          disabled={actionDone}
          onClick={() => {
            s.action!.run(store);
            toast.success(`${s.action!.label}: done`);
          }}
        >
          {actionDone ? <Check /> : <Sparkles />}
          {actionDone ? "Done" : s.action.label}
        </Button>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => go(step - 1)} disabled={step === 0}>
          <ArrowLeft /> Back
        </Button>
        {last ? (
          <Button size="sm" onClick={exit}>
            Finish
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              if (s.action && !s.action.done(store)) s.action.run(store);
              go(step + 1);
            }}
          >
            Next <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
