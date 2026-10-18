import { ArrowUpRight, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { differentiation, evidence, evidenceLimits } from "@/data/evidence";

export const metadata: Metadata = {
  title: "Evidence and assumptions",
  description: "The public evidence behind Surplus AI, what each source can and cannot tell us, and how Radar differs from existing surplus exchanges.",
};

export default function EvidencePage() {
  return (
    <>
      <PageHeader title="Evidence and assumptions" description="What we know, where it comes from, and its limits. The figures here are from cited public sources; the app's own data is simulated." />

      <section aria-labelledby="limits-h" className="mb-8 rounded-2xl bg-amber-50 p-5 sm:p-6">
        <h2 id="limits-h" className="flex items-center gap-2 font-bold text-amber-900">
          <TriangleAlert className="size-5" aria-hidden /> Limits to keep in mind
        </h2>
        <ul className="mt-3 grid gap-x-8 gap-y-2 text-[15px] text-amber-950 sm:grid-cols-2">
          {evidenceLimits.map((l) => (
            <li key={l} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
              {l}
            </li>
          ))}
        </ul>
      </section>

      <h2 className="mb-4 text-lg font-bold">Sources</h2>
      <ul className="grid gap-4 lg:grid-cols-2">
        {evidence.map((e) => (
          <li key={e.id} className="flex flex-col rounded-2xl bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">{e.who}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{e.kind}</span>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight">{e.figure}</p>
            <p className="mt-1 text-[15px] text-slate-600">{e.figureLabel}</p>
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <span className="font-bold">Limit: </span>
              {e.limits}
            </p>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">
              {e.source}
              {e.url && (
                <>
                  {" "}
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-brand hover:underline">
                    Open source <ArrowUpRight className="size-3" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="diff-h" className="rounded-2xl bg-card p-6 shadow-card">
          <h2 id="diff-h" className="text-lg font-bold">
            How Radar differs, and its limits
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">{differentiation.intro}</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-[15px]">
            {differentiation.points.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="assume-h" className="rounded-2xl bg-card p-6 shadow-card">
          <h2 id="assume-h" className="text-lg font-bold">
            Assumptions in the model
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Every cost, weight, carbon factor, lead time, wastage allowance, haul distance and scoring weight is an assumption with a source still to confirm. You can see and change them all.
          </p>
          <p className="mt-2 text-[15px] text-slate-600">Township locations are approximate, used only for straight-line distance. Carbon figures are illustrative.</p>
          <Link href="/app/settings" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            Open the Assumptions page <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </section>
      </div>
    </>
  );
}
