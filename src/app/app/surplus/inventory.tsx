"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Boxes, Camera, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge, type Tone } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { samples } from "@/lib/ai/samples";
import { materialById, siteName } from "@/lib/engine/context";
import { listingAgeDays, listingValueRm } from "@/lib/engine/impact";
import { matchNeed } from "@/lib/engine/matching";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useNewId, useStore } from "@/lib/store";
import type { Listing } from "@/lib/types";

export const listingTone: Record<Listing["status"], Tone> = { available: "success", reserved: "brand", transferred: "neutral", community: "info" };
const statusLabel: Record<Listing["status"], string> = { available: "Available", reserved: "Reserved", transferred: "Transferred", community: "Community offer" };

interface Row {
  l: Listing;
  item: string;
  category: string;
  township: string;
  status: string;
  age: number;
  value: number;
}

export function Inventory() {
  const { state, ready } = useStore();
  const params = useSearchParams();
  const [open, setOpen] = useState<Listing | null>(null);

  const rows: Row[] = useMemo(
    () =>
      state.listings.map((l) => {
        const m = materialById(state, l.materialId);
        return { l, item: m.name, category: m.category, township: siteName(state, l.siteId), status: statusLabel[l.status], age: listingAgeDays(state, l), value: listingValueRm(state, l) };
      }),
    [state],
  );

  const columns: ColumnDef<Row, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "item",
        header: "Item",
        cell: ({ row }) => {
          const s = samples.find((x) => x.id === row.original.l.sampleId);
          return (
            <div className="flex min-w-48 items-center gap-3">
              {s ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt="" className="size-9 shrink-0 rounded-md border object-cover" />
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-muted-foreground">
                  <Boxes className="size-4" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{row.original.item}</p>
                <p className="truncate text-xs text-muted-foreground">{row.original.category}</p>
              </div>
            </div>
          );
        },
      },
      { accessorKey: "township", header: "Township", filterFn: "equalsString", cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue() as string}</span> },
      {
        id: "qty",
        accessorFn: (r) => r.l.qty,
        header: "Quantity",
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap">
            {fmtNum(row.original.l.qty)} {materialById(state, row.original.l.materialId).unit}
          </span>
        ),
      },
      { id: "condition", accessorFn: (r) => r.l.condition, header: "Condition", cell: ({ getValue }) => <span className="capitalize">{getValue() as string}</span> },
      { accessorKey: "status", header: "Status", filterFn: "equalsString", cell: ({ row }) => <StatusBadge tone={listingTone[row.original.l.status]}>{row.original.status}</StatusBadge> },
      {
        accessorKey: "age",
        header: "Age",
        cell: ({ row }) => {
          const late = row.original.l.status === "available" && row.original.age > state.assumptions.global.unclaimedAlertDays;
          return <span className={late ? "tabular font-medium whitespace-nowrap text-warning" : "tabular whitespace-nowrap"}>{row.original.age} days</span>;
        },
      },
      { accessorKey: "value", header: "Value", cell: ({ getValue }) => <span className="tabular whitespace-nowrap">{fmtRm(getValue() as number)}</span> },
      { accessorKey: "category", header: "Category", filterFn: "equalsString" },
    ],
    [state],
  );

  if (!ready) return <PageSkeleton />;
  const available = state.listings.filter((l) => l.status === "available");
  const opt = (vals: string[]) => [...new Set(vals)].sort().map((v) => ({ value: v, label: v }));

  return (
    <>
      <PageHeader
        title="Surplus inventory"
        description="Material logged as leftover on any site. Available items can be matched to needs anywhere in the network."
        actions={
          <Button asChild>
            <Link href="/app/surplus/log">
              <Camera aria-hidden /> Log surplus
            </Link>
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
        <KpiCard label="Available items" value={fmtNum(available.length)} />
        <KpiCard label="Available value" value={fmtRm(available.reduce((a, l) => a + listingValueRm(state, l), 0))} />
        <KpiCard label="Reserved" value={fmtNum(state.listings.filter((l) => l.status === "reserved").length)} />
        <KpiCard
          label={`Unclaimed over ${state.assumptions.global.unclaimedAlertDays} days`}
          value={fmtNum(available.filter((l) => listingAgeDays(state, l) > state.assumptions.global.unclaimedAlertDays).length)}
          tone="warning"
        />
      </div>
      <DataTable
        columns={columns}
        hiddenColumns={["category"]}
        data={rows}
        searchPlaceholder="Search item or township"
        initialSearch={params.get("q") ?? ""}
        initialSorting={[{ id: "age", desc: false }]}
        filters={[
          { columnId: "status", label: "Statuses", options: opt(rows.map((r) => r.status)) },
          { columnId: "township", label: "Townships", options: opt(rows.map((r) => r.township)) },
          { columnId: "category", label: "Categories", options: opt(rows.map((r) => r.category)) },
        ]}
        onRowClick={(r) => setOpen(r.l)}
        rowLabel={(r) => `${r.item}, ${r.township}. Open details`}
        empty={<EmptyState className="m-4 border-0" icon={Boxes} title="No surplus matches" description="Clear the filters, or log new surplus from a photo." />}
      />
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">{open && <ListingDetail listing={state.listings.find((l) => l.id === open.id) ?? open} onDone={() => setOpen(null)} />}</SheetContent>
      </Sheet>
    </>
  );
}

