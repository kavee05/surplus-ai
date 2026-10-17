
import { CalendarClock, Scale, ShoppingCart } from "lucide-react";
import { SimulatedBadge } from "@/components/app/simulated-badge";
import { RadarTimelineStatic } from "@/components/radar/timeline-core";
import { HERO_INPUT, seedState } from "@/data/initial";
import { HERO_FORECAST_ID } from "@/data/seed";
import { computeForecasts } from "@/lib/engine/forecast";
import { preOrderCheck } from "@/lib/engine/preorder";
import { fmtDate, fmtNum } from "@/lib/format";

// Same seed data and engine as the app, so these numbers always match it.
const state = seedState();
const forecasts = computeForecasts(state);
const result = preOrderCheck(state, { ...HERO_INPUT });
const hero = forecasts.find((f) => f.id === HERO_FORECAST_ID)!;


export function HeroVisual() {
  return (
    <figure className="overflow-hidden rounded-2xl border bg-card shadow-raised">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <figcaption className="text-sm font-medium">Surplus Radar: porcelain floor tiles</figcaption>
        <SimulatedBadge />
      </div>
      <div className="p-3 sm:p-4">
        <RadarTimelineStatic data={state} forecasts={forecasts} materialId="tile-porcelain" need={HERO_INPUT} highlightForecastId={HERO_FORECAST_ID} from="2026-10-01" to="2027-02-28" compact className="rounded-lg" />
        <p className="mt-2 text-xs text-muted-foreground">
          City of Elmina Phase 3 should finish on {fmtDate(hero.availableFrom)} with about {fmtNum(hero.qty)} tiles spare ({hero.confidence.toFixed(2)} confidence). The diamond is the
          Bandar Bukit Raja need date.
        </p>
      </div>
      <div className="grid grid-cols-3 border-t text-sm">
        <div className="flex flex-col gap-0.5 border-r bg-forecast-soft/60 p-3 sm:p-4">
          <span className="flex items-center gap-1.5 text-xs text-forecast-ink">
            <Scale className="size-3.5" aria-hidden /> Reserve
          </span>
          <span className="tabular text-xl font-semibold sm:text-2xl">{fmtNum(result.reservedForecast)}</span>
        </div>
        <div className="flex flex-col gap-0.5 border-r p-3 sm:p-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShoppingCart className="size-3.5" aria-hidden /> Order now
          </span>
          <span className="tabular text-xl font-semibold sm:text-2xl">{fmtNum(result.orderNow)}</span>
        </div>
        <div className="flex flex-col gap-0.5 p-3 sm:p-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden /> Confirm by
          </span>
          <span className="text-base font-semibold sm:text-lg">{fmtDate(result.decisionDate).replace(/ \d{4}$/, "")}</span>
        </div>
      </div>
    </figure>
  );
}
