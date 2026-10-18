"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRight, ArrowRight, Check, Clock, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge, type Tone } from "@/components/app/status-badge";
import { DecisionDialog, type DecisionMode } from "@/components/explain/decision-dialog";
import { ExplanationPanel } from "@/components/explain/explanation-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HERO_TRANSFER_ID } from "@/lib/actions";
import { makeDecision } from "@/lib/decisions";
import { explainTransferImpact } from "@/lib/explain/builders";
import { materialById, siteName } from "@/lib/engine/context";
import { siteDistanceKm } from "@/lib/engine/geo";
import { transferSavings } from "@/lib/engine/impact";
import { nextActionLabel, visibleSteps } from "@/lib/engine/transfers";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Transfer } from "@/lib/types";
import { cn } from "@/lib/utils";

const tone: Record<Transfer["status"], Tone> = {
  Matched: "info",
  "Awaiting approval": "warning",
  Reserved: "brand",
  Collected: "brand",
  Completed: "success",
  Cancelled: "neutral",
};

interface Row {
  t: Transfer;
  item: string;
  route: string;
  status: string;
  saved: number;
  date: string;
}

function statusText(t: Transfer) {
  if (t.status === "Cancelled") return "Cancelled";
  return t.forecastId && !t.listingId ? "Held on forecast" : t.status;
}

