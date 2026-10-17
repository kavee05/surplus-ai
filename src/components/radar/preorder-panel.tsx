"use client";

import { CalendarClock, Check, Leaf, PackageCheck, Scale, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Explain } from "@/components/app/explain";
import { riskTone, StatusBadge } from "@/components/app/status-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HERO_FORECAST_ID, HERO_NEED_ID } from "@/data/seed";
import { forecastReservation, HERO_TRANSFER_ID } from "@/lib/actions";
import { materialById, siteName } from "@/lib/engine/context";
import type { PreOrderInput, PreOrderResult } from "@/lib/engine/preorder";
import { fmtDate, fmtNum, fmtRm, fmtTonnes } from "@/lib/format";
import { useNewId, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PreOrderPanel({
  input,
  setInput,
  result,
}: {
  input: PreOrderInput;
  setInput: (i: PreOrderInput) => void;
  result: PreOrderResult;
}) {
  const { state, dispatch, person } = useStore();
  const newId = useNewId();
  const mat = materialById(state, input.materialId);
  const sitePhases = state.phases.filter((p) => p.siteId === input.siteId && p.status !== "completed");
  const reserving = result.forecasts.filter((c) => c.reservedQty > 0);
  const isHero = input.siteId === "bbr" && input.materialId === "tile-porcelain";

  const reserve = () => {
    for (const c of reserving.filter((x) => x.alreadyReserved === 0)) {
      const heroCase = isHero && c.forecast.id === HERO_FORECAST_ID;
      dispatch({
        type: "createTransfer",
        transfer: forecastReservation({
          id: heroCase ? HERO_TRANSFER_ID : newId("T"),
          forecastId: c.forecast.id,
          fromSiteId: c.forecast.siteId,
          toSiteId: input.siteId,
          materialId: input.materialId,
          qty: c.reservedQty,
          needId: heroCase ? HERO_NEED_ID : undefined,
          toPhaseId: input.phaseId,
          by: person.name,
          today: state.today,
          structural: mat.structural,
        }),
      });
    }
    toast.success(`Reserved ${fmtNum(result.reservedForecast)} ${mat.unit} against forecast surplus`, {
      description: `Order ${fmtNum(result.orderNow)} now. Confirm or top up by ${fmtDate(result.decisionDate)}.`,
    });
  };

  const total = Math.max(1, input.qty);
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Form */}
      <form data-demo="preorder-form" className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card sm:p-5 lg:col-span-2" onSubmit={(e) => e.preventDefault()} aria-label="Pre-Order Check inputs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Field label="Buying site" id="po-site">
            <Select
              value={input.siteId}
              onValueChange={(v) => {
                const ph = state.phases.find((p) => p.siteId === v && p.status !== "completed");
                setInput({ ...input, siteId: v, phaseId: ph?.id ?? "" });
              }}
            >
              <SelectTrigger id="po-site" className="w-full">
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
          </Field>
          <Field label="Phase" id="po-phase">
            <Select value={input.phaseId} onValueChange={(v) => setInput({ ...input, phaseId: v })}>
              <SelectTrigger id="po-phase" className="w-full">
                <SelectValue placeholder="Choose a phase" />
              </SelectTrigger>
              <SelectContent>
                {sitePhases.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Material" id="po-material">
          <Select value={input.materialId} onValueChange={(v) => setInput({ ...input, materialId: v })}>
            <SelectTrigger id="po-material" className="w-full">
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
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Quantity (${mat.unit})`} id="po-qty">
            <Input
              id="po-qty"
              type="number"
              inputMode="numeric"
              min={1}
              value={input.qty}
              onChange={(e) => setInput({ ...input, qty: Math.max(0, Number(e.target.value) || 0) })}
              className="tabular"
            />
          </Field>
          <Field label="Needed by" id="po-date">
            <Input id="po-date" type="date" value={input.neededBy} onChange={(e) => e.target.value && setInput({ ...input, neededBy: e.target.value })} />
          </Field>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/50 p-3">
          <div>
            <Label htmlFor="po-conservative" className="font-medium">
              Conservative mode
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">Reserve only the confidence-weighted quantity (forecast × confidence).</p>
          </div>
          <Switch id="po-conservative" checked={!!input.conservative} onCheckedChange={(v) => setInput({ ...input, conservative: v })} />
        </div>
        <p className="text-xs text-muted-foreground">
          Max haul {state.assumptions.global.maxHaulKm} km, handling buffer {state.assumptions.global.handlingBufferDays} days, supplier lead time {result.leadTimeDays} days.{" "}
          <Link href="/app/settings" className="font-medium text-brand underline-offset-2 hover:underline">
            Edit assumptions
          </Link>
        </p>
      </form>

      {/* Result */}
      <div data-demo="preorder-result" className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card sm:p-5 lg:col-span-3" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Recommendation</h3>
            {result.risk && <StatusBadge tone={riskTone(result.risk)}>{result.risk} risk, {result.confidence?.toFixed(2)} confidence</StatusBadge>}
            {input.conservative && <StatusBadge tone="brand">Conservative</StatusBadge>}
          </div>
          <Explain title="Pre-Order Check, step by step" lines={result.explanation} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {result.listingQty > 0 && (
            <Figure label={result.fromListings.some((a) => a.secured) ? "Reserved, logged surplus" : "From logged surplus"} value={`${fmtNum(result.listingQty)}`} unit={mat.unit} icon={PackageCheck} tone="brand" />
          )}
          <Figure label="Reserve from forecast" value={fmtNum(result.reservedForecast)} unit={mat.unit} icon={Scale} tone="forecast" big />
          <Figure label="Order now" value={fmtNum(result.orderNow)} unit={mat.unit} icon={ShoppingCart} tone="neutral" big />
          <div className={cn("col-span-2 flex flex-col justify-between rounded-lg border p-3 sm:col-span-1", result.listingQty > 0 && "sm:col-span-3")}>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden /> Decision date
            </span>
            <span className="mt-1 font-semibold">{fmtDate(result.decisionDate)}</span>
            <span className="text-xs text-muted-foreground">Confirm the forecast or top up</span>
          </div>
        </div>

        {/* Split bar */}
        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${fmtNum(result.listingQty)} from logged surplus, ${fmtNum(result.reservedForecast)} reserved from forecast, ${fmtNum(result.orderNow)} to order now`}>
            <span className="bg-brand" style={{ width: pct(result.listingQty) }} />
            <span className="bg-forecast" style={{ width: pct(result.reservedForecast) }} />
            <span className="bg-[var(--stone-300)]" style={{ width: pct(result.orderNow) }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>
              {fmtNum(input.qty)} {mat.unit} needed by {fmtDate(input.neededBy)}
            </span>
            <span>{Math.round(((result.listingQty + result.reservedForecast) / total) * 100)}% from surplus</span>
          </div>
        </div>

        {/* Savings */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Saving icon={Wallet} label="Estimated RM saved" value={fmtRm(result.expected.savedRm)} lines={[...result.fromListings.flatMap((a) => a.savings.explanation), ...reserving.flatMap((c) => c.savings.explanation)]} />
          <Saving icon={Scale} label="Tonnes diverted" value={fmtTonnes(result.expected.tonnes)} lines={[...result.fromListings.flatMap((a) => a.savings.explanation.slice(3, 4)), ...reserving.flatMap((c) => c.savings.explanation.slice(3, 4))]} />
          <Saving icon={Leaf} label="CO2e avoided (illustrative)" value={`${fmtNum(result.expected.co2eKg / 1000, 1)} t`} lines={[...result.fromListings.flatMap((a) => a.savings.explanation.slice(4)), ...reserving.flatMap((c) => c.savings.explanation.slice(4))]} />
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/60 p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Best case: full forecast arrives</p>
            <p className="tabular font-medium">
              {fmtNum(result.bestCase.qty)} {mat.unit}, {fmtRm(result.bestCase.savedRm)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Worst case: forecast × confidence</p>
            <p className="tabular font-medium">
              {fmtNum(result.worstCase.qty)} {mat.unit}, {fmtRm(result.worstCase.savedRm)}
            </p>
          </div>
        </div>

        {/* Sources */}
        {result.forecasts.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Ranked forecast sources</h4>
            <ul className="flex flex-col gap-2">
              {result.forecasts.map((c) => (
                <li key={c.forecast.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="tabular grid size-10 shrink-0 place-items-center rounded-lg bg-forecast-soft text-sm font-semibold text-forecast-ink" title="Score">
                    {c.score.toFixed(2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {siteName(state, c.forecast.siteId)}, {fmtNum(c.availableQty)} {mat.unit}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      From {fmtDate(c.forecast.availableFrom)}, {fmtNum(c.distanceKm, 1)} km, {c.forecast.confidence.toFixed(2)} confidence
                    </p>
                  </div>
                  <Explain title={`Score for ${siteName(state, c.forecast.siteId)}`} lines={[...c.explanation, ...c.forecast.explanation]} iconOnly />
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.exclusions.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="ex" className="border-b-0">
              <AccordionTrigger className="py-2 text-sm">Why {result.exclusions.length} other sources were not used</AccordionTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-2">
                  {result.exclusions.map((e) => (
                    <li key={e.id} className="flex gap-2 text-sm">
                      <StatusBadge tone={e.kind === "forecast" ? "forecast" : "neutral"} className="mt-0.5">
                        {e.kind === "forecast" ? "Forecast" : "Logged"}
                      </StatusBadge>
                      <span>
                        <span className="font-medium">
                          {siteName(state, e.siteId)}, {fmtNum(e.qty)} {mat.unit}.
                        </span>{" "}
                        <span className="text-muted-foreground">{e.reason}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Estimates from simulated data. Forecasts are not guaranteed.</p>
          {(reserving.length > 0 || result.securedQty > 0) &&
            (result.securedQty > 0 ? (
              <Button variant="secondary" asChild data-demo="reserve-button">
                <Link href="/app/transfers">
                  <Check aria-hidden /> {fmtNum(result.securedQty)} reserved. View transfer
                </Link>
              </Button>
            ) : (
              <Button onClick={reserve} data-demo="reserve-button">
                <Scale aria-hidden /> Reserve {fmtNum(result.reservedForecast)} from forecast
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Figure({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  big,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "forecast" | "neutral" | "brand";
  big?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border p-3",
        tone === "forecast" && "border-forecast/50 bg-forecast-soft",
        tone === "brand" && "border-brand/25 bg-brand-soft",
      )}
    >
      <span className={cn("flex items-center gap-1.5 text-xs", tone === "forecast" ? "text-forecast-ink" : "text-muted-foreground")}>
        <Icon className="size-3.5" aria-hidden /> {label}
      </span>
      <span className={cn("tabular mt-1 font-semibold tracking-tight", big ? "text-3xl" : "text-xl")}>{value}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}

function Saving({ icon: Icon, label, value, lines }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; lines: string[] }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border p-3">
      <div className="min-w-0">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" aria-hidden /> {label}
        </span>
        <span className="tabular mt-1 block text-lg font-semibold">{value}</span>
      </div>
      <Explain title={label} lines={lines.length ? lines : ["Nothing is reserved, so there is no saving yet."]} iconOnly />
    </div>
  );
}
