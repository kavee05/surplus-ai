"use client";

import { HERO_INPUT, seedState } from "@/data/initial";
import { HERO_FORECAST_ID } from "@/data/seed";
import { computeForecasts } from "@/lib/engine/forecast";
import { siteDistanceKm } from "@/lib/engine/geo";
import { preOrderCheck } from "@/lib/engine/preorder";
import { fmtNum, fmtRm } from "@/lib/format";
import { CountUp } from "./count-up";

// Same seed data and engine as the app, so these numbers always match it.
const state = seedState();
const forecasts = computeForecasts(state);
const result = preOrderCheck(state, { ...HERO_INPUT });
const hero = forecasts.find((f) => f.id === HERO_FORECAST_ID)!;
const km = siteDistanceKm(state.sites, "elmina", "bbr");
const ROUTE = "M 75 58 C 150 18, 290 18, 365 58";

export function HeroVisual() {
  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#1E293B] p-5 sm:p-6 shadow-none">
        {/* Simple Clean Header with Small Pill */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h3 className="text-base font-bold text-white sm:text-lg">Porcelain Floor Tiles</h3>
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
            Forecast match
          </span>
        </div>

        {/* SVG Route Arc - ~30% shorter with 12.8 km pill at top */}
        <div className="relative mt-2">
          <svg
            viewBox="0 0 440 105"
            className="w-full"
            role="img"
            aria-label={`Tiles moving ${fmtNum(km, 1)} km from City of Elmina to Bandar Bukit Raja`}
          >
            <defs>
              <filter id="hero-glow-green" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="hero-glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Subtle background track */}
            <path
              d={ROUTE}
              fill="none"
              stroke="#334155"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              opacity="0.4"
            />

            {/* Emerald animated route */}
            <path
              className="l-flow"
              d={ROUTE}
              fill="none"
              stroke="#34D399"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* 12.8 km Label at apex of the arc */}
            <g transform="translate(220, 15)">
              <rect
                x="-26"
                y="-10"
                width="52"
                height="19"
                rx="9.5"
                fill="#0F172A"
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x="0"
                y="0"
                dominantBaseline="central"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="600"
                fill="#34D399"
              >
                12.8 km
              </text>
            </g>

            {/* Source Node: Elmina (Solid Green Dot + Soft Glow) */}
            <circle cx="75" cy="58" r="14" fill="#34D399" opacity="0.25" />
            <circle cx="75" cy="58" r="8.5" fill="#34D399" filter="url(#hero-glow-green)" />

            {/* Destination Node: BBR (Solid Light Blue Dot + Soft Glow) */}
            <circle cx="365" cy="58" r="14" fill="#38BDF8" opacity="0.25" />
            <circle cx="365" cy="58" r="8.5" fill="#38BDF8" filter="url(#hero-glow-blue)" />

            {/* City labels on the EXACT same line (y = 80) */}
            <text x="75" y="80" textAnchor="middle" fontSize="12" fontWeight="700" fill="#F8FAFC">
              City of Elmina
            </text>
            <text x="365" y="80" textAnchor="middle" fontSize="12" fontWeight="700" fill="#F8FAFC">
              Bandar Bukit Raja
            </text>

            {/* Sub-labels on the EXACT same line (y = 94) */}
            <text x="75" y="94" textAnchor="middle" fontSize="11" fill="#94A3B8" fontWeight="500">
              {fmtNum(hero.qty)} spare
            </text>
            <text x="365" y="94" textAnchor="middle" fontSize="11" fill="#94A3B8" fontWeight="500">
              Needs {fmtNum(HERO_INPUT.qty)}
            </text>
          </svg>
        </div>

        {/* 800 and 200 Stat Boxes: Dark boxes with thin border, uppercase labels above */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-700/80 bg-[#0F172A] p-3.5 text-center">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Reserve
            </span>
            <div className="mt-1 text-3xl font-bold tracking-tight text-[#34D399] tabular-nums">
              <CountUp to={result.reservedForecast} />
            </div>
            <span className="mt-0.5 block text-xs text-slate-400">From Elmina</span>
          </div>

          <div className="rounded-xl border border-slate-700/80 bg-[#0F172A] p-3.5 text-center">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Order Now
            </span>
            <div className="mt-1 text-3xl font-bold tracking-tight text-white tabular-nums">
              <CountUp to={result.orderNow} />
            </div>
            <span className="mt-0.5 block text-xs text-slate-400">
              Down from {fmtNum(HERO_INPUT.qty)}
            </span>
          </div>
        </div>

        {/* Savings Row: No beige background, RM 11,098 bigger and green, deadline underneath */}
        <div className="mt-3.5 rounded-xl border border-slate-700/80 bg-[#0F172A]/70 p-3.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-300">Estimated saving</span>
            <span className="text-xl sm:text-2xl font-extrabold text-[#34D399] tabular-nums">
              {fmtRm(result.expected.savedRm)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-700/60 pt-2 text-xs text-slate-400">
            <span>Decision deadline</span>
            <span className="font-semibold text-slate-200">24 Nov 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