function ListingDetail({ listing, onDone }: { listing: Listing; onDone: () => void }) {
  const { state, dispatch, person } = useStore();
  const newId = useNewId();
  const m = materialById(state, listing.materialId);
  const sample = samples.find((s) => s.id === listing.sampleId);
  const outcome = listing.forecastId ? state.outcomes.find((o) => o.forecastId === listing.forecastId) : undefined;
  const candidates = useMemo(
    () =>
      state.needs
        .filter((n) => n.status === "open")
        .map((n) => ({ n, match: matchNeed(state, n).matches.find((x) => x.listing.id === listing.id) }))
        .filter((x) => x.match)
        .sort((a, b) => b.match!.score - a.match!.score),
    [state, listing.id],
  );

  return (
    <>
      <SheetHeader>
        <SheetTitle>{m.name}</SheetTitle>
        <SheetDescription>
          {siteName(state, listing.siteId)}, logged {fmtDate(listing.loggedAt)} by {listing.loggedBy}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-4 pb-6">
        {sample && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sample.src} alt={`Sample illustration: ${sample.label}`} className="aspect-[4/3] w-full rounded-lg border object-cover" />
        )}
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={listingTone[listing.status]}>{statusLabel[listing.status]}</StatusBadge>
          {m.structural && <StatusBadge tone="warning">Engineer approval needed</StatusBadge>}
          {listing.aiEstimated && (
            <StatusBadge tone="info">
              <Sparkles className="size-3" aria-hidden /> Quantity estimated from photo
            </StatusBadge>
          )}
          {outcome && <StatusBadge tone={outcome.status === "Confirmed" ? "success" : "warning"}>Forecast {outcome.status.toLowerCase()}</StatusBadge>}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Quantity", `${fmtNum(listing.qty)} ${m.unit}`],
            ["Condition", listing.condition],
            ["Value at new price", fmtRm(listingValueRm(state, listing))],
            ["Unclaimed for", `${listingAgeDays(state, listing)} days`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-muted p-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="tabular mt-1 font-semibold capitalize">{v}</dd>
            </div>
          ))}
        </dl>
        {outcome && (
          <p className="text-sm text-muted-foreground">
            Forecast {fmtNum(outcome.forecastQty)}, actual {fmtNum(outcome.actualQty)} ({outcome.actualQty - outcome.forecastQty >= 0 ? "+" : ""}
            {fmtNum(outcome.actualQty - outcome.forecastQty)}).
          </p>
        )}
        {listing.notes && <p className="rounded-lg border p-3 text-sm">{listing.notes}</p>}
        {listing.status === "available" && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Open needs this could fill</h3>
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open need matches yet. It stays visible to every site.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {candidates.slice(0, 4).map(({ n, match }) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">
                        {siteName(state, n.siteId)}: {fmtNum(n.qty)} {materialById(state, n.materialId).unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {fmtDate(n.neededBy)}, {fmtNum(match!.distanceKm, 1)} km, score {match!.score.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        dispatch({
                          type: "createTransfer",
                          transfer: {
                            id: newId("T"),
                            listingId: listing.id,
                            needId: n.id,
                            fromSiteId: listing.siteId,
                            toSiteId: n.siteId,
                            materialId: listing.materialId,
                            qty: match!.qty,
                            status: "Matched",
                            requiresApproval: m.structural,
                            createdAt: state.today,
                            history: [{ status: "Matched", at: state.today, by: person.name }],
                          },
                        });
                        toast.success("Matched. Track it on the Transfers page.");
                        onDone();
                      }}
                    >
                      Match
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
