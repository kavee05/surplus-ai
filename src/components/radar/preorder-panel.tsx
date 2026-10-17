"use client";

import { Check, Leaf, PackageCheck, Scale, ShoppingCart, ThumbsDown, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StatusBadge } from "@/components/app/status-badge";
import { CertaintyBadge } from "@/components/explain/certainty";
import { DecisionDialog, type DecisionMode } from "@/components/explain/decision-dialog";
import { ExplanationPanel } from "@/components/explain/explanation-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HERO_FORECAST_ID, HERO_NEED_ID } from "@/data/seed";
import { forecastReservation, HERO_TRANSFER_ID } from "@/lib/actions";
import { makeDecision } from "@/lib/decisions";
import { materialById } from "@/lib/engine/context";
import { explainPreOrder } from "@/lib/explain/builders";
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

  const e = useMemo(() => explainPreOrder(result, state), [result, state]);
  const [dialog, setDialog] = useState<DecisionMode | null>(null);
  const newHolds = reserving.filter((x) => x.alreadyReserved === 0);
  const subjectId = `${input.siteId}:${input.phaseId}:${input.materialId}`;
  const lastDecision = state.decisions.find((d) => d.kind === "preorder" && d.subjectId === subjectId);
  const subjectLabel = `Pre-Order Check, ${mat.name}`;

  const reserve = (qtyOverride?: number) => {
    for (const c of newHolds) {
      const heroCase = isHero && c.forecast.id === HERO_FORECAST_ID;
      const qty = newHolds.length === 1 && qtyOverride ? qtyOverride : c.reservedQty;
      dispatch({
        type: "createTransfer",
        transfer: forecastReservation({
          id: heroCase ? HERO_TRANSFER_ID : newId("T"),
          forecastId: c.forecast.id,
          fromSiteId: c.forecast.siteId,
          toSiteId: input.siteId,
          materialId: input.materialId,
          qty,
          needId: heroCase ? HERO_NEED_ID : undefined,
          toPhaseId: input.phaseId,
          by: person.name,
          today: state.today,
          structural: mat.structural,
        }),
      });
    }
    const modified = newHolds.length === 1 && qtyOverride !== undefined && qtyOverride !== newHolds[0].reservedQty;
    const held = modified ? qtyOverride! : newHolds.reduce((a, c) => a + c.reservedQty, 0);
    dispatch({
      type: "logDecision",
      decision: makeDecision({
        e,
        kind: "preorder",
        outcome: modified ? "modified" : "accepted",
        subjectId,
        subjectLabel,
        by: person.name,
        role: state.role,
        today: state.today,
        detail: modified ? `Held ${fmtNum(held)} instead of ${fmtNum(newHolds[0].reservedQty)} ${mat.unit}.` : `Held ${fmtNum(held)} ${mat.unit}.`,
        href: "/app/transfers",
      }),
    });
    toast.success(`Held ${fmtNum(held)} ${mat.unit} of forecast surplus`, {
      description: `This is a hold in Surplus AI only. Place your supplier order for the rest yourself, and confirm or top up by ${fmtDate(result.decisionDate)}.`,
    });
  };

  const rejectRec = (reason?: string) => {
    dispatch({
      type: "logDecision",
      decision: makeDecision({ e, kind: "preorder", outcome: "rejected", subjectId, subjectLabel, by: person.name, role: state.role, today: state.today, reason, href: "/app/radar" }),
    });
    toast("Recommendation rejected and logged", { description: "Nothing was reserved. See Activity for the record." });
  };

  const total = Math.max(1, input.qty);
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Form */}
      <form data-demo="preorder-form" className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5 lg:sticky lg:top-20 lg:col-span-2 lg:self-start" onSubmit={(e) => e.preventDefault()} aria-label="Pre-Order Check inputs">
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
            <p className="mt-0.5 text-xs text-muted-foreground">Reserve only forecast × progress-based score, leaving room for a smaller surplus.</p>
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
      <div data-demo="preorder-result" className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5 lg:col-span-3" aria-live="polite">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">Recommendation</h3>
            <CertaintyBadge level={e.certainty.level} />
            {input.conservative && <StatusBadge tone="brand">Conservative</StatusBadge>}
          </div>
          <p className="text-[15px] leading-snug font-semibold text-pretty">{e.recommendation}</p>
          <p className="text-sm text-muted-foreground">{e.outcome}</p>
        </div>

        <div className="-mx-4 grid grid-cols-2 gap-px border-y bg-border sm:-mx-5 sm:grid-cols-3">
          {result.listingQty > 0 && (
            <Figure label={result.fromListings.some((a) => a.secured) ? "Reserved, logged surplus" : "From logged surplus"} value={`${fmtNum(result.listingQty)}`} unit={mat.unit} icon={PackageCheck} tone="brand" />
          )}
          <Figure label="Reserve from forecast" value={fmtNum(result.reservedForecast)} unit={mat.unit} icon={Scale} tone="forecast" big />
          <Figure label="Order now" value={fmtNum(result.orderNow)} unit={mat.unit} icon={ShoppingCart} tone="neutral" big />
          <div className={cn("col-span-2 flex flex-col bg-card px-4 py-3 sm:col-span-1 sm:px-5", result.listingQty > 0 && "sm:col-span-3")}>
            <span className="text-xs text-muted-foreground">Decision date</span>
            <span className="tabular mt-1 text-xl font-semibold tracking-tight">{fmtDate(result.decisionDate)}</span>
            <span className="text-xs text-muted-foreground">Confirm the forecast or top up</span>
          </div>
        </div>

        <div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${fmtNum(result.listingQty)} from logged surplus, ${fmtNum(result.reservedForecast)} reserved from forecast, ${fmtNum(result.orderNow)} to order now`}>
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

        <div className="grid grid-cols-3 gap-x-4 border-b pb-4">
          <Saving icon={Wallet} label="Estimated saving" value={fmtRm(result.expected.savedRm)} note="Assumed unit cost minus haulage" />
          <Saving icon={Scale} label="Material reused" value={fmtTonnes(result.expected.tonnes)} note="Quantity × assumed weight" />
          <Saving icon={Leaf} label="CO2e avoided" value={`${fmtNum(result.expected.co2eKg / 1000, 1)} t`} note="Illustrative carbon factor" />
        </div>
        {result.reservedForecast > 0 && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">If the full forecast appears</p>
              <p className="tabular font-medium">
                {fmtNum(result.bestCase.qty)} {mat.unit}, {fmtRm(result.bestCase.savedRm)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">If only forecast × score appears</p>
              <p className="tabular font-medium">
                {fmtNum(result.worstCase.qty)} {mat.unit}, {fmtRm(result.worstCase.savedRm)}
              </p>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-semibold">Why this recommendation</h4>
          <ExplanationPanel e={e} showRecommendation={false} />
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          {lastDecision && (
            <p className="text-xs text-muted-foreground">
              Last decision: {lastDecision.outcome} by {lastDecision.by} on {fmtDate(lastDecision.at)}
              {lastDecision.reason ? `: "${lastDecision.reason}"` : ""}
              {lastDecision.detail ? `. ${lastDecision.detail}` : ""}{" "}
              <Link href="/app/activity" className="font-medium text-brand hover:underline">
                View activity
              </Link>
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            {newHolds.length > 0 && (
              <Button variant="outline" onClick={() => setDialog("reject")}>
                <ThumbsDown aria-hidden /> Reject
              </Button>
            )}
            {result.securedQty > 0 && newHolds.length === 0 ? (
              <Button variant="secondary" asChild data-demo="reserve-button">
                <Link href="/app/transfers">
                  <Check aria-hidden /> {fmtNum(result.securedQty)} held. View transfer
                </Link>
              </Button>
            ) : newHolds.length > 0 ? (
              <Button onClick={() => setDialog("approve")} data-demo="reserve-button">
                <Scale aria-hidden /> Review and hold {fmtNum(newHolds.reduce((a, c) => a + c.reservedQty, 0))}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <DecisionDialog
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
        mode={dialog ?? "approve"}
        e={e}
        title={dialog === "reject" ? "Reject this recommendation" : "Hold forecast surplus"}
        consequence={
          dialog === "reject"
            ? "Nothing is held. Your reason is saved so the team can see why."
            : `This places a hold on another site's forecast surplus inside Surplus AI. It does not place or change any supplier order. Order the remaining ${fmtNum(result.orderNow)} ${mat.unit} through your normal process.`
        }
        confirmLabel={dialog === "reject" ? "Reject and log" : "Confirm hold"}
        quantity={dialog === "approve" && newHolds.length === 1 ? { value: newHolds[0].reservedQty, max: newHolds[0].availableQty, unit: mat.unit, label: "Quantity to hold" } : undefined}
        quickReasons={["Need date is too tight", "Need one supplier batch for a consistent finish", "Source site has been unreliable", "Plan quantities look wrong"]}
        onConfirm={({ reason, qty }) => (dialog === "reject" ? rejectRec(reason) : reserve(qty))}
      />
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
  tone,
  big,
}: {
  label: string;
  value: string;
  unit: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone: "forecast" | "neutral" | "brand";
  big?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col bg-card px-4 py-3 sm:px-5",
        tone === "forecast" && "bg-forecast-soft",
        tone === "brand" && "bg-brand-soft",
      )}
    >
      <span className={cn("text-xs", tone === "forecast" ? "text-forecast-ink" : "text-muted-foreground")}>{label}</span>
      <span className={cn("tabular mt-1 font-semibold tracking-tight", big ? "text-3xl" : "text-xl")}>{value}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}

function Saving({ label, value, note }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string; note: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="tabular mt-1 text-base font-semibold sm:text-lg">{value}</span>
      <span className="hidden text-[11px] text-muted-foreground sm:block">{note}</span>
    </div>
  );
}
