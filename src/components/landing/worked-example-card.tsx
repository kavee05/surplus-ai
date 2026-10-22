"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";

interface WorkedExampleProps {
  plan: {
    orderedQty: number;
    plannedQty: number;
  };
  wastageAllowance: number;
  hero: {
    qty: number;
    availableFrom: string;
  };
  heroInput: {
    qty: number;
    neededBy: string;
  };
  r: {
    reservedForecast: number;
    orderNow: number;
    decisionDate: string;
    expected: {
      savedRm: number;
      tonnes: number;
    };
  };
}

export function WorkedExampleCard({
  plan,
  wastageAllowance,
  hero,
  heroInput,
  r,
}: WorkedExampleProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-6 text-slate-900 shadow-md shadow-slate-200/40">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Live Worked Scenario</span>
          <h3 className="text-lg font-extrabold text-slate-900">Tile Procurement Match</h3>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
          Simulated Data
        </span>
      </div>

      {/* High-Impact Number Highlights */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Surplus Intercepted</span>
          <p className="mt-0.5 text-2xl font-black tracking-tight text-emerald-700 sm:text-3xl tabular-nums">
            {fmtNum(r.reservedForecast)}
          </p>
          <span className="text-[10px] font-semibold text-emerald-800">Tiles Reserved</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Order Reduced To</span>
          <p className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl tabular-nums">
            {fmtNum(r.orderNow)}
          </p>
          <span className="text-[10px] font-semibold text-slate-600">From Original {fmtNum(heroInput.qty)}</span>
        </div>
      </div>

      {/* Main Savings Banner */}
      <div className="mt-3 rounded-xl bg-slate-900 p-3.5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Total Capital Saved</span>
            <p className="text-2xl font-black tracking-tight text-white tabular-nums sm:text-3xl">
              {fmtRm(r.expected.savedRm)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Landfill Diverted</span>
            <p className="text-xl font-black tracking-tight text-white tabular-nums sm:text-2xl">
              {fmtNum(r.expected.tonnes, 1)} tonnes
            </p>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-slate-300 font-medium">
          Decision deadline: <span className="font-bold text-white underline">{fmtDate(r.decisionDate)}</span> before supplier order
        </p>
      </div>

      {/* Progressive Disclosure Toggle */}
      <div className="mt-2.5">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <span className="flex items-center gap-1.5">
            <Calculator className="size-3.5 text-emerald-600" />
            {showDetails ? "Hide audit arithmetic" : "View transparent math & assumptions"}
          </span>
          {showDetails ? <ChevronUp className="size-4 text-slate-500" /> : <ChevronDown className="size-4 text-slate-500" />}
        </button>

        {showDetails && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition-all animate-in fade-in">
            <dl className="flex flex-col gap-1.5 text-xs">
              {[
                ["City of Elmina ordered", `${fmtNum(plan.orderedQty)} tiles`],
                ["Planned need (with 10% wastage)", `${fmtNum(plan.plannedQty * (1 + wastageAllowance))} tiles`],
                ["Forecast surplus available", `${fmtNum(hero.qty)} tiles from ${fmtDate(hero.availableFrom)}`],
                ["Model confidence", "Moderate (phase 62% complete)"],
                ["Bandar Bukit Raja requirement", `${fmtNum(heroInput.qty)} tiles by ${fmtDate(heroInput.neededBy)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-200/80 pb-1 last:border-0 last:pb-0">
                  <dt className="text-slate-600">{k}</dt>
                  <dd className="font-bold text-slate-900 tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
