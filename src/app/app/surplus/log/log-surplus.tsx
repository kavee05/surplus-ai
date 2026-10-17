"use client";

import { Camera, Check, ChevronDown, ImageUp, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge } from "@/components/app/status-badge";
import { CertaintyBadge } from "@/components/explain/certainty";
import { ExplanationPanel } from "@/components/explain/explanation-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HERO_FORECAST_ID } from "@/data/seed";
import { HERO_LISTING_ID } from "@/lib/actions";
import { samples } from "@/lib/ai/samples";
import type { AnalyzeResponse } from "@/lib/ai/schema";
import { materialById, siteName } from "@/lib/engine/context";
import { makeDecision } from "@/lib/decisions";
import { recordActual } from "@/lib/engine/forecast";
import { explainPhoto } from "@/lib/explain/builders";
import { fmtNum } from "@/lib/format";
import { useForecasts, useNewId, useStore } from "@/lib/store";
import type { Condition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Draft {
  materialId: string;
  qty: number;
  condition: Condition;
  siteId: string;
  phaseId: string;
  notes: string;
  forecastId: string | "none";
}

async function fileToBase64Jpeg(file: File): Promise<{ data: string; preview: string }> {
  const url = URL.createObjectURL(file);
  const img = document.createElement("img");
  img.src = url;
  await img.decode();
  const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL("image/jpeg", 0.85);
  URL.revokeObjectURL(url);
  return { data: preview.split(",")[1], preview };
}

export function LogSurplus() {
  const { state, ready, dispatch, person } = useStore();
  const forecasts = useForecasts();
  const router = useRouter();
  const newId = useNewId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ src: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<AnalyzeResponse | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [showWhy, setShowWhy] = useState(false);
  const aiExplanation = useMemo(() => (ai ? explainPhoto(ai.result, ai.mode, state) : null), [ai, state]);

  useEffect(() => {
    fetch("/api/analyze-photo")
      .then((r) => r.json())
      .then((j) => setMode(j.mode))
      .catch(() => {});
  }, []);

  const siteId = person.siteId;
  const openForecasts = useMemo(
    () => (draft ? forecasts.filter((f) => f.siteId === draft.siteId && f.materialId === draft.materialId && f.status === "Forecast") : []),
    [forecasts, draft],
  );

  const applyResult = (r: AnalyzeResponse) => {
    setAi(r);
    const known = r.result.materialId !== "unknown";
    const materialId = known ? r.result.materialId : state.materials[0].id;
    const phase = state.phases.find((p) => p.siteId === siteId && p.status === "active") ?? state.phases.find((p) => p.siteId === siteId);
    const fc = forecasts.find((f) => f.siteId === siteId && f.materialId === materialId && f.status === "Forecast");
    setDraft({
      materialId,
      qty: Math.round(r.result.estimatedQty),
      condition: r.result.condition,
      siteId,
      phaseId: fc?.phaseId ?? phase?.id ?? "",
      notes: r.result.notes,
      forecastId: fc?.id ?? "none",
    });
    setChecked(false);
  };

  const analyse = async (body: object) => {
    setBusy(true);
    setAi(null);
    setDraft(null);
    try {
      const res = await fetch("/api/analyze-photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      applyResult(json as AnalyzeResponse);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed. Fill in the details yourself.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!draft || !checked || draft.qty <= 0) return;
    const fc = draft.forecastId !== "none" ? forecasts.find((f) => f.id === draft.forecastId) : undefined;
    const isHero = draft.forecastId === HERO_FORECAST_ID;
    const listingId = isHero ? HERO_LISTING_ID : newId("L");
    dispatch({
      type: "addListing",
      listing: {
        id: listingId,
        siteId: draft.siteId,
        phaseId: draft.phaseId || undefined,
        materialId: draft.materialId,
        qty: draft.qty,
        condition: draft.condition,
        availableFrom: state.today,
        loggedAt: state.today,
        loggedBy: person.name,
        status: "available",
        sampleId: samples.find((s) => s.src === photo?.src)?.id,
        notes: draft.notes,
        forecastId: fc?.id,
        aiEstimated: !!ai && ai.result.materialId !== "unknown",
      },
    });
    if (ai && ai.result.materialId !== "unknown") {
      const e = explainPhoto(ai.result, ai.mode, state);
      const changes: string[] = [];
      if (draft.materialId !== ai.result.materialId) changes.push(`item changed to ${materialById(state, draft.materialId).name}`);
      if (draft.qty !== Math.round(ai.result.estimatedQty)) changes.push(`quantity ${fmtNum(ai.result.estimatedQty)} to ${fmtNum(draft.qty)}`);
      if (draft.condition !== ai.result.condition) changes.push(`condition ${ai.result.condition} to ${draft.condition}`);
      dispatch({
        type: "logDecision",
        decision: makeDecision({
          e,
          kind: "photo",
          outcome: changes.length ? "modified" : "accepted",
          subjectId: listingId,
          subjectLabel: `Photo log, ${siteName(state, draft.siteId)}`,
          by: person.name,
          role: state.role,
          today: state.today,
          detail: changes.length ? `Edited before saving: ${changes.join("; ")}.` : "Saved as suggested after on-site check.",
          href: `/app/surplus?listing=${listingId}`,
        }),
      });
    }
    if (fc) {
      const o = recordActual(fc, draft.qty, state.today, state.assumptions.global.confirmTolerancePct);
      const diff = draft.qty - fc.qty;
      toast.success(`Surplus logged. Forecast ${o.status.toLowerCase()}.`, {
        description: `${fmtNum(draft.qty)} logged against ${fmtNum(fc.qty)} forecast (${diff >= 0 ? "+" : ""}${fmtNum(diff)}).`,
      });
    } else {
      toast.success("Surplus logged and visible to every site.");
    }
    router.push("/app/surplus");
  };

  if (!ready) return <PageSkeleton cards={0} />;
  const mat = draft ? materialById(state, draft.materialId) : null;

  return (
    <>
      <PageHeader
        title="Log surplus"
        description={`Logging for ${siteName(state, siteId)} as ${person.name}. Take a photo, check what the AI suggests, then confirm.`}
      />
      <div data-demo="log-form" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Step 1: photo */}
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card sm:p-5" aria-labelledby="photo-h">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="photo-h" className="font-semibold">
              1. Photo
            </h2>
            <StatusBadge tone={mode === "live" ? "success" : "info"}>{mode === "live" ? "Live AI" : "Demo mode: sample results"}</StatusBadge>
          </div>
          <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border border-dashed bg-muted/50">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.src} alt={photo.label} className="size-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                <Camera className="size-8" aria-hidden />
                Take a photo of the leftover material, or pick a sample below.
              </div>
            )}
            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-card/70">
                <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm shadow-raised">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Analysing photo
                </span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            aria-label="Take or upload a photo"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 15_000_000) return toast.error("That file is over 15 MB. Choose a smaller photo.");
              try {
                const { data, preview } = await fileToBase64Jpeg(f);
                setPhoto({ src: preview, label: "Your photo" });
                analyse({ image: data, mimeType: "image/jpeg" });
              } catch {
                toast.error("Could not read that image. Try a JPEG or PNG.");
              }
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <ImageUp aria-hidden /> Take or upload a photo
          </Button>
          <div>
            <p className="mb-2 text-sm font-medium">Or try a sample photo</p>
            <div className="grid grid-cols-4 gap-2">
              {samples.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setPhoto({ src: s.src, label: s.label });
                    analyse({ sampleId: s.id });
                  }}
                  className={cn(
                    "group flex flex-col gap-1 rounded-lg border p-1 text-left text-xs transition-colors hover:border-brand",
                    photo?.src === s.src && "border-brand ring-2 ring-brand/20",
                  )}
                  aria-label={`Use sample photo: ${s.label}`}
                >
                  <Image src={s.src} alt="" width={160} height={120} unoptimized className="aspect-[4/3] w-full rounded object-cover" />
                  <span className="truncate px-0.5 text-muted-foreground group-hover:text-foreground">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Sample photos are simple illustrations made for this prototype.</p>
          </div>
        </section>

        {/* Step 2: confirm */}
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card sm:p-5" aria-labelledby="confirm-h">
          <h2 id="confirm-h" className="font-semibold">
            2. Check and confirm
          </h2>
          {!draft || !mat ? (
            <div className="grid flex-1 place-items-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {busy ? "Reading the photo..." : "The AI suggestion appears here after you choose a photo. Nothing is saved until you confirm."}
            </div>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              {ai && aiExplanation && (
                <div className="rounded-lg border border-info/30 bg-info-soft/60 text-sm">
                  <div className="flex gap-3 p-3">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{ai.mode === "live" ? "AI suggestion" : "Demo suggestion"}</p>
                        <CertaintyBadge level={aiExplanation.certainty.level} />
                      </div>
                      <p className="mt-0.5">{aiExplanation.recommendation}</p>
                      {aiExplanation.certainty.score && <p className="mt-0.5 text-xs text-muted-foreground">{aiExplanation.certainty.score.label}</p>}
                      <button
                        type="button"
                        aria-expanded={showWhy}
                        onClick={() => setShowWhy((v) => !v)}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                      >
                        <ChevronDown className={cn("size-3.5 transition-transform", showWhy && "rotate-180")} aria-hidden />
                        {showWhy ? "Hide details" : "How this was produced"}
                      </button>
                    </div>
                  </div>
                  {showWhy && (
                    <div className="border-t border-info/20 bg-card p-3">
                      <ExplanationPanel e={aiExplanation} showRecommendation={false} />
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="lg-mat">Item</Label>
                  <Select value={draft.materialId} onValueChange={(v) => setDraft({ ...draft, materialId: v, forecastId: forecasts.find((f) => f.siteId === draft.siteId && f.materialId === v && f.status === "Forecast")?.id ?? "none" })}>
                    <SelectTrigger id="lg-mat" className="w-full">
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
                  <span className="text-xs text-muted-foreground">Category: {mat.category}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lg-qty">Quantity ({mat.unit})</Label>
                  <Input id="lg-qty" type="number" min={1} inputMode="numeric" value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: Math.max(0, Number(e.target.value) || 0) })} className="tabular" />
                  {ai?.result.materialId !== "unknown" && <span className="text-xs text-muted-foreground">Estimated from the photo. Count before saving.</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lg-cond">Condition</Label>
                  <Select value={draft.condition} onValueChange={(v) => setDraft({ ...draft, condition: v as Condition })}>
                    <SelectTrigger id="lg-cond" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="usable">Usable</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="lg-fc">Matches a forecast?</Label>
                  <Select value={draft.forecastId} onValueChange={(v) => setDraft({ ...draft, forecastId: v })}>
                    <SelectTrigger id="lg-fc" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No, this was not forecast</SelectItem>
                      {openForecasts.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          Yes: {state.phases.find((p) => p.id === f.phaseId)?.name}, {fmtNum(f.qty)} {mat.unit} forecast
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Linking it marks the forecast Confirmed (within {state.assumptions.global.confirmTolerancePct}%) or Revised, and releases any reservations.</span>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="lg-notes">Notes</Label>
                  <Textarea id="lg-notes" rows={2} maxLength={400} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                </div>
              </div>
              {(mat.structural || ai?.result.needsEngineerApproval) && (
                <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  Structural item. Any transfer needs engineer approval before it can be reserved.
                </div>
              )}
              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
                <span>I have checked the item, condition and quantity on site.</span>
              </label>
              <Button type="submit" disabled={!checked || draft.qty <= 0}>
                <Check aria-hidden /> Save surplus
              </Button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
