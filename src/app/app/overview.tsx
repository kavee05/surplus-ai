"use client";

import { ArrowLeftRight, Boxes, Camera, ClipboardList, Radar, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { materialById, siteName } from "@/lib/engine/context";
import { impactSummary } from "@/lib/engine/impact";
import { diffDays, fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useForecasts, useStore } from "@/lib/store";

export function Overview() {
  const { state, ready, person } = useStore();
  const forecasts = useForecasts();
  const impact = useMemo(() => impactSummary(state), [state]);

  const upcoming = useMemo(
    () =>
      forecasts
        .filter((f) => f.status === "Forecast" && diffDays(state.today, f.availableFrom) >= 0 && diffDays(state.today, f.availableFrom) <= 90)
        .map((f) => ({ f, value: f.qty * state.assumptions.materials[f.materialId].unitCostRm }))
        .sort((a, b) => b.value - a.value),
    [forecasts, state],
  );
  const openNeeds = state.needs.filter((n) => n.status === "open").length;

  if (!ready) return <PageSkeleton />;

  const primary =
    state.role === "engineer"
      ? { href: "/app/surplus/log", label: "Log surplus", icon: Camera }
      : state.role === "procurement"
        ? { href: "/app/radar", label: "Run a Pre-Order Check", icon: Radar }
        : { href: "/app/impact", label: "Open impact dashboard", icon: ArrowLeftRight };

  return (
    <>
      <PageHeader
        title={`Welcome back, ${person.name.split(" ")[0]}`}
        description={`${person.title}. Here is what is moving across the network on ${fmtDate(state.today)}.`}
        actions={
          <Button asChild>
            <Link href={primary.href}>
              <primary.icon aria-hidden /> {primary.label}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
        <KpiCard
          label="Forecast surplus, 90 days"
          value={fmtRm(upcoming.reduce((a, x) => a + x.value, 0))}
          hint={`${upcoming.length} forecasts, estimates only`}
          icon={Radar}
          tone="forecast"
        />
        <KpiCard label="Logged surplus unclaimed" value={fmtRm(impact.unclaimedValueRm)} hint={`${state.listings.filter((l) => l.status === "available").length} listings`} icon={Boxes} />
        <KpiCard label="Open needs" value={fmtNum(openNeeds)} hint="Waiting for a match" icon={ClipboardList} />
        <KpiCard label="Active transfers" value={fmtNum(impact.activeMatches)} hint="Matched to collected" icon={ArrowLeftRight} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Surplus on the way</CardTitle>
            <CardDescription>Forecast from ordered versus planned quantities. Reserve it before it is logged.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {upcoming.slice(0, 6).map(({ f, value }) => {
                const m = materialById(state, f.materialId);
                return (
                  <li key={f.id} className="flex items-center gap-3 py-3">
                    <span className="h-9 w-1 shrink-0 rounded-full bg-forecast" style={{ opacity: 0.35 + f.confidence * 0.65 }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fmtNum(f.qty)} {m.unit} at {siteName(state, f.siteId)}, from {fmtDate(f.availableFrom)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-sm font-medium">{fmtRm(value)}</p>
                      <p className="text-xs text-muted-foreground">{f.confidence.toFixed(2)} confidence</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button asChild variant="outline" className="mt-3 w-full sm:w-auto">
              <Link href="/app/radar">Open Surplus Radar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Surplus unclaimed for more than {state.assumptions.global.unclaimedAlertDays} days.</CardDescription>
          </CardHeader>
          <CardContent>
            {impact.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing is waiting too long. Good.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {impact.alerts.slice(0, 5).map(({ listing, age, valueRm }) => {
                  const m = materialById(state, listing.materialId);
                  return (
                    <li key={listing.id} className="flex items-start gap-3">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtNum(listing.qty)} {m.unit} at {siteName(state, listing.siteId)}, {fmtRm(valueRm)}
                        </p>
                      </div>
                      <Badge variant="outline" className="tabular shrink-0 border-warning/40 bg-warning-soft text-warning">
                        {age} days
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
              <Link href="/app/surplus">View inventory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
