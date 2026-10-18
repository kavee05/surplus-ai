import { HERO_INPUT, seedState } from "@/data/initial";
import { HERO_FORECAST_ID } from "@/data/seed";
import { computeForecasts } from "@/lib/engine/forecast";
import { siteDistanceKm } from "@/lib/engine/geo";
import { preOrderCheck } from "@/lib/engine/preorder";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { CountUp } from "./count-up";

// Same seed data and engine as the app, so these numbers always match it.
const state = seedState();
const forecasts = computeForecasts(state);
const result = preOrderCheck(state, { ...HERO_INPUT });
const hero = forecasts.find((f) => f.id === HERO_FORECAST_ID)!;
const km = siteDistanceKm(state.sites, "elmina", "bbr");
const ROUTE = "M70 140 C 150 20, 290 20, 370 120";

export function HeroVisual() {
  return (
    <figure className="l-float relative rounded-3xl bg-white p-5 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.25),0_0_0_1px_rgba(15,23,42,0.05)] sm:p-6">
      <figcaption className="flex items-center justify-between gap-2 text-[15px] font-bold text-slate-900">
        Porcelain floor tiles
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">Forecast · simulated</span>
      </figcaption>

      <svg viewBox="0 0 440 196" className="mt-1 h-auto w-full text-slate-900" role="img" aria-label={`Tiles moving about ${fmtNum(km, 1)} km from City of Elmina to Bandar Bukit Raja`}>
        <path className="l-draw" d={ROUTE} fill="none" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
        <path className="l-flow" d={ROUTE} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        <circle className="l-pulse" cx="70" cy="140" r="9" fill="#10b981" />
        <circle cx="70" cy="140" r="9" fill="#10b981" />
        <circle cx="370" cy="120" r="9" fill="#0284c7" />
        <text x="70" y="172" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">City of Elmina</text>
        <text x="70" y="190" textAnchor="middle" fontSize="13" fill="#64748b">{fmtNum(hero.qty)} spare from {fmtDate(hero.availableFrom).replace(/ \d{4}$/, "")}</text>
        <text x="362" y="152" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">Bandar Bukit Raja</text>
        <text x="362" y="171" textAnchor="middle" fontSize="13" fill="#64748b">needs {fmtNum(HERO_INPUT.qty)} by {fmtDate(HERO_INPUT.neededBy).replace(/ \d{4}$/, "")}</text>
        <text x="220" y="34" textAnchor="middle" fontSize="15" fontWeight="800" fill="#059669" paintOrder="stroke" stroke="#fff" strokeWidth="5">{fmtNum(km, 1)} km</text>
      </svg>

      <dl className="mt-3 grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-900 sm:p-3.5">
          <dt className="text-xs font-semibold opacity-80">Reserve</dt>
          <dd className="mt-1 text-[1.75rem] leading-none font-extrabold tracking-tight tabular-nums sm:text-3xl">
            <CountUp to={result.reservedForecast} />
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5">
          <dt className="text-xs font-semibold text-slate-500">Order now</dt>
          <dd className="mt-1 text-[1.75rem] leading-none font-extrabold tracking-tight tabular-nums sm:text-3xl">
            <CountUp to={result.orderNow} />
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5">
          <dt className="text-xs font-semibold text-slate-500">Confirm by</dt>
          <dd className="mt-1 text-xl leading-tight font-extrabold tracking-tight sm:text-2xl">{fmtDate(result.decisionDate).replace(/ \d{4}$/, "")}</dd>
        </div>
      </dl>
      <p className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
        <span>Estimated saving</span>
        <span className="tabular-nums">
          {fmtRm(result.expected.savedRm)} · {fmtNum(result.expected.tonnes, 1)} t reused
        </span>
      </p>
    </figure>
  );
}
