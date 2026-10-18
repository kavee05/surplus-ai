"use client";

import { ArrowRight, CircleHelp, Cpu, FileText, Loader2, MessageSquareText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { briefFacts, resolveQuery, templateSummary, verifyBriefing, type AskQuery } from "@/lib/ai/ask";
import { materialById, siteName } from "@/lib/engine/context";
import { preOrderCheck, type PreOrderInput } from "@/lib/engine/preorder";
import { explainPreOrder } from "@/lib/explain/builders";
import { fmtDate, fmtNum } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AiModeBadge } from "./ai-status";

const EXAMPLES = [
  "I need 1,000 floor tiles at Bandar Bukit Raja by 7 December",
  "120 sheets of plywood for KL East by 20 January",
  "300 m of timber batten at Bandar Bukit Raja in 6 weeks",
];

type Outcome =
  | { kind: "question"; question: string; query: AskQuery; source: "ai" | "rules"; reason?: string }
  | {
      kind: "answer";
      input: PreOrderInput;
      assumptions: string[];
      source: "ai" | "rules";
      readReason?: string;
      summary: string;
      summaryKind: "ai" | "template";
      summaryReason?: string;
      briefing: boolean;
    };

export function toRadarHref(i: PreOrderInput) {
  const p = new URLSearchParams({ material: i.materialId, site: i.siteId, phase: i.phaseId, qty: String(i.qty), by: i.neededBy });
  return `/app/radar?${p.toString()}#preorder-heading`;
}

/**
 * Ask Surplus AI. The model (or the rule-based reader in demo mode) only reads the sentence.
 * The deterministic engine computes the answer. A briefing written by the model is shown only
 * if every number and date in it matches the engine; otherwise the template summary is shown.
 */
export function AskBar({ onApply, variant = "radar", className }: { onApply?: (i: PreOrderInput) => void; variant?: "radar" | "overview"; className?: string }) {
  const { state } = useStore();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (sentence: string) => {
    const t = sentence.trim();
    if (t.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "parse", text: t, today: state.today }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "The request could not be read.");
      const source: "ai" | "rules" = j.source === "ai" ? "ai" : "rules";
      const resolved = resolveQuery(j.query as AskQuery, state);
      if (!resolved.ok) {
        setOut({ kind: "question", question: resolved.question, query: resolved.partial, source, reason: j.reason ?? undefined });
        return;
      }
      const input = { ...resolved.input, conservative: false };
      onApply?.(input);
      const r = preOrderCheck(state, input);
      const facts = briefFacts(r, explainPreOrder(r, state), state);
      const template = templateSummary(facts);
      const base: Outcome = { kind: "answer", input, assumptions: resolved.assumptions, source, readReason: j.reason ?? undefined, summary: template, summaryKind: "template", briefing: true };
      setOut(base);
      // Ask for an AI-written briefing; keep the template unless it passes the number guard here too.
      const b = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "brief", facts }) })
        .then((x) => x.json())
        .catch(() => ({ summary: null, reason: "The summary service could not be reached." }));
      if (b.summary && verifyBriefing(b.summary, facts).ok) setOut({ ...base, summary: b.summary, summaryKind: "ai", briefing: false });
      else setOut({ ...base, briefing: false, summaryReason: b.reason ?? undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again or use the form.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="ask-h" className={cn("rounded-2xl bg-card shadow-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-4 text-brand" aria-hidden />
          <h2 id="ask-h" className="font-semibold">
            Ask Surplus AI
          </h2>
          <AiModeBadge />
        </div>
        <p className="text-xs text-muted-foreground">AI reads your sentence. The engine calculates. You decide.</p>
      </div>
      <form
        className="flex flex-col gap-2 p-4 sm:flex-row sm:px-5"
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Describe what you are about to buy
        </label>
        <Input
          id="ask-input"
          value={text}
          maxLength={400}
          onChange={(e) => setText(e.target.value)}
          placeholder="For example: I need 1,000 floor tiles at Bandar Bukit Raja by 7 December"
          className="h-10 flex-1"
        />
        <Button type="submit" className="h-10" disabled={busy || text.trim().length < 2}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <ArrowRight aria-hidden />} Check before I buy
        </Button>
      </form>
      {!out && !error && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4 sm:px-5">
          {EXAMPLES.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => {
                setText(x);
                ask(x);
              }}
              className="rounded-md border px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {x}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="mx-4 mb-4 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger sm:mx-5">
          {error}
        </p>
      )}
      {out?.kind === "question" && (
        <div className="mx-4 mb-4 flex gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm sm:mx-5" role="status">
          <CircleHelp className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-medium">{out.question}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Add it to your sentence and press Check again. {out.reason}</p>
          </div>
        </div>
      )}
      {out?.kind === "answer" && (
        <div className="flex flex-col gap-3 px-4 pb-4 sm:px-5" aria-live="polite">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Understood as</span>
            {[
              `${fmtNum(out.input.qty)} ${materialById(state, out.input.materialId).unit}`,
              materialById(state, out.input.materialId).name,
              siteName(state, out.input.siteId),
              state.phases.find((p) => p.id === out.input.phaseId)?.name ?? "",
              `by ${fmtDate(out.input.neededBy)}`,
            ].map((c) => (
              <span key={c} className="rounded-md border bg-muted/50 px-1.5 py-0.5 font-medium">
                {c}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              {out.source === "ai" ? <Cpu className="size-3" aria-hidden /> : <FileText className="size-3" aria-hidden />}
              read by {out.source === "ai" ? "the AI model" : "the rule-based reader"}
            </span>
          </div>
          {out.assumptions.map((a) => (
            <p key={a} className="text-xs text-muted-foreground">
              {a}
            </p>
          ))}
          <div className={cn("rounded-lg border p-3", out.summaryKind === "ai" ? "border-success/30 bg-success-soft/40" : "bg-muted/40")}>
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {out.summaryKind === "ai" ? <ShieldCheck className="size-3.5 text-success" aria-hidden /> : <FileText className="size-3.5" aria-hidden />}
              {out.summaryKind === "ai" ? "AI-written summary, numbers verified against the engine" : out.briefing ? "Template summary (asking the AI for a briefing...)" : "Template summary"}
            </p>
            <p className="mt-1 text-sm text-pretty">{out.summary}</p>
            {out.summaryKind === "template" && !out.briefing && out.summaryReason && <p className="mt-1 text-xs text-muted-foreground">{out.summaryReason}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">The AI cannot change quantities or reserve anything. Review the evidence and press Reserve yourself.</p>
            {variant === "overview" ? (
              <Button asChild size="sm">
                <Link href={toRadarHref(out.input)}>
                  Open in Pre-Order Check <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <a href="#preorder-heading">See the full check below</a>
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
