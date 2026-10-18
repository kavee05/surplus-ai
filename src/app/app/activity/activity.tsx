"use client";

import { ArrowUpRight, Check, History, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { SimulatedBadge } from "@/components/app/simulated-badge";
import { CertaintyBadge } from "@/components/explain/certainty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { DecisionKind, DecisionOutcome } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindLabel: Record<DecisionKind, string> = {
  preorder: "Pre-Order Check",
  match: "Need match",
  photo: "Photo suggestion",
  "transfer-approval": "Transfer approval",
};

const outcomeMeta: Record<DecisionOutcome, { label: string; icon: typeof Check; className: string }> = {
  accepted: { label: "Accepted", icon: Check, className: "bg-success-soft text-success" },
  modified: { label: "Modified", icon: Pencil, className: "bg-info-soft text-info" },
  rejected: { label: "Rejected", icon: X, className: "bg-danger-soft text-danger" },
};

export function Activity() {
  const { state, ready } = useStore();
  const [kind, setKind] = useState<string>("all");
  const [outcome, setOutcome] = useState<string>("all");
  const rows = useMemo(
    () => state.decisions.filter((d) => (kind === "all" || d.kind === kind) && (outcome === "all" || d.outcome === outcome)).sort((a, b) => b.at.localeCompare(a.at)),
    [state.decisions, kind, outcome],
  );

  if (!ready) return <PageSkeleton cards={0} />;
  const counts = (o: DecisionOutcome) => state.decisions.filter((d) => d.outcome === o).length;

  return (
    <>
      <PageHeader
        title="Activity"
        description="Every decision people made on a recommendation, with the recommendation exactly as it was shown and how strong its evidence was at the time."
      />
      <div className="mb-5 grid grid-cols-3 gap-3 sm:gap-4">
        {(["accepted", "modified", "rejected"] as const).map((o) => (
          <div key={o} className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{outcomeMeta[o].label}</p>
            <p className="tabular text-xl font-semibold">{counts(o)}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Decision type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All decision types</SelectItem>
            {Object.entries(kindLabel).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Outcome">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="modified">Modified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={History} title="No decisions yet" description="Approve, modify or reject a recommendation in the Radar, Needs or Transfers and it will be recorded here." />
      ) : (
        <ol className="divide-y overflow-hidden rounded-2xl bg-card shadow-card">
          {rows.map((d) => {
            const o = outcomeMeta[d.outcome];
            return (
              <li key={d.id} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[7.5rem_1fr_auto] sm:gap-4 sm:px-5">
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{fmtDate(d.at)}</p>
                  <p>{kindLabel[d.kind]}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium", o.className)}>
                      <o.icon className="size-3" aria-hidden /> {o.label}
                    </span>
                    <span className="text-sm font-medium">{d.subjectLabel}</span>
                    {d.simulated && <SimulatedBadge label="Seeded example" />}
                  </div>
                  <p className="mt-1 text-sm">{d.recommendation}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    Evidence at the time: <CertaintyBadge level={d.certainty} />
                  </p>
                  {d.reason && <p className="mt-1 text-xs">Reason: &ldquo;{d.reason}&rdquo;</p>}
                  {d.detail && <p className="mt-0.5 text-xs text-muted-foreground">{d.detail}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    By {d.by}, {d.role === "engineer" ? "site engineer" : d.role === "procurement" ? "procurement" : "management"}
                  </p>
                </div>
                {d.href && (
                  <Link href={d.href} className="inline-flex items-center gap-0.5 self-start text-xs font-medium text-brand hover:underline">
                    Open record <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
