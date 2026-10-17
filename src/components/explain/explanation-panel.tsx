"use client";

import { ArrowUpRight, CheckCircle2, ChevronDown, Clock, Cpu, MinusCircle, OctagonX, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Explanation, ReasonEffect } from "@/lib/explain/types";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CertaintyBadge, certaintyExplainer, certaintyLabel, ProvenanceTag } from "./certainty";

const effectIcon: Record<ReasonEffect, { icon: typeof CheckCircle2; className: string; sr: string }> = {
  supports: { icon: CheckCircle2, className: "text-success", sr: "Supports" },
  weakens: { icon: MinusCircle, className: "text-warning", sr: "Weakens" },
  blocks: { icon: OctagonX, className: "text-danger", sr: "Blocks until resolved" },
};

/**
 * The one explanation pattern used for every recommendation in the product.
 * Most important first (what, why, how sure), details on demand.
 */
export function ExplanationPanel({
  e,
  showRecommendation = true,
  defaultOpen = [],
  className,
}: {
  e: Explanation;
  showRecommendation?: boolean;
  defaultOpen?: string[];
  className?: string;
}) {
  const [allReasons, setAllReasons] = useState(false);
  const reasons = allReasons ? e.reasons : e.reasons.slice(0, 4);
  const included = e.alternatives.filter((a) => !a.excludedReason);
  const excluded = e.alternatives.filter((a) => a.excludedReason);

  return (
    <div className={cn("flex flex-col gap-4 text-sm", className)}>
      {showRecommendation && (
        <div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium text-pretty">{e.recommendation}</p>
            <CertaintyBadge level={e.certainty.level} />
          </div>
          <p className="mt-1 text-muted-foreground">{e.outcome}</p>
        </div>
      )}
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Cpu className="mt-px size-3.5 shrink-0" aria-hidden />
        {e.method}
      </p>

      {e.reasons.length > 0 && (
        <section aria-label="Why">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Why</h4>
          <ul className="flex flex-col gap-2">
            {reasons.map((r) => {
              const ic = effectIcon[r.effect];
              return (
                <li key={r.code + r.label} className="flex gap-2.5">
                  <ic.icon className={cn("mt-0.5 size-4 shrink-0", ic.className)} aria-hidden />
                  <span className="min-w-0">
                    <span className="sr-only">{ic.sr}: </span>
                    <span className="font-medium">{r.label}.</span> <span className="text-muted-foreground">{r.detail}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          {e.reasons.length > 4 && (
            <button type="button" onClick={() => setAllReasons((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              <ChevronDown className={cn("size-3.5 transition-transform", allReasons && "rotate-180")} aria-hidden />
              {allReasons ? "Show fewer" : `Show all ${e.reasons.length} factors`}
            </button>
          )}
        </section>
      )}

      <section aria-label="How sure" className="rounded-lg border bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-xs font-medium text-muted-foreground">How sure</h4>
          {!showRecommendation && <CertaintyBadge level={e.certainty.level} />}
        </div>
        <p className="mt-1.5">{e.certainty.basis}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {certaintyLabel(e.certainty.level)} means: {certaintyExplainer(e.certainty.level).toLowerCase()}
        </p>
        {e.certainty.score && <p className="mt-1 text-xs text-muted-foreground">{e.certainty.score.label}</p>}
        {(e.certainty.missing.length > 0 || e.certainty.couldChange.length > 0) && (
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
            {e.certainty.missing.length > 0 && (
              <div>
                <p className="text-xs font-medium">Missing or unverified</p>
                <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted-foreground">
                  {e.certainty.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {e.certainty.couldChange.length > 0 && (
              <div>
                <p className="text-xs font-medium">Could change this</p>
                <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted-foreground">
                  {e.certainty.couldChange.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <Accordion type="multiple" defaultValue={defaultOpen} className="-mt-1">
        {e.evidence.length > 0 && (
          <AccordionItem value="evidence">
            <AccordionTrigger className="py-2.5 text-sm">Evidence ({e.evidence.length})</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col divide-y rounded-lg border">
                {e.evidence.map((ev) => (
                  <li key={ev.kind + ev.id} className="flex flex-col gap-1 p-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 font-medium">
                        {ev.label} <ProvenanceTag provenance={ev.provenance} />
                      </p>
                      <p className="text-xs text-muted-foreground">{ev.detail}</p>
                      {(ev.asOf || ev.stale) && (
                        <p className={cn("mt-0.5 flex items-center gap-1 text-xs", ev.stale ? "text-warning" : "text-muted-foreground")}>
                          {ev.stale ? <TriangleAlert className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
                          {ev.asOf ? `Updated ${fmtDate(ev.asOf)}` : "No update date recorded"}
                          {ev.stale && ", may be out of date"}
                        </p>
                      )}
                    </div>
                    {ev.href && (
                      <Link href={ev.href} className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-brand hover:underline">
                        Open record <ArrowUpRight className="size-3" aria-hidden />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
        {e.calculations.length > 0 && (
          <AccordionItem value="calculation">
            <AccordionTrigger className="py-2.5 text-sm">Calculation ({e.calculations.length} steps)</AccordionTrigger>
            <AccordionContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-2.5 py-1.5 font-medium">Step</th>
                      <th className="px-2.5 py-1.5 font-medium">Formula and inputs</th>
                      <th className="px-2.5 py-1.5 text-right font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {e.calculations.map((c, i) => (
                      <tr key={i}>
                        <td className="px-2.5 py-1.5 align-top">{c.label}</td>
                        <td className="tabular px-2.5 py-1.5 align-top text-muted-foreground">{c.formula}</td>
                        <td className="tabular px-2.5 py-1.5 text-right align-top font-medium whitespace-nowrap">{c.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
        {e.assumptions.length > 0 && (
          <AccordionItem value="assumptions">
            <AccordionTrigger className="py-2.5 text-sm">Assumptions used ({e.assumptions.length})</AccordionTrigger>
            <AccordionContent>
              <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {e.assumptions.map((a) => (
                  <div key={a.key} className="flex items-baseline justify-between gap-3 border-b border-dashed pb-1">
                    <dt className="text-xs text-muted-foreground">{a.label}</dt>
                    <dd className="tabular text-xs font-medium whitespace-nowrap">{a.value}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/app/settings" className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:underline">
                Edit assumptions <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </AccordionContent>
          </AccordionItem>
        )}
        {e.alternatives.length > 0 && (
          <AccordionItem value="alternatives">
            <AccordionTrigger className="py-2.5 text-sm">Alternatives ({included.length + excluded.length})</AccordionTrigger>
            <AccordionContent>
              {included.length > 0 && (
                <ul className="flex flex-col divide-y rounded-lg border">
                  {included.map((a) => (
                    <li key={a.id} className={cn("flex items-start gap-3 p-2.5", a.chosen && "bg-brand-soft/50")}>
                      {a.score !== undefined && <span className="tabular w-9 shrink-0 pt-px text-xs font-semibold text-muted-foreground">{a.score.toFixed(2)}</span>}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {a.label}
                          {a.chosen && <span className="ml-1.5 text-xs font-normal text-brand">Recommended</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{a.summary}</p>
                        {a.tradeoffs.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground">{a.tradeoffs.join(" ")}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {excluded.length > 0 && (
                <>
                  <p className="mt-3 mb-1.5 text-xs font-medium text-muted-foreground">Considered and ruled out</p>
                  <ul className="flex flex-col gap-1.5 text-xs">
                    {excluded.map((a) => (
                      <li key={a.id}>
                        <span className="font-medium">
                          {a.label}, {a.summary}:
                        </span>{" "}
                        <span className="text-muted-foreground">{a.excludedReason}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
        {e.limitations.length > 0 && (
          <AccordionItem value="limitations" className="border-b-0">
            <AccordionTrigger className="py-2.5 text-sm">Limitations ({e.limitations.length})</AccordionTrigger>
            <AccordionContent>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
                {e.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      {e.requiresHumanApproval && e.approvalReason && <p className="text-xs text-muted-foreground">Needs your confirmation: {e.approvalReason}</p>}
    </div>
  );
}
