import { ExternalLink } from "lucide-react";
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
      <PageHeader
        title="Evidence and assumptions"
        description="What we know, where it comes from, and its limits. Sources are paraphrased. The app's operational data is simulated; the figures on this page are from the cited sources."
      />

      <section aria-labelledby="limits-h" className="mb-8 border-l-2 border-warning pl-4">
        <h2 id="limits-h" className="text-sm font-semibold text-warning">
          Limits to keep in mind
        </h2>
        <ul className="mt-2 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
          {evidenceLimits.map((l) => (
            <li key={l} className="text-pretty">
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sources-h">
        <div className="flex items-baseline justify-between gap-4 border-b pb-2">
          <h2 id="sources-h" className="font-semibold">
            Sources
          </h2>
          <span className="tabular text-xs text-muted-foreground">{evidence.length} sources</span>
        </div>
        <ol className="divide-y border-b">
          {evidence.map((e) => (
            <li key={e.id} className="grid gap-x-8 gap-y-3 py-5 lg:grid-cols-[13rem_1fr_minmax(0,18rem)]">
              <div className="flex flex-col gap-1">
                <span className="tabular text-2xl leading-tight font-semibold tracking-tight">{e.figure}</span>
                <span className="text-xs text-muted-foreground">{e.figureLabel}</span>
              </div>
              <div className="flex min-w-0 flex-col gap-1.5 text-sm">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{e.who}</span>
                  <span className="text-xs text-muted-foreground">{e.kind}</span>
                </p>
                <p className="text-pretty">{e.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {e.source}
                  {e.url && (
                    <>
                      {" "}
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-brand underline underline-offset-2 hover:no-underline">
                        Open <ExternalLink className="size-3" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </>
                  )}
                </p>
              </div>
              <p className="border-l-2 border-forecast pl-3 text-sm text-muted-foreground text-pretty">
                <span className="block text-xs font-semibold text-forecast-ink">Limit</span>
                {e.limits}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="diff-h">
          <h2 id="diff-h" className="border-b pb-2 font-semibold">
            Differentiation and its limits
          </h2>
          <p className="mt-3 text-sm">{differentiation.intro}</p>
          <ul className="mt-2 flex flex-col divide-y text-sm">
            {differentiation.points.map((p) => (
              <li key={p} className="py-2 text-pretty">
                {p}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="assume-h">
          <h2 id="assume-h" className="border-b pb-2 font-semibold">
            Assumptions in the model
          </h2>
          <p className="mt-3 text-sm">
            Every cost, weight, carbon factor, lead time, wastage allowance, haul distance and scoring weight is an assumption, tagged with the source we would use to confirm it. They are listed and editable on the{" "}
            <Link href="/app/settings" className="font-medium text-brand underline underline-offset-2 hover:no-underline">
              Assumptions page
            </Link>
            .
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Township coordinates are approximate centres, used only for straight-line distance (haversine). Carbon figures are illustrative.</p>
        </section>
      </div>
    </>
  );
}
