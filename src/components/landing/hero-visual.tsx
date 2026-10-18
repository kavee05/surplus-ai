import { SimulatedBadge } from "@/components/app/simulated-badge";
import { NetworkLegend, SurplusNetwork } from "@/components/network/surplus-network";
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
    <figure className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <figcaption className="text-sm font-medium">Surplus Network, 2 Nov 2026</figcaption>
        <SimulatedBadge />
      </div>
      <SurplusNetwork
        data={state}
        forecasts={forecasts}
        suggestion={{ fromSiteId: "elmina", toSiteId: "bbr", label: `${fmtNum(result.reservedForecast)} tiles` }}
        highlightSiteIds={["elmina", "bbr"]}
        title="Surplus Network: City of Elmina is forecast to have tiles spare when Bandar Bukit Raja needs them"
      />
      <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
        City of Elmina Phase 3 should finish on {fmtDate(hero.availableFrom)} with about {fmtNum(hero.qty)} tiles spare. Bandar Bukit Raja needs {fmtNum(HERO_INPUT.qty)} by{" "}
        {fmtDate(HERO_INPUT.neededBy)}.
      </p>
      <dl className="grid grid-cols-3 border-t text-sm">
        <div className="flex flex-col gap-0.5 border-r bg-forecast-soft/70 px-4 py-3">
          <dt className="text-xs text-forecast-ink">Reserve</dt>
          <dd className="tabular text-2xl font-semibold">{fmtNum(result.reservedForecast)}</dd>
        </div>
        <div className="flex flex-col gap-0.5 border-r px-4 py-3">
          <dt className="text-xs text-muted-foreground">Order now</dt>
          <dd className="tabular text-2xl font-semibold">{fmtNum(result.orderNow)}</dd>
        </div>
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <dt className="text-xs text-muted-foreground">Confirm by</dt>
          <dd className="tabular text-lg font-semibold sm:text-2xl">{fmtDate(result.decisionDate).replace(/ \d{4}$/, "")}</dd>
        </div>
      </dl>
      <NetworkLegend className="border-t px-4 py-2.5" />
    </figure>
  );
}
