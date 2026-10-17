"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, ChevronDown, ClipboardList, Plus, Radar, SearchX, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge, type Tone } from "@/components/app/status-badge";
import { CertaintyBadge } from "@/components/explain/certainty";
import { DecisionDialog, type DecisionMode } from "@/components/explain/decision-dialog";
import { ExplanationPanel } from "@/components/explain/explanation-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { materialById, siteName } from "@/lib/engine/context";
import { makeDecision } from "@/lib/decisions";
import { matchNeed, type Match } from "@/lib/engine/matching";
import { explainMatch } from "@/lib/explain/builders";
import { addDays, fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useNewId, useStore } from "@/lib/store";
import type { Need } from "@/lib/types";
import { cn } from "@/lib/utils";

const needTone: Record<Need["status"], Tone> = { open: "warning", matched: "brand", fulfilled: "success" };
const needLabel: Record<Need["status"], string> = { open: "Open", matched: "Matched", fulfilled: "Fulfilled" };

interface Row {
  n: Need;
  item: string;
  township: string;
  status: string;
  matches: number;
  best: number | null;
}

export function Needs() {
  const { state, ready } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const params = useSearchParams();
  const linked = params.get("need");
  useEffect(() => {
    if (linked) setOpenId(linked);
  }, [linked]);

  const rows: Row[] = useMemo(
    () =>
      state.needs.map((n) => {
        const r = n.status === "open" ? { matches: matchNeed(state, n).matches.filter((x) => !state.dismissedMatches.some((d) => d.needId === n.id && d.listingId === x.listing.id)) } : { matches: [] };
        return {
          n,
          item: materialById(state, n.materialId).name,
          township: siteName(state, n.siteId),
          status: needLabel[n.status],
          matches: r.matches.length,
          best: r.matches[0]?.score ?? null,
        };
      }),
    [state],
  );

  const columns: ColumnDef<Row, unknown>[] = useMemo(
    () => [
      { accessorKey: "item", header: "Item", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
      { accessorKey: "township", header: "Township", filterFn: "equalsString", cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue() as string}</span> },
      {
        id: "qty",
        accessorFn: (r) => r.n.qty,
        header: "Quantity",
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap">
            {fmtNum(row.original.n.qty)} {materialById(state, row.original.n.materialId).unit}
          </span>
        ),
      },
      { id: "neededBy", accessorFn: (r) => r.n.neededBy, header: "Needed by", cell: ({ row }) => <span className="whitespace-nowrap">{fmtDate(row.original.n.neededBy)}</span> },
      { accessorKey: "status", header: "Status", filterFn: "equalsString", cell: ({ row }) => <StatusBadge tone={needTone[row.original.n.status]}>{row.original.status}</StatusBadge> },
      {
        accessorKey: "matches",
        header: "Matches",
        cell: ({ row }) =>
          row.original.n.status !== "open" ? (
            <span className="text-muted-foreground">Handled</span>
          ) : row.original.matches ? (
            <span className="tabular whitespace-nowrap">
              {row.original.matches} found, best {row.original.best?.toFixed(2)}
            </span>
          ) : (
            <span className="text-muted-foreground">None yet</span>
          ),
      },
    ],
    [state],
  );

  if (!ready) return <PageSkeleton />;
  const opt = (vals: string[]) => [...new Set(vals)].sort().map((v) => ({ value: v, label: v }));
  const openNeed = state.needs.find((n) => n.id === openId) ?? null;

  return (
    <>
      <PageHeader
        title="Needs"
        description="What sites are about to buy. Each open need is matched against logged surplus, nearest and best fit first."
        actions={
          <Button onClick={() => setPosting(true)}>
            <Plus aria-hidden /> Post a need
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Search item or township"
        initialSorting={[{ id: "neededBy", desc: false }]}
        filters={[
          { columnId: "status", label: "Statuses", options: opt(rows.map((r) => r.status)) },
          { columnId: "township", label: "Townships", options: opt(rows.map((r) => r.township)) },
        ]}
        onRowClick={(r) => setOpenId(r.n.id)}
        rowLabel={(r) => `${r.item} for ${r.township}. Open matches`}
        empty={<EmptyState className="m-4 border-0" icon={ClipboardList} title="No needs match" description="Clear the filters or post a new need." />}
      />
      <PostNeedDialog open={posting} onOpenChange={setPosting} onPosted={(id) => setOpenId(id)} />
      <Sheet open={!!openNeed} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{openNeed && <NeedDetail need={openNeed} onDone={() => setOpenId(null)} />}</SheetContent>
      </Sheet>
    </>
  );
}

