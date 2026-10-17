"use client";

import { ArrowLeftRight, Boxes, Gauge, HandHeart, Leaf, Scale, TriangleAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, ChartTooltip } from "@/components/app/chart-card";
import { Explain } from "@/components/app/explain";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { SimulatedBadge } from "@/components/app/simulated-badge";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { materialById, siteName } from "@/lib/engine/context";
import { impactSummary, savingsByCategory, savingsByMonth, savingsByTownship, scaleProjection } from "@/lib/engine/impact";
import { fmtDate, fmtNum, fmtPct, fmtRm, fmtShortDate } from "@/lib/format";
import { useStore } from "@/lib/store";

const axis = { fontSize: 12, fill: "var(--muted-foreground)" };
const rmShort = (v: number) => (v >= 1000 ? `RM ${fmtNum(v / 1000, v >= 10000 ? 0 : 1)}k` : `RM ${fmtNum(v)}`);

export function Impact() {
  const { state, ready } = useStore();
  const s = useMemo(() => impactSummary(state), [state]);
  const months = useMemo(() => savingsByMonth(state), [state]);
  const towns = useMemo(() => savingsByTownship(state), [state]);
  const cats = useMemo(() => savingsByCategory(state), [state]);
  const scale = useMemo(() => scaleProjection(state), [state]);
  const acc = useMemo(
    () =>
      [...state.outcomes]
        .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
        .map((o) => ({
          label: `${o.materialId ? materialById(state, o.materialId).name.split(" ").slice(0, 2).join(" ") : "Item"}, ${fmtShortDate(o.loggedAt)}`,
          Forecast: o.forecastQty,
          Actual: o.actualQty,
          o,
        })),
    [state],
  );

  if (!ready) return <PageSkeleton cards={6} />;
  const simulatedCount = state.outcomes.filter((o) => o.simulated).length;

  return (
    <>
      <PageHeader
        title="Impact"
        description={`Results across ${state.sites.length} townships up to ${fmtDate(state.today)}. Every figure here comes from simulated data; carbon figures are illustrative.`}
      />

      <div data-demo="impact-kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="RM saved" value={fmtRm(s.savedRm)} hint={`${s.completed.length} completed transfers, net of haulage`} icon={Wallet} tone="success" action={<Explain title="RM saved" iconOnly lines={["Sum over completed transfers of (quantity × unit cost) minus haul cost.", "Unit costs and haul rate come from the assumptions page.", ...s.completed.slice(-3).map((x) => `${materialById(state, x.t.materialId).name}: ${fmtRm(x.s.savedRm)}.`)]} />} />
        <KpiCard label="Tonnes diverted" value={`${fmtNum(s.tonnes, 1)} t`} hint="Kept out of disposal" icon={Scale} action={<Explain title="Tonnes diverted" iconOnly lines={["Sum over completed transfers of quantity × kg per unit, divided by 1,000."]} />} />
        <KpiCard label="CO2e avoided (illustrative)" value={`${fmtNum(s.co2eKg / 1000, 1)} t`} hint="Embodied carbon of new material not bought" icon={Leaf} action={<Explain title="CO2e avoided" iconOnly lines={["Sum of kg diverted × kg CO2e per kg for that material.", "Factors are illustrative placeholders to confirm against ICE or supplier EPDs.", "Transport emissions are not deducted."]} />} />
        <KpiCard label="Active matches" value={fmtNum(s.activeMatches)} hint="Matched, held, reserved or collected" icon={ArrowLeftRight} />
        <KpiCard label="Unclaimed surplus value" value={fmtRm(s.unclaimedValueRm)} hint={`${s.alerts.length} items over ${state.assumptions.global.unclaimedAlertDays} days`} icon={Boxes} tone="warning" />
        <KpiCard
          label="Forecast accuracy"
          value={s.accuracy === null ? "No data" : fmtPct(s.accuracy)}
          hint={`${s.confirmed} of ${s.outcomes} confirmed; ${simulatedCount} simulated history`}
          icon={Gauge}
          tone="forecast"
          action={<Explain title="Forecast accuracy" iconOnly lines={["Accuracy = 1 minus the mean absolute percentage error between forecast and actual surplus.", "Each error is capped at 100%.", `${simulatedCount} of ${s.outcomes} records are simulated history, seeded so the panel is not empty.`]} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="RM saved by month"
          description="Completed transfers, net of haulage."
          table={{ headers: ["Month", "RM saved", "Cumulative"], rows: months.map((m) => [m.month, fmtRm(m.savedRm), fmtRm(m.cumulativeRm)]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={rmShort} width={68} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={fmtRm} />} />
              <Bar dataKey="savedRm" name="RM saved" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="RM saved by source township"
          description="Where reused material came from."
          table={{ headers: ["Township", "RM saved", "Tonnes"], rows: towns.map((t) => [t.township, fmtRm(t.savedRm), fmtNum(t.tonnes, 1)]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={towns} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tick={axis} tickLine={false} axisLine={false} tickFormatter={rmShort} />
              <YAxis type="category" dataKey="township" tick={axis} tickLine={false} axisLine={false} width={150} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={fmtRm} />} />
              <Bar dataKey="savedRm" name="RM saved" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="RM saved by material"
          description="Category of the reused material."
          table={{ headers: ["Category", "RM saved", "Tonnes"], rows: cats.map((c) => [c.category, fmtRm(c.savedRm), fmtNum(c.tonnes, 1)]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cats} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tick={axis} tickLine={false} axisLine={false} tickFormatter={rmShort} />
              <YAxis type="category" dataKey="category" tick={axis} tickLine={false} axisLine={false} width={150} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={fmtRm} />} />
              <Bar dataKey="savedRm" name="RM saved" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Forecast versus actual surplus"
          description="Each pair is one forecast and the surplus later logged."
          badge={<SimulatedBadge label={`${simulatedCount} simulated`} />}
          table={{ headers: ["Item", "Forecast", "Actual", "Status"], rows: acc.map((a) => [a.label, a.Forecast, a.Actual, a.o.status + (a.o.simulated ? " (simulated)" : "")]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={acc} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={false} axisLine={false} height={4} />
              <YAxis tick={axis} tickLine={false} axisLine={false} width={44} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={(v) => fmtNum(v)} />} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Forecast" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={14} />
              <Bar dataKey="Actual" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Surplus unclaimed for more than {state.assumptions.global.unclaimedAlertDays} days.</CardDescription>
          </CardHeader>
          <CardContent>
            {s.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No surplus has been waiting too long.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {s.alerts.slice(0, 6).map(({ listing, age, valueRm }) => (
                  <li key={listing.id} className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium">{materialById(state, listing.materialId).name}</p>
                      <p className="text-xs text-muted-foreground">
                        {siteName(state, listing.siteId)}, {fmtRm(valueRm)}
                      </p>
                    </div>
                    <StatusBadge tone="warning">{age} days</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/app/community">
                <HandHeart aria-hidden /> Offer to community projects
              </Link>
            </Button>
          </CardContent>
        </Card>

        <ChartCard
          className="lg:col-span-3"
          title="Value as more townships join"
          badge={<SimulatedBadge label="Simulated projection" />}
          description={`Average so far: ${fmtRm(scale.perTownshipPerYear)} a year per township, plus an assumed 3% more matches for each extra township. SDP reports 27 active townships.`}
          table={{ headers: ["Townships", "Annual RM saved"], rows: scale.points.map((p) => [p.townships, fmtRm(p.annualRm)]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scale.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="townships" tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => (v === 1 ? "1 town" : `${v} towns`)} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={rmShort} width={68} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={fmtRm} />} labelFormatter={(v) => `${v} townships`} />
              <Bar dataKey="annualRm" name="Annual RM saved" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
