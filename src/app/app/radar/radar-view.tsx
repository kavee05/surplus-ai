"use client";

import { Check, Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge } from "@/components/app/status-badge";
import { ExplanationPanel } from "@/components/explain/explanation-panel";
import { AskBar } from "@/components/ai/ask-bar";
import { PreOrderPanel } from "@/components/radar/preorder-panel";
import { RadarLegend, RadarTimeline } from "@/components/radar/radar-timeline";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HERO_INPUT } from "@/data/initial";
import { materialById, siteName } from "@/lib/engine/context";
import { preOrderCheck, type PreOrderInput } from "@/lib/engine/preorder";
import { explainForecast } from "@/lib/explain/builders";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useForecasts, useStore } from "@/lib/store";
import type { Forecast } from "@/lib/types";

/** Pre-fill the check from an Ask Surplus AI link, if every field is valid. */
function inputFromParams(
  params: URLSearchParams,
  state: {
    materials: { id: string }[];
    sites: { id: string }[];
    phases: { id: string; siteId: string }[];
  },
): PreOrderInput | null {
  const m = params.get("material"),
    si = params.get("site"),
    ph = params.get("phase"),
    q = Number(params.get("qty")),
    by = params.get("by");
  if (!m || !si || !ph || !by || !(q > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(by))
    return null;
  if (
    !state.materials.some((x) => x.id === m) ||
    !state.phases.some((x) => x.id === ph && x.siteId === si)
  )
    return null;
  return {
    materialId: m,
    siteId: si,
    phaseId: ph,
    qty: Math.round(q),
    neededBy: by,
    conservative: false,
  };
}

export function RadarView() {
  const { state, ready } = useStore();
  const forecasts = useForecasts();
  const params = useSearchParams();
  const [input, setInput] = useState<PreOrderInput>(
    () =>
      inputFromParams(params, state) ?? { ...HERO_INPUT, conservative: false },
  );
  const [materialFilter, setMaterialFilter] = useState<string>("follow");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Forecast | null>(null);
  const linked = params.get("forecast");
  useEffect(() => {
    if (!linked || !ready) return;
    const f = forecasts.find((x) => x.id === linked);
    if (f) setSelected(f);
  }, [linked, ready, forecasts]);

  const result = useMemo(() => preOrderCheck(state, input), [state, input]);
  const material =
    materialFilter === "follow" ? input.materialId : materialFilter;
  const topForecast = result.forecasts.find((c) => c.reservedQty > 0)?.forecast;

  if (!ready) return <PageSkeleton cards={0} />;

  return (
    <>
      <PageHeader
        title="Surplus Radar"
        description="See which sites will have material left over, before it happens. Check here before you buy, and reserve what is coming."
      />

      <AskBar onApply={setInput} className="mb-8" />

      <section
        aria-labelledby="timeline-heading"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="timeline-heading" className="text-lg font-bold">
              Phases and forecast surplus
            </h2>
            <p className="text-sm text-muted-foreground">
              Tap a dot to see how we worked it out.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Filter
              className="mb-2 hidden size-4 text-muted-foreground sm:block"
              aria-hidden
            />
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="f-material"
                className="text-xs text-muted-foreground"
              >
                Material
              </Label>
              <Select value={materialFilter} onValueChange={setMaterialFilter}>
                <SelectTrigger id="f-material" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow">
                    Same as Pre-Order Check
                  </SelectItem>
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
        <h2 id="preorder-heading" className="text-lg font-bold">
          Pre-Order Check
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Tell us what you are about to buy. We use recorded leftovers first, then leftovers other sites expect to have.
        </p>
        <PreOrderPanel input={input} setInput={setInput} result={result} />
      </section>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
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
  const e = useMemo(() => explainForecast(f, state), [f, state]);
  const value = f.qty * state.assumptions.materials[f.materialId].unitCostRm;
  return (
    <>
      <SheetHeader>
        <SheetTitle>{m.name}</SheetTitle>
        <SheetDescription>
          {siteName(state, f.siteId)}, {phase.name}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-6 pb-8">
        <div className="flex flex-wrap gap-2">
          {f.status === "Forecast" ? (
            <StatusBadge tone="forecast">Forecast, not yet logged</StatusBadge>
          ) : (
            <StatusBadge tone="success">
              <Check className="size-3" />
              {f.status} by actual surplus
            </StatusBadge>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border text-sm">
          {[
            ["Expected surplus", `${fmtNum(f.qty)} ${m.unit}`],
            ["Value at new price", fmtRm(value)],
            ["Available from", fmtDate(f.availableFrom)],
            ["Phase progress", `${phase.progressPct}%`],
          ].map(([k, v]) => (
            <div key={k} className="bg-card p-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="tabular mt-1 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <ExplanationPanel e={e} defaultOpen={["calculation"]} />
      </div>
    </>
  );
}
