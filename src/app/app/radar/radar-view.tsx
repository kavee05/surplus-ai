"use client";

import { Check, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge } from "@/components/app/status-badge";
import { PreOrderPanel } from "@/components/radar/preorder-panel";
import { RadarLegend, RadarTimeline } from "@/components/radar/radar-timeline";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HERO_INPUT } from "@/data/initial";
import { materialById, siteName } from "@/lib/engine/context";
import { preOrderCheck, type PreOrderInput } from "@/lib/engine/preorder";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useForecasts, useStore } from "@/lib/store";
import type { Forecast } from "@/lib/types";

export function RadarView() {
  const { state, ready } = useStore();
  const forecasts = useForecasts();
  const [input, setInput] = useState<PreOrderInput>({ ...HERO_INPUT, conservative: false });
  const [materialFilter, setMaterialFilter] = useState<string>("follow");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Forecast | null>(null);

  const result = useMemo(() => preOrderCheck(state, input), [state, input]);
  const material = materialFilter === "follow" ? input.materialId : materialFilter;
  const topForecast = result.forecasts.find((c) => c.reservedQty > 0)?.forecast;

  if (!ready) return <PageSkeleton cards={0} />;

  return (
    <>
      <PageHeader
        title="Surplus Radar"
        description="Surplus forecast from ordered versus planned quantities on every phase. Check here before you buy, and reserve what is coming."
      />

      <section aria-labelledby="timeline-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="timeline-heading" className="font-semibold">
              Phases and forecast surplus
            </h2>
            <p className="text-sm text-muted-foreground">Select a marker to see how the forecast was calculated.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Filter className="mb-2 hidden size-4 text-muted-foreground sm:block" aria-hidden />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="f-material" className="text-xs text-muted-foreground">
                Material
              </Label>
              <Select value={materialFilter} onValueChange={setMaterialFilter}>
                <SelectTrigger id="f-material" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow">Same as Pre-Order Check</SelectItem>
                  <SelectItem value="all">All materials</SelectItem>
                  {state.materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="f-site" className="text-xs text-muted-foreground">
                Township
              </Label>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger id="f-site" className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All townships</SelectItem>
                  {state.sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.township}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div data-demo="radar-timeline">
          <RadarTimeline
            data={state}
            forecasts={forecasts}
            materialId={material}
            siteId={siteFilter}
            need={input}
            highlightForecastId={topForecast?.id}
            onSelect={setSelected}
          />
        </div>
        <RadarLegend today={state.today} />
      </section>

      <section aria-labelledby="preorder-heading" className="mt-10">
        <h2 id="preorder-heading" className="font-semibold">
          Pre-Order Check
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">Enter what you are about to buy. Logged surplus is used first, then forecast surplus from other sites.</p>
        <PreOrderPanel input={input} setInput={setInput} result={result} />
      </section>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && <ForecastDetail f={selected} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function ForecastDetail({ f }: { f: Forecast }) {
  const { state } = useStore();
  const m = materialById(state, f.materialId);
  const phase = state.phases.find((p) => p.id === f.phaseId)!;
  const value = f.qty * state.assumptions.materials[f.materialId].unitCostRm;
  return (
    <>
      <SheetHeader>
        <SheetTitle>{m.name}</SheetTitle>
        <SheetDescription>
          {siteName(state, f.siteId)}, {phase.name}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-4 pb-6">
        <div className="flex flex-wrap gap-2">
          {f.status === "Forecast" ? <StatusBadge tone="forecast">Forecast, estimate only</StatusBadge> : <StatusBadge tone="success"><Check className="size-3" />{f.status}</StatusBadge>}
          <StatusBadge>{f.confidence.toFixed(2)} confidence</StatusBadge>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Expected surplus</dt>
            <dd className="tabular mt-1 font-semibold">
              {fmtNum(f.qty)} {m.unit}
            </dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Value at new price</dt>
            <dd className="tabular mt-1 font-semibold">{fmtRm(value)}</dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Available from</dt>
            <dd className="mt-1 font-semibold">{fmtDate(f.availableFrom)}</dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Phase progress</dt>
            <dd className="tabular mt-1 font-semibold">{phase.progressPct}%</dd>
          </div>
        </dl>
        <div>
          <h3 className="mb-2 text-sm font-medium">How this was calculated</h3>
          <ol className="flex flex-col gap-2.5">
            {f.explanation.map((l, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs text-muted-foreground">{i + 1}</span>
                <span className="pt-0.5 text-pretty">{l}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Simulated data. A forecast is an estimate from ordered and planned quantities. It becomes Confirmed or Revised only when the site logs the actual surplus.
        </p>
      </div>
    </>
  );
}
