"use client";

import { ArrowUpRight, Camera, CircleCheck, Clock, HandHeart, Radar, ShieldAlert, Shuffle, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AskBar } from "@/components/ai/ask-bar";
import { EmptyState } from "@/components/app/empty-state";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { CertaintyBadge } from "@/components/explain/certainty";
import { Button } from "@/components/ui/button";
import { materialById, siteName } from "@/lib/engine/context";
import { decisionQueue, impactStages, type QueueKind } from "@/lib/engine/queue";
import { forecastCertainty } from "@/lib/explain/builders";
import { diffDays, fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useForecasts, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const kindMeta: Record<QueueKind, { label: string; icon: typeof ShieldAlert; className: string }> = {
  approval: { label: "Approval", icon: ShieldAlert, className: "text-warning" },
  "forecast-decision": { label: "Forecast hold", icon: Clock, className: "text-forecast-ink" },
  reserve: { label: "Reserve", icon: Truck, className: "text-brand" },
  match: { label: "Match", icon: Shuffle, className: "text-brand" },
  unclaimed: { label: "Unclaimed", icon: HandHeart, className: "text-muted-foreground" },
};

export function Overview() {
  const { state, ready, person } = useStore();
  const forecasts = useForecasts();
  const queue = useMemo(() => decisionQueue(state), [state]);
  const stages = useMemo(() => impactStages(state), [state]);
  const upcoming = useMemo(
    () =>
      forecasts
        .filter((f) => f.status === "Forecast" && diffDays(state.today, f.availableFrom) >= 0 && diffDays(state.today, f.availableFrom) <= 90)
        .map((f) => ({ f, value: f.qty * state.assumptions.materials[f.materialId].unitCostRm, c: forecastCertainty(f, state.phases.find((p) => p.id === f.phaseId)!, state.today) }))
        .sort((a, b) => b.value - a.value),
    [forecasts, state],
  );

  if (!ready) return <PageSkeleton />;

  const primary =
    state.role === "engineer"
      ? { href: "/app/surplus/log", label: "Log surplus", icon: Camera }
      : { href: "/app/radar", label: "Run a Pre-Order Check", icon: Radar };
  const approvals = queue.filter((q) => q.kind === "approval").length;
  const blocked = queue.filter((q) => q.blocker).length;

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${person.name}, ${person.title.toLowerCase()}. What needs a decision across the network on ${fmtDate(state.today)}.`}
        actions={
          <Button asChild>
            <Link href={primary.href}>
              <primary.icon aria-hidden /> {primary.label}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
        <KpiCard label="Waiting on a decision" value={fmtNum(queue.length)} hint={`${approvals} need engineer approval`} tone="warning" />
        <KpiCard label="Blocked transfers" value={fmtNum(blocked)} hint="Approval or surplus not logged" tone="warning" />
        <KpiCard label="Reusable surplus now" value={fmtRm(stages.available)} hint="Logged and unclaimed, at new price" />
        <KpiCard label="Saving achieved" value={fmtRm(stages.achieved.savedRm)} hint={`${stages.achieved.count} completed transfers, estimated`} tone="success" />
      </div>

      <AskBar variant="overview" className="mt-6" />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section aria-labelledby="queue-h" className="rounded-xl border bg-card lg:col-span-3">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
            <div>
              <h2 id="queue-h" className="font-semibold">
                Needs your decision
              </h2>
              <p className="text-xs text-muted-foreground">Most urgent first. Each item links to its evidence.</p>
            </div>
            <Link href="/app/activity" className="shrink-0 text-xs font-medium text-brand hover:underline">
              Decision history
            </Link>
          </div>
          {queue.length === 0 ? (
            <EmptyState className="m-4" icon={CircleCheck} title="Nothing is waiting on you" description="New needs, approvals and forecast holds will appear here." />
          ) : (
            <ul className="divide-y">
              {queue.slice(0, 8).map((q) => {
                const k = kindMeta[q.kind];
                return (
                  <li key={q.id}>
                    <Link href={q.href} className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:outline-none sm:px-5">
                      <k.icon className={cn("mt-0.5 size-4 shrink-0", k.className)} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                          <span className="min-w-0">{q.title}</span>
                          {q.certainty && <CertaintyBadge level={q.certainty} />}
                        </p>
                        <p className="text-xs text-muted-foreground">{q.detail}</p>
                        {q.blocker && <p className="mt-0.5 text-xs text-warning">Blocked: {q.blocker}</p>}
                      </div>
                      <span className="hidden shrink-0 items-center gap-1 pt-0.5 text-xs font-medium text-brand group-hover:underline sm:inline-flex">
                        {q.action} <ArrowUpRight className="size-3" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <section aria-labelledby="stages-h" className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3 sm:px-5">
              <h2 id="stages-h" className="font-semibold">
                Achieved versus estimated
              </h2>
              <p className="text-xs text-muted-foreground">Each transfer is counted in one stage only.</p>
            </div>
            <dl className="divide-y text-sm">
              {[
                { k: "Achieved", d: "Completed transfers", v: stages.achieved, tone: "bg-success" },
                { k: "In progress", d: "Matched to collected, real surplus", v: stages.inProgress, tone: "bg-brand" },
                { k: "Held on forecast", d: "Surplus not yet logged", v: stages.onForecast, tone: "bg-forecast" },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <dt className="flex items-start gap-2.5">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", r.tone)} aria-hidden />
                    <span>
                      <span className="font-medium">{r.k}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.d}, {r.v.count} transfer{r.v.count === 1 ? "" : "s"}
                      </span>
                    </span>
                  </dt>
                  <dd className="tabular shrink-0 text-right whitespace-nowrap">
                    <span className="font-semibold">{fmtRm(r.v.savedRm)}</span>
                    <span className="block text-xs text-muted-foreground">{fmtNum(r.v.tonnes, 1)} t</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="border-t px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
              Savings use assumed unit costs. Quantities are from simulated records.{" "}
              <Link href="/app/impact#ledger" className="font-medium text-brand hover:underline">
                See the ledger
              </Link>
            </p>
          </section>

          <section aria-labelledby="coming-h" className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3 sm:px-5">
              <h2 id="coming-h" className="font-semibold">
                Surplus on the way
              </h2>
              <p className="text-xs text-muted-foreground">Forecast from purchase plans, next 90 days.</p>
            </div>
            <ul className="divide-y">
              {upcoming.slice(0, 5).map(({ f, value, c }) => {
                const m = materialById(state, f.materialId);
                return (
                  <li key={f.id}>
                    <Link href={`/app/radar?forecast=${f.id}`} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/40 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {fmtNum(f.qty)} {m.unit}, {siteName(state, f.siteId)}, from {fmtDate(f.availableFrom)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tabular text-sm font-medium">{fmtRm(value)}</span>
                        <CertaintyBadge level={c.level} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
