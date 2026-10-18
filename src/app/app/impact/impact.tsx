"use client";

import { HandHeart, TriangleAlert } from "lucide-react";
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
import { ProvenanceTag } from "@/components/explain/certainty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { materialById, siteName } from "@/lib/engine/context";
import { impactSummary, savingsByCategory, savingsByMonth, savingsByTownship, scaleProjection } from "@/lib/engine/impact";
import { impactStages } from "@/lib/engine/queue";
import { fmtDate, fmtNum, fmtPct, fmtRm, fmtShortDate } from "@/lib/format";
import { useStore } from "@/lib/store";

const axis = { fontSize: 12, fill: "var(--muted-foreground)" };
const rmShort = (v: number) => (v >= 1000 ? `RM ${fmtNum(v / 1000, v >= 10000 ? 0 : 1)}k` : `RM ${fmtNum(v)}`);

export function Impact() {
  const { state, ready } = useStore();
  const s = useMemo(() => impactSummary(state), [state]);
  const stages = useMemo(() => impactStages(state), [state]);
  const ledger = useMemo(() => [...s.completed].sort((a, b) => (b.t.completedAt ?? "").localeCompare(a.t.completedAt ?? "")), [s]);
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
        description={`What reuse has saved across ${state.sites.length} townships up to ${fmtDate(state.today)}. All figures use simulated data, and carbon figures are rough estimates.`}
      />

      <div data-demo="impact-kpis" className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3">
        <KpiCard label="RM saved, estimated" value={fmtRm(s.savedRm)} trend={months.map((m) => m.cumulativeRm)} hint={`From ${s.completed.length} finished transfers, using estimated prices`} tone="success" action={<Explain title="RM saved" iconOnly lines={["Sum over completed transfers of (quantity × unit cost) minus haul cost.", "Unit costs and haul rate come from the assumptions page.", ...s.completed.slice(-3).map((x) => `${materialById(state, x.t.materialId).name}: ${fmtRm(x.s.savedRm)}.`)]} />} />
        <KpiCard label="Material reused" value={`${fmtNum(s.tonnes, 1)} t`} trend={months.reduce<number[]>((a, m) => [...a, (a.at(-1) ?? 0) + m.tonnes], [])} hint="Estimated weight of material reused" action={<Explain title="Tonnes diverted" iconOnly lines={["Sum over completed transfers of quantity × kg per unit, divided by 1,000."]} />} />
        <KpiCard label="CO2e avoided (illustrative)" value={`${fmtNum(s.co2eKg / 1000, 1)} t`} hint="A rough estimate, not verified" action={<Explain title="CO2e avoided" iconOnly lines={["Sum of kg diverted × kg CO2e per kg for that material.", "Factors are illustrative placeholders to confirm against ICE or supplier EPDs.", "Transport emissions are not deducted."]} />} />
        <KpiCard label="Active transfers" value={fmtNum(s.activeMatches)} hint="Not counted until completed" />
        <KpiCard label="Unclaimed surplus value" value={fmtRm(s.unclaimedValueRm)} hint={`${s.alerts.length} items over ${state.assumptions.global.unclaimedAlertDays} days`} tone="warning" />
        <KpiCard
          label="Forecast accuracy"
          value={s.accuracy === null ? "No data" : fmtPct(s.accuracy)}
          hint={`${s.outcomes} outcomes, ${simulatedCount} simulated. Too few real ones to rely on`}
          tone="forecast"
          action={<Explain title="Forecast accuracy" iconOnly lines={["Accuracy = 1 minus the mean absolute percentage error between forecast and actual surplus.", "Each error is capped at 100%.", `${simulatedCount} of ${s.outcomes} records are simulated history, seeded so the panel is not empty.`]} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="RM saved by month"
          description="Money saved each month, after transport costs."
          table={{ headers: ["Month", "RM saved", "Cumulative"], rows: months.map((m) => [m.month, fmtRm(m.savedRm), fmtRm(m.cumulativeRm)]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={rmShort} width={68} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={fmtRm} />} />
              <Bar isAnimationActive={false} dataKey="savedRm" name="RM saved" fill="var(--chart-1)" radius={[2, 2, 0, 0]} maxBarSize={36} />
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
              <YAxis type="category" dataKey="township" interval={0} tick={axis} tickLine={false} axisLine={false} width={150} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={fmtRm} />} />
              <Bar isAnimationActive={false} dataKey="savedRm" name="RM saved" fill="var(--chart-1)" radius={[0, 2, 2, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="RM saved by material"
          description="What kind of material was reused."
          table={{ headers: ["Category", "RM saved", "Tonnes"], rows: cats.map((c) => [c.category, fmtRm(c.savedRm), fmtNum(c.tonnes, 1)]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cats} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tick={axis} tickLine={false} axisLine={false} tickFormatter={rmShort} />
              <YAxis type="category" dataKey="category" interval={0} tick={axis} tickLine={false} axisLine={false} width={150} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={fmtRm} />} />
              <Bar isAnimationActive={false} dataKey="savedRm" name="RM saved" fill="var(--chart-1)" radius={[0, 2, 2, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Forecast versus actual surplus"
          description="Each pair compares what we expected with what was actually left."
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
              <Bar isAnimationActive={false} dataKey="Forecast" fill="var(--chart-2)" radius={[2, 2, 0, 0]} maxBarSize={14} />
              <Bar isAnimationActive={false} dataKey="Actual" fill="var(--chart-1)" radius={[2, 2, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section id="ledger" aria-labelledby="ledger-h" className="mt-6 scroll-mt-20 rounded-2xl bg-card shadow-card">
        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <div>
            <h2 id="ledger-h" className="font-semibold">
              Impact ledger
            </h2>
            <p className="text-xs text-muted-foreground">Every completed transfer behind the totals above. Totals are the column sums, so they reconcile.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <ProvenanceTag provenance="recorded" /> quantity
            <ProvenanceTag provenance="calculated" /> money and weight
            <ProvenanceTag provenance="assumption" /> carbon factor
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium sm:px-5">Completed</th>
                <th className="px-3 py-2 font-medium">Transfer</th>
                <th className="px-3 py-2 text-right font-medium">Quantity</th>
                <th className="px-3 py-2 text-right font-medium">Purchase avoided</th>
                <th className="px-3 py-2 text-right font-medium">Haulage</th>
                <th className="px-3 py-2 text-right font-medium">Saving</th>
                <th className="px-3 py-2 text-right font-medium">Weight</th>
                <th className="px-4 py-2 text-right font-medium sm:px-5">CO2e</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ledger.map(({ t, s: sv }) => {
                const m = materialById(state, t.materialId);
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-muted-foreground sm:px-5">{fmtDate(t.completedAt!)}</td>
                    <td className="px-3 py-2">
                      <Link href={`/app/transfers?transfer=${t.id}`} className="font-medium hover:underline">
                        {m.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {siteName(state, t.fromSiteId)} to {siteName(state, t.toSiteId)}
                      </span>
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-2 text-right whitespace-nowrap">
                      {fmtNum(t.qty)} {m.unit}
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-2 text-right">{fmtRm(sv.valueRm)}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2 text-right text-muted-foreground">−{fmtRm(sv.haulRm)}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2 text-right font-medium">{fmtRm(sv.savedRm)}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2 text-right">{fmtNum(sv.tonnes, 2)} t</td>
                    <td className="tabular whitespace-nowrap px-4 py-2 text-right sm:px-5">{fmtNum(sv.co2eKg)} kg</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 bg-muted/30 font-semibold">
              <tr>
                <td className="px-4 py-2 sm:px-5" colSpan={3}>
                  Total, {ledger.length} transfers
                </td>
                <td className="tabular whitespace-nowrap px-3 py-2 text-right">{fmtRm(ledger.reduce((a, x) => a + x.s.valueRm, 0))}</td>
                <td className="tabular whitespace-nowrap px-3 py-2 text-right text-muted-foreground">−{fmtRm(ledger.reduce((a, x) => a + x.s.haulRm, 0))}</td>
                <td className="tabular whitespace-nowrap px-3 py-2 text-right">{fmtRm(s.savedRm)}</td>
                <td className="tabular whitespace-nowrap px-3 py-2 text-right">{fmtNum(s.tonnes, 1)} t</td>
                <td className="tabular whitespace-nowrap px-4 py-2 text-right sm:px-5">{fmtNum(s.co2eKg)} kg</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="grid gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:grid-cols-3 sm:px-5">
          <p>
            <span className="font-medium text-foreground">Not counted yet:</span> {fmtNum(stages.inProgress.count)} transfers in progress ({fmtRm(stages.inProgress.savedRm)}) and {fmtNum(stages.onForecast.count)} held on forecast (
            {fmtRm(stages.onForecast.savedRm)}). They join the ledger only when completed.
          </p>
          <p>
            <span className="font-medium text-foreground">Method:</span> saving = quantity × assumed unit cost − loads × straight-line km × 2 × haul rate. Weight = quantity × assumed kg per unit.
          </p>
          <p>
            <span className="font-medium text-foreground">Carbon:</span> weight × placeholder factor per material, transport not deducted. Illustrative only, not a verified reduction.
          </p>
        </div>
      </section>

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
          description={`So far each township saves about ${fmtRm(scale.perTownshipPerYear)} a year. We assume 3% more matches for every extra township. SDP alone has 27 active townships, and the same approach works for any developer in Malaysia.`}
          table={{ headers: ["Townships", "Annual RM saved"], rows: scale.points.map((p) => [p.townships, fmtRm(p.annualRm)]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scale.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="townships" tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => (v === 1 ? "1 town" : `${v} towns`)} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={rmShort} width={68} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip format={fmtRm} />} labelFormatter={(v) => `${v} townships`} />
              <Bar isAnimationActive={false} dataKey="annualRm" name="Annual RM saved" fill="var(--chart-1)" radius={[2, 2, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
