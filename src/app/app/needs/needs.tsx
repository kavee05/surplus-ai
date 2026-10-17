"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Plus, Radar, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { Explain } from "@/components/app/explain";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge, type Tone } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { materialById, siteName } from "@/lib/engine/context";
import { matchNeed } from "@/lib/engine/matching";
import { addDays, fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useNewId, useStore } from "@/lib/store";
import type { Need } from "@/lib/types";

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

  const rows: Row[] = useMemo(
    () =>
      state.needs.map((n) => {
        const r = n.status === "open" ? matchNeed(state, n) : { matches: [] };
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{openNeed && <NeedDetail need={openNeed} onDone={() => setOpenId(null)} />}</SheetContent>
      </Sheet>
    </>
  );
}

function NeedDetail({ need, onDone }: { need: Need; onDone: () => void }) {
  const { state, dispatch, person } = useStore();
  const newId = useNewId();
  const m = materialById(state, need.materialId);
  const { matches, excluded } = useMemo(() => matchNeed(state, need), [state, need]);
  const transfers = state.transfers.filter((t) => t.needId === need.id);

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
            {transfers.length} transfer{transfers.length > 1 ? "s" : ""} in progress.{" "}
            <Link href="/app/transfers" className="font-medium text-brand underline-offset-2 hover:underline">
              Open Transfers
            </Link>
          </div>
        )}
        <div>
          <h3 className="mb-2 text-sm font-medium">Ranked matches from logged surplus</h3>
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
              {matches.map((x, i) => (
                <li key={x.listing.id} className="rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <span className="tabular grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-semibold text-brand-strong">{x.score.toFixed(2)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {i === 0 && <span className="mr-1.5 text-brand">Best match.</span>}
                        {siteName(state, x.listing.siteId)}, {fmtNum(x.listing.qty)} {materialById(state, x.listing.materialId).unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {x.exactItem ? "Same item" : `Substitute: ${materialById(state, x.listing.materialId).name}`}, {fmtNum(x.distanceKm, 1)} km, {x.listing.condition}, saves about {fmtRm(x.savings.savedRm)}
                      </p>
                    </div>
                    <Explain title="Why this match" lines={[...x.explanation, ...x.savings.explanation]} iconOnly />
                  </div>
                  {need.status === "open" && (
                    <Button
                      size="sm"
                      variant={i === 0 ? "default" : "outline"}
                      className="mt-3 w-full"
                      onClick={() => {
                        dispatch({
                          type: "createTransfer",
                          transfer: {
                            id: newId("T"),
                            listingId: x.listing.id,
                            needId: need.id,
                            fromSiteId: x.listing.siteId,
                            toSiteId: need.siteId,
                            materialId: x.listing.materialId,
                            qty: x.qty,
                            status: "Matched",
                            requiresApproval: x.needsApproval,
                            createdAt: state.today,
                            history: [{ status: "Matched", at: state.today, by: person.name }],
                          },
                        });
                        toast.success(`Matched ${fmtNum(x.qty)} ${m.unit} from ${siteName(state, x.listing.siteId)}`, {
                          description: x.needsApproval ? "Next: engineer approval." : "Next: reserve it on the Transfers page.",
                        });
                        onDone();
                      }}
                    >
                      Match {fmtNum(x.qty)} {m.unit}
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
        {excluded.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Not used</h3>
            <ul className="flex flex-col gap-1.5 text-sm">
              {excluded.map((e) => (
                <li key={e.listing.id} className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {siteName(state, e.listing.siteId)}, {fmtNum(e.listing.qty)} {materialById(state, e.listing.materialId).unit}:
                  </span>{" "}
                  {e.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