function NeedDetail({ need, onDone }: { need: Need; onDone: () => void }) {
  const { state, dispatch, person } = useStore();
  const newId = useNewId();
  const m = materialById(state, need.materialId);
  const { matches: all, excluded } = useMemo(() => matchNeed(state, need), [state, need]);
  const dismissed = state.dismissedMatches.filter((d) => d.needId === need.id);
  const matches = all.filter((x) => !dismissed.some((d) => d.listingId === x.listing.id));
  const transfers = state.transfers.filter((t) => t.needId === need.id && t.status !== "Cancelled");
  const [expanded, setExpanded] = useState<string | null>(matches[0]?.listing.id ?? null);
  const [dialog, setDialog] = useState<{ mode: DecisionMode; listingId: string } | null>(null);
  const active = dialog ? matches.find((x) => x.listing.id === dialog.listingId) : undefined;
  const activeE = active ? explainMatch(active, need, matches, state) : null;
  const subjectLabel = `Need ${need.id}, ${siteName(state, need.siteId)}`;

  const approve = (x: Match, qty: number) => {
    const e = explainMatch(x, need, matches, state);
    const tid = newId("T");
    dispatch({
      type: "createTransfer",
      transfer: {
        id: tid,
        listingId: x.listing.id,
        needId: need.id,
        fromSiteId: x.listing.siteId,
        toSiteId: need.siteId,
        materialId: x.listing.materialId,
        qty,
        status: "Matched",
        requiresApproval: x.needsApproval,
        createdAt: state.today,
        history: [{ status: "Matched", at: state.today, by: person.name, note: `Approved from the ranked match list (${e.certainty.level} evidence).` }],
      },
    });
    dispatch({
      type: "logDecision",
      decision: makeDecision({
        e,
        kind: "match",
        outcome: qty === x.qty ? "accepted" : "modified",
        subjectId: need.id,
        subjectLabel,
        by: person.name,
        role: state.role,
        today: state.today,
        detail: qty === x.qty ? (x.needsApproval ? "Sent for engineer approval (structural item)." : undefined) : `Matched ${fmtNum(qty)} instead of ${fmtNum(x.qty)} ${m.unit}.`,
        href: `/app/transfers?transfer=${tid}`,
      }),
    });
    toast.success(`Matched ${fmtNum(qty)} ${m.unit} from ${siteName(state, x.listing.siteId)}`, {
      description: x.needsApproval ? "Next: a site engineer approves it on the Transfers page." : "Next: reserve it on the Transfers page.",
    });
    onDone();
  };

  const reject = (x: Match, reason: string) => {
    const e = explainMatch(x, need, matches, state);
    dispatch({ type: "dismissMatch", needId: need.id, listingId: x.listing.id, reason, by: person.name });
    dispatch({
      type: "logDecision",
      decision: makeDecision({ e, kind: "match", outcome: "rejected", subjectId: need.id, subjectLabel, by: person.name, role: state.role, today: state.today, reason, href: `/app/needs?need=${need.id}` }),
    });
    toast("Match rejected and logged", { description: "It is hidden from this need. You can restore it below." });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {fmtNum(need.qty)} {m.unit}, {m.name}
        </SheetTitle>
        <SheetDescription>
          {siteName(state, need.siteId)}, needed by {fmtDate(need.neededBy)}. Posted by {need.postedBy}.
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-4 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={needTone[need.status]}>{needLabel[need.status]}</StatusBadge>
          {m.structural && <StatusBadge tone="warning">Structural: engineer approval required</StatusBadge>}
        </div>
        {transfers.length > 0 && (
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            {transfers.length} transfer{transfers.length > 1 ? "s" : ""} in progress for this need.{" "}
            <Link href={`/app/transfers?transfer=${transfers[0].id}`} className="font-medium text-brand underline-offset-2 hover:underline">
              Open transfer
            </Link>
          </div>
        )}
        <div>
          <h3 className="mb-1 text-sm font-semibold">Ranked matches from logged surplus</h3>
          <p className="mb-3 text-xs text-muted-foreground">Ranked by a fixed formula on coverage, distance, timing and condition. Nothing moves until you approve.</p>
          {matches.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No logged surplus fits"
              description="Nothing within range and in time yet. Check the Radar for surplus forecast to appear before your date."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/radar">
                    <Radar aria-hidden /> Open Surplus Radar
                  </Link>
                </Button>
              }
            />
          ) : (
            <ol className="flex flex-col gap-2">
              {matches.map((x, i) => {
                const e = explainMatch(x, need, matches, state);
                const open = expanded === x.listing.id;
                return (
                  <li key={x.listing.id} className={cn("rounded-lg border", i === 0 && "border-brand/40")}>
                    <div className="flex items-start gap-3 p-3">
                      <span className="tabular w-8 shrink-0 pt-0.5 text-xs font-semibold text-muted-foreground" title="Rank">
                        #{i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-medium">{siteName(state, x.listing.siteId)}</p>
                          <CertaintyBadge level={e.certainty.level} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {fmtNum(x.qty)} of {fmtNum(x.listing.qty)} {materialById(state, x.listing.materialId).unit}
                          {x.exactItem ? "" : `, substitute: ${materialById(state, x.listing.materialId).name}`}, {fmtNum(x.distanceKm, 1)} km, {x.listing.condition}, saves about {fmtRm(x.savings.savedRm)}
                        </p>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : x.listing.id)}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        >
                          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
                          {open ? "Hide reasoning" : "Why this match"}
                        </button>
                      </div>
                    </div>
                    {open && (
                      <div className="border-t px-3 pt-3 pb-1">
                        <p className="mb-3 text-sm font-medium">{e.recommendation}</p>
                        <p className="-mt-2 mb-3 text-sm text-muted-foreground">{e.outcome}</p>
                        <ExplanationPanel e={e} showRecommendation={false} />
                      </div>
                    )}
                    {need.status === "open" && (
                      <div className="flex gap-2 border-t p-2.5">
                        <Button size="sm" variant="ghost" className="flex-1" onClick={() => setDialog({ mode: "reject", listingId: x.listing.id })}>
                          <ThumbsDown aria-hidden /> Reject
                        </Button>
                        <Button size="sm" variant={i === 0 ? "default" : "outline"} className="flex-1" onClick={() => setDialog({ mode: "approve", listingId: x.listing.id })}>
                          <Check aria-hidden /> Approve match
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        {dismissed.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Rejected matches</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {dismissed.map((d) => {
                const l = state.listings.find((x) => x.id === d.listingId);
                return (
                  <li key={d.listingId} className="flex items-start justify-between gap-3 rounded-lg border border-dashed p-2.5">
                    <div className="min-w-0">
                      <p className="font-medium">{l ? `${siteName(state, l.siteId)}, ${fmtNum(l.qty)} ${materialById(state, l.materialId).unit}` : d.listingId}</p>
                      <p className="text-xs text-muted-foreground">
                        Rejected by {d.by} on {fmtDate(d.at)}: {d.reason}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "restoreMatch", needId: need.id, listingId: d.listingId })}>
                      Restore
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {excluded.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Ruled out by the filters</h3>
            <ul className="flex flex-col gap-1.5 text-sm">
              {excluded.map((ex) => (
                <li key={ex.listing.id} className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {siteName(state, ex.listing.siteId)}, {fmtNum(ex.listing.qty)} {materialById(state, ex.listing.materialId).unit}:
                  </span>{" "}
                  {ex.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {active && activeE && dialog && (
        <DecisionDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          mode={dialog.mode}
          e={activeE}
          title={dialog.mode === "reject" ? "Reject this match" : "Approve this match"}
          consequence={
            dialog.mode === "reject"
              ? "The listing stays available to other sites. Your reason is saved."
              : `Creates a transfer from ${siteName(state, active.listing.siteId)} and marks the listing reserved in Surplus AI.${active.needsApproval ? " A site engineer must approve it before it is reserved." : ""} No truck is booked.`
          }
          confirmLabel={dialog.mode === "reject" ? "Reject and log" : "Approve match"}
          quantity={dialog.mode === "approve" ? { value: active.qty, max: Math.min(active.listing.qty, need.qty), unit: m.unit, label: "Quantity to transfer" } : undefined}
          quickReasons={["Wrong specification or finish", "Condition not acceptable", "Too far for our haulier", "Already sourced elsewhere"]}
          onConfirm={({ reason, qty }) => (dialog.mode === "reject" ? reject(active, reason ?? "No reason given") : approve(active, qty ?? active.qty))}
        />
      )}
    </>
  );
}

function PostNeedDialog({ open, onOpenChange, onPosted }: { open: boolean; onOpenChange: (o: boolean) => void; onPosted: (id: string) => void }) {
  const { state, dispatch, person } = useStore();
  const newId = useNewId();
  const [siteId, setSiteId] = useState<string>(person.siteId);
  const phases = state.phases.filter((p) => p.siteId === siteId && p.status !== "completed");
  const [phaseId, setPhaseId] = useState<string>("");
  const [materialId, setMaterialId] = useState("plywood");
  const [qty, setQty] = useState(50);
  const [neededBy, setNeededBy] = useState(addDays(state.today, 28));
  const unit = materialById(state, materialId).unit;
  const effectivePhase = phases.some((p) => p.id === phaseId) ? phaseId : (phases[0]?.id ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a need</DialogTitle>
          <DialogDescription>Tell the network what you are about to buy. Matches appear straight away.</DialogDescription>
        </DialogHeader>
        <form
          id="need-form"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (qty <= 0 || !effectivePhase) return;
            const id = newId("N");
            dispatch({ type: "addNeed", need: { id, siteId, phaseId: effectivePhase, materialId, qty, neededBy, postedBy: person.name, status: "open" } });
            toast.success("Need posted");
            onOpenChange(false);
            onPosted(id);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nd-site">Township</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger id="nd-site" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.township}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nd-phase">Phase</Label>
            <Select value={effectivePhase} onValueChange={setPhaseId}>
              <SelectTrigger id="nd-phase" className="w-full">
                <SelectValue placeholder="No open phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="nd-mat">Item</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger id="nd-mat" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nd-qty">Quantity ({unit})</Label>
            <Input id="nd-qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} className="tabular" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nd-date">Needed by</Label>
            <Input id="nd-date" type="date" value={neededBy} min={state.today} onChange={(e) => e.target.value && setNeededBy(e.target.value)} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="need-form" disabled={qty <= 0 || !effectivePhase}>
            Post need
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