export function Transfers() {
  const { state, ready } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const params = useSearchParams();
  const linked = params.get("transfer");
  useEffect(() => {
    if (linked) setOpenId(linked);
  }, [linked]);

  const rows: Row[] = useMemo(
    () =>
      state.transfers.map((t) => ({
        t,
        item: materialById(state, t.materialId).name,
        route: `${siteName(state, t.fromSiteId)} to ${siteName(state, t.toSiteId)}`,
        status: statusText(t),
        saved: transferSavings(state, t).savedRm,
        date: t.completedAt ?? t.history[t.history.length - 1]?.at ?? t.createdAt,
      })),
    [state],
  );

  const columns: ColumnDef<Row, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "item",
        header: "Item",
        cell: ({ row }) => (
          <div className="min-w-44">
            <p className="font-medium">{row.original.item}</p>
            <p className="tabular text-xs text-muted-foreground">
              {fmtNum(row.original.t.qty)} {materialById(state, row.original.t.materialId).unit}
            </p>
          </div>
        ),
      },
      { accessorKey: "route", header: "Route", cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue() as string}</span> },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <StatusBadge tone={row.original.t.forecastId && !row.original.t.listingId ? "forecast" : tone[row.original.t.status]}>{row.original.status}</StatusBadge>
        ),
      },
      { accessorKey: "saved", header: "Est. saving", cell: ({ getValue }) => <span className="tabular whitespace-nowrap">{fmtRm(getValue() as number)}</span> },
      { accessorKey: "date", header: "Last update", cell: ({ getValue }) => <span className="whitespace-nowrap">{fmtDate(getValue() as string)}</span> },
    ],
    [state],
  );

  if (!ready) return <PageSkeleton />;
  const open = state.transfers.find((t) => t.id === openId) ?? null;
  const counts = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader title="Transfers" description="Each transfer moves through Matched, Reserved, Collected and Completed. Structural items cannot be reserved until an engineer approves them." />
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
        {["Held on forecast", "Matched", "Awaiting approval", "Reserved", "Collected", "Completed"].map((s) => (
          <div key={s} className="flex min-w-0 flex-col gap-1 bg-card px-3.5 py-3">
            <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{s}</span>
            <span className="tabular text-xl leading-none font-semibold">{counts(s)}</span>
          </div>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Search item or township"
        initialSorting={[{ id: "date", desc: true }]}
        filters={[{ columnId: "status", label: "Statuses", options: [...new Set(rows.map((r) => r.status))].sort().map((v) => ({ value: v, label: v })) }]}
        onRowClick={(r) => setOpenId(r.t.id)}
        rowLabel={(r) => `${r.item}, ${r.route}. Open workflow`}
        rowAttrs={(r) => (r.t.id === HERO_TRANSFER_ID ? { "data-demo": "hero-transfer" } : {})}
        rowClassName={(r) => (r.t.id === HERO_TRANSFER_ID ? "bg-forecast-soft/50" : undefined)}
        empty={<EmptyState className="m-4 border-0" icon={ArrowLeftRight} title="No transfers here" description="Match a need to surplus, or reserve forecast surplus in the Radar." />}
      />
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{open && <TransferDetail t={open} />}</SheetContent>
      </Sheet>
    </>
  );
}

function TransferDetail({ t }: { t: Transfer }) {
  const { state, dispatch, person } = useStore();
  const m = materialById(state, t.materialId);
  const steps = visibleSteps(t);
  const current = steps.indexOf(t.status);
  const action = nextActionLabel(t);
  const e = useMemo(() => explainTransferImpact(t, state), [t, state]);
  const needsEngineer = t.status === "Awaiting approval" && !t.approvedBy;
  const canApprove = state.role === "engineer";
  const held = t.forecastId && !t.listingId && t.status !== "Cancelled";
  const closed = t.status === "Completed" || t.status === "Cancelled";
  const [dialog, setDialog] = useState<DecisionMode | null>(null);
  const subjectLabel = `Transfer ${t.id}, ${m.name}`;
  const cancelled = t.history.find((h) => h.status === "Cancelled");

  const log = (outcome: "accepted" | "rejected", reason?: string, detail?: string) =>
    dispatch({
      type: "logDecision",
      decision: makeDecision({ e, kind: "transfer-approval", outcome, subjectId: t.id, subjectLabel, by: person.name, role: state.role, today: state.today, reason, detail, href: `/app/transfers?transfer=${t.id}` }),
    });

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {fmtNum(t.qty)} {m.unit}, {m.name}
        </SheetTitle>
        <SheetDescription>
          {siteName(state, t.fromSiteId)} to {siteName(state, t.toSiteId)}, {fmtNum(siteDistanceKm(state.sites, t.fromSiteId, t.toSiteId), 1)} km straight-line (approximate)
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-4 pb-6">
        <ol className="flex flex-col gap-0" aria-label="Workflow">
          {held && <Step label="Held on forecast" state="current" note="Waiting for the source site to log the actual surplus." />}
          {t.status === "Cancelled" ? (
            <Step label="Cancelled" state="current" note={cancelled ? `${fmtDate(cancelled.at)}, ${cancelled.by}${cancelled.note ? `: ${cancelled.note}` : ""}` : undefined} />
          ) : (
            steps.map((s, i) => (
              <Step
                key={s}
                label={s === "Awaiting approval" ? "Engineer approval" : s}
                state={held ? "todo" : i < current || t.status === "Completed" ? "done" : i === current ? "current" : "todo"}
                note={t.history
                  .filter((h) => h.status === s || (s === "Awaiting approval" && h.status === "Approved"))
                  .map((h) => `${fmtDate(h.at)}, ${h.by}`)
                  .join("; ")}
              />
            ))
          )}
        </ol>

        {held && t.forecastId && (
          <p className="rounded-lg border bg-muted/40 p-3 text-sm">
            This hold relies on a forecast, not on logged surplus.{" "}
            <Link href={`/app/radar?forecast=${t.forecastId}`} className="font-medium text-brand hover:underline">
              See the forecast and its evidence
            </Link>
          </p>
        )}

        {needsEngineer && (
          <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Structural item. A site engineer must approve it before it can be reserved.
              {!canApprove && " Switch to Site engineer in the user menu to approve or reject."}
            </span>
          </div>
        )}

        {!closed && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="ghost" className="sm:flex-1" disabled={needsEngineer && !canApprove} onClick={() => setDialog("reject")}>
              <XCircle aria-hidden /> {needsEngineer ? "Reject" : "Cancel transfer"}
            </Button>
            {action && (
              <Button
                className="sm:flex-1"
                disabled={needsEngineer && !canApprove}
                onClick={() => {
                  if (needsEngineer) return setDialog("approve");
                  dispatch({ type: "advanceTransfer", id: t.id, by: person.name });
                  toast.success(`${action}: done`);
                }}
              >
                {needsEngineer ? <ShieldCheck aria-hidden /> : <ArrowRight aria-hidden />} {action}
              </Button>
            )}
          </div>
        )}

        <section className="border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">Impact of this transfer</h3>
          <ExplanationPanel e={e} />
        </section>

        <div>
          <h3 className="mb-2 text-sm font-medium">History</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {[...t.history].reverse().map((h, i) => (
              <li key={i} className="flex gap-2">
                <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  <span className="font-medium">{h.status}</span>{" "}
                  <span className="text-muted-foreground">
                    {fmtDate(h.at)}, {h.by}
                  </span>
                  {h.note && <span className="block text-xs text-muted-foreground">{h.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <DecisionDialog
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
        mode={dialog ?? "approve"}
        e={e}
        title={dialog === "reject" ? (needsEngineer ? "Reject this structural transfer" : "Cancel this transfer") : "Approve structural reuse"}
        consequence={
          dialog === "reject"
            ? "The transfer is cancelled and the listing becomes available again. Your reason is saved."
            : "You confirm, as site engineer, that this structural item is fit for reuse at the receiving site. The transfer moves to Reserved."
        }
        confirmLabel={dialog === "reject" ? (needsEngineer ? "Reject and log" : "Cancel transfer") : "Approve and reserve"}
        quickReasons={needsEngineer ? ["Visible corrosion or damage", "Specification does not match the design", "Needs testing first"] : ["No longer needed", "Sourced elsewhere", "Collection not possible in time"]}
        onConfirm={({ reason }) => {
          if (dialog === "reject") {
            dispatch({ type: "rejectTransfer", id: t.id, by: person.name, reason: reason ?? "No reason given" });
            log("rejected", reason);
            toast("Transfer cancelled and logged");
          } else {
            dispatch({ type: "approveTransfer", id: t.id, by: person.name });
            log("accepted", undefined, "Engineer approved structural reuse.");
            toast.success("Approved and reserved");
          }
        }}
      />
    </>
  );
}

function Step({ label, state, note }: { label: string; state: "done" | "current" | "todo"; note?: string }) {
  return (
    <li className="group relative flex gap-3 pb-4 last:pb-0">
      <span
        className={cn(
          "z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 text-xs",
          state === "done" && "border-success bg-success text-white",
          state === "current" && "border-brand bg-brand-soft text-brand",
          state === "todo" && "border-border bg-card text-muted-foreground",
        )}
        aria-hidden
      >
        {state === "done" ? <Check className="size-3.5" /> : null}
      </span>
      <span className="absolute top-6 bottom-0 left-[11px] w-0.5 bg-border group-last:hidden" aria-hidden />
      <div className="pt-0.5">
        <p className={cn("text-sm", state === "current" ? "font-semibold" : state === "todo" ? "text-muted-foreground" : "font-medium")}>
          {label}
          <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (current step)" : " (to do)"}</span>
        </p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </li>
  );
}
