"use client";

import { ArrowRight, Camera, CircleCheck, Radar } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AskBar } from "@/components/ai/ask-bar";
import { EmptyState } from "@/components/app/empty-state";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { CertaintyBadge } from "@/components/explain/certainty";
import { NetworkLegend, SurplusNetwork } from "@/components/network/surplus-network";
import { Button } from "@/components/ui/button";
import { materialById, siteName } from "@/lib/engine/context";
import { savingsByMonth } from "@/lib/engine/impact";
import { decisionQueue, impactStages, type QueueItem, type QueueKind } from "@/lib/engine/queue";
import { forecastCertainty } from "@/lib/explain/builders";
import { diffDays, fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useForecasts, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindMeta: Record<QueueKind, { label: string; className: string }> = {
  approval: { label: "Approval", className: "text-warning" },
  "forecast-decision": { label: "Forecast hold", className: "text-forecast-ink" },
  reserve: { label: "Reserve", className: "text-brand" },
  match: { label: "Match", className: "text-brand" },
  unclaimed: { label: "Unclaimed", className: "text-muted-foreground" },
};

/** Which decisions land in each role's inbox first. Everything else stays visible below. */
const forRole: Record<Role, QueueKind[]> = {
  engineer: ["approval", "forecast-decision", "unclaimed"],
  procurement: ["forecast-decision", "reserve", "match"],
  management: ["approval", "forecast-decision", "reserve", "match", "unclaimed"],
};

function due(days?: number) {
  if (days === undefined) return null;
  if (days < 0) return { text: `${-days} days overdue`, className: "text-danger" };
  if (days === 0) return { text: "Due today", className: "text-danger" };
  return { text: `Due in ${days} days`, className: days <= 7 ? "text-warning" : "text-muted-foreground" };
}

function InboxRow({ q, lead = false }: { q: QueueItem; lead?: boolean }) {
  const { state, dispatch, person } = useStore();
  const k = kindMeta[q.kind];
  const d = due(q.dueInDays);
  const transferId = q.kind === "reserve" ? q.id.replace(/^reserve-/, "") : undefined;
  const engineerOnly = q.kind === "approval" && state.role !== "engineer";

  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className={cn("font-semibold tracking-wide uppercase", k.className)}>{k.label}</span>
          {d && <span className={cn("tabular-nums", d.className)}>{d.text}</span>}
          {q.certainty && <CertaintyBadge level={q.certainty} />}
        </p>
        <p className="mt-1 text-sm font-medium">{q.title}</p>
        <p className="text-xs text-muted-foreground">{q.detail}</p>
        {q.blocker && <p className="mt-0.5 text-xs text-warning">Blocked: {q.blocker}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {transferId ? (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href={q.href}>Details</Link>
            </Button>
            <Button
              size="sm"
              variant={lead ? "default" : "outline"}
              onClick={() => {
                const t = state.transfers.find((x) => x.id === transferId);
                dispatch({ type: "advanceTransfer", id: transferId, by: person.name });
                toast.success(t?.requiresApproval && !t.approvedBy ? "Sent for site engineer approval." : "Reserved. The source site will set it aside.");
              }}
            >
              Reserve
            </Button>
          </>
        ) : engineerOnly ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={q.href}>Needs a site engineer</Link>
          </Button>
        ) : (
          <Button variant={lead ? "default" : "outline"} size="sm" asChild>
            <Link href={q.href}>
              {q.action} <ArrowRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}

export function Overview() {
  const { state, ready, person } = useStore();
  const forecasts = useForecasts();
  const [showOthers, setShowOthers] = useState(false);
  const queue = useMemo(() => decisionQueue(state), [state]);
  const stages = useMemo(() => impactStages(state), [state]);
  const monthly = useMemo(() => savingsByMonth(state), [state]);
  const upcoming = useMemo(
    () =>
      forecasts
        .filter((f) => f.status === "Forecast" && diffDays(state.today, f.availableFrom) >= 0 && diffDays(state.today, f.availableFrom) <= 90)
        .map((f) => ({ f, value: f.qty * state.assumptions.materials[f.materialId].unitCostRm, c: forecastCertainty(f, state.phases.find((p) => p.id === f.phaseId)!, state.today) }))
        .sort((a, b) => b.value - a.value),
    [forecasts, state],
  );

  if (!ready) return <PageSkeleton />;

  const mine = queue.filter((q) => forRole[state.role].includes(q.kind));
  const others = queue.filter((q) => !forRole[state.role].includes(q.kind));
  const primary =
    state.role === "engineer"
      ? { href: "/app/surplus/log", label: "Log surplus", icon: Camera }
      : { href: "/app/radar", label: "Run a Pre-Order Check", icon: Radar };
  const approvals = queue.filter((q) => q.kind === "approval").length;
  const blocked = queue.filter((q) => q.blocker).length;
  const holdSites = state.transfers.filter((t) => t.forecastId && !t.listingId && t.status === "Matched").flatMap((t) => [t.fromSiteId, t.toSiteId]);

  return (
    <>
      <PageHeader
        title="Today's decisions"
        description={`${person.name}, ${person.title.toLowerCase()}. ${mine.length} ${mine.length === 1 ? "item needs" : "items need"} you on ${fmtDate(state.today)}.`}
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
        <KpiCard
          label="Saving achieved"
          value={fmtRm(stages.achieved.savedRm)}
          hint={`${stages.achieved.count} completed transfers, estimated`}
          tone="success"
          trend={monthly.map((m) => m.cumulativeRm)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-3">
          <section aria-labelledby="queue-h" className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
              <div>
                <h2 id="queue-h" className="font-semibold">
                  For you <span className="tabular ml-1 text-muted-foreground">{mine.length}</span>
                </h2>
                <p className="text-xs text-muted-foreground">Most urgent first. Act here, or open the record to see its evidence.</p>
              </div>
              <Link href="/app/activity" className="shrink-0 text-xs font-medium text-brand hover:underline">
                Decision history
              </Link>
            </div>
            {mine.length === 0 ? (
              <EmptyState className="m-4" icon={CircleCheck} title="Nothing is waiting on you" description="New needs, approvals and forecast holds will appear here." />
            ) : (
              <ul className="divide-y">
                {mine.slice(0, 8).map((q, i) => (
                  <InboxRow key={q.id} q={q} lead={i === 0} />
                ))}
              </ul>
            )}
            {others.length > 0 && (
              <div className="border-t">
                <button
                  type="button"
                  aria-expanded={showOthers}
                  onClick={() => setShowOthers((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40 sm:px-5"
                >
                  <span>
                    {showOthers ? "Hide" : "Show"} {others.length} {others.length === 1 ? "item" : "items"} for other roles
                  </span>
                  <ArrowRight className={cn("size-3.5 transition-transform duration-150", showOthers && "rotate-90")} aria-hidden />
                </button>
                {showOthers && (
                  <ul className="divide-y border-t bg-muted/30">
                    {others.map((q) => (
                      <InboxRow key={q.id} q={q} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <AskBar variant="overview" />

          <section aria-labelledby="coming-h" className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3 sm:px-5">
              <h2 id="coming-h" className="font-semibold">
                Surplus on the way
              </h2>
              <p className="text-xs text-muted-foreground">Forecast from purchase plans, next 90 days.</p>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState className="m-4" icon={CircleCheck} title="No surplus forecast in the next 90 days" description="Forecasts appear as phases order more than their plans need." />
            ) : (
              <ul className="divide-y">
                {upcoming.slice(0, 5).map(({ f, value, c }) => {
                  const m = materialById(state, f.materialId);
                  return (
                    <li key={f.id}>
                      <Link href={`/app/radar?forecast=${f.id}`} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/40 sm:px-5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{m.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span className="tabular">{fmtNum(f.qty)}</span> {m.unit}, {siteName(state, f.siteId)}, from {fmtDate(f.availableFrom)}
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
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <section aria-labelledby="net-h" className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b px-4 py-3 sm:px-5">
              <h2 id="net-h" className="font-semibold">
                Surplus Network
              </h2>
              <p className="text-xs text-muted-foreground">Live from the demo records. Rings turn green when surplus is logged.</p>
            </div>
            <SurplusNetwork data={state} forecasts={forecasts} highlightSiteIds={holdSites} />
            <NetworkLegend className="border-t px-4 py-2.5 sm:px-5" />
          </section>

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
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-[2px]", r.tone)} aria-hidden />
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
        </div>
      </div>
    </>
  );
}
