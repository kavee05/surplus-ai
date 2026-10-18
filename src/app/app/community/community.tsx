"use client";

import { HandHeart, School, Sprout, TriangleAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { materialById, siteName } from "@/lib/engine/context";
import { listingAgeDays, listingValueRm } from "@/lib/engine/impact";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useStore } from "@/lib/store";

/** Simulated projects. No organisation has agreed to take part. */
const projectTypes = [
  { kind: "school", label: "Primary school garden beds", icon: School, wants: ["Timber", "Paving and landscape", "Formwork"] },
  { kind: "hall", label: "Community hall repairs", icon: Users, wants: ["Tiles and finishes", "Aggregates and binders", "Safety and site supplies", "Timber"] },
  { kind: "garden", label: "Community garden paths", icon: Sprout, wants: ["Paving and landscape", "Aggregates and binders", "Timber"] },
];

export function Community() {
  const { state, ready, dispatch } = useStore();
  if (!ready) return <PageSkeleton cards={0} />;
  const days = state.assumptions.global.communityOfferDays;
  const eligible = state.listings
    .filter((l) => l.status === "available" && listingAgeDays(state, l) > days && !materialById(state, l.materialId).structural)
    .sort((a, b) => listingAgeDays(state, b) - listingAgeDays(state, a));
  const offered = state.listings.filter((l) => l.status === "community");

  return (
    <>
      <PageHeader
        title="Community route"
        description={`If no site claims leftover material within ${days} days, offer it to a community project nearby instead of throwing it away.`}
      />
      <div className="mb-6 flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">Simulated.</span> The projects below are examples. No school, hall, garden or other organisation has agreed to take part. Structural items are never offered.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="font-bold">Leftovers ready to offer</h2>
          {eligible.length === 0 ? (
            <EmptyState icon={HandHeart} title="Nothing eligible right now" description={`Material shows up here once nobody has claimed it for ${days} days.`} />
          ) : (
            eligible.map((l) => {
              const m = materialById(state, l.materialId);
              const projects = projectTypes.filter((p) => p.wants.includes(m.category));
              return (
                <Card key={l.id} className="py-4">
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {fmtNum(l.qty)} {m.unit} at {siteName(state, l.siteId)}, {fmtRm(listingValueRm(state, l))}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge tone="warning">{listingAgeDays(state, l)} days</StatusBadge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" disabled={projects.length === 0}>
                            <HandHeart aria-hidden /> Offer
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Simulated projects in {siteName(state, l.siteId)}</DropdownMenuLabel>
                          {projects.map((p) => (
                            <DropdownMenuItem
                              key={p.kind}
                              onSelect={() => {
                                dispatch({ type: "offerCommunity", listingId: l.id, projectId: p.kind });
                                toast.success(`Offered to ${p.label.toLowerCase()} (simulated)`);
                              }}
                            >
                              <p.icon aria-hidden /> {p.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Offered so far</CardTitle>
            <CardDescription>Simulated offers in this demo.</CardDescription>
          </CardHeader>
          <CardContent>
            {offered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No offers yet.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {offered.map((l) => {
                  const o = state.communityOffers.find((x) => x.listingId === l.id);
                  const p = projectTypes.find((x) => x.kind === o?.projectId);
                  return (
                    <li key={l.id}>
                      <p className="font-medium">{materialById(state, l.materialId).name}</p>
                      <p className="text-muted-foreground">
                        {p?.label}, {siteName(state, l.siteId)}
                        {o && `, ${fmtDate(o.at)}`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
