import type { CertaintyLevel, Provenance } from "@/lib/explain/types";
import { cn } from "@/lib/utils";

const levels: Record<CertaintyLevel, { label: string; bars: number; className: string; explain: string }> = {
  strong: { label: "strong", bars: 3, className: "text-success", explain: "Recorded facts support this, such as logged surplus or a confirmed record." },
  moderate: { label: "moderate", bars: 2, className: "text-info", explain: "Good signs but not yet confirmed, for example a phase that is mostly complete." },
  tentative: { label: "tentative", bars: 1, className: "text-warning", explain: "Early or out-of-date information. Treat it as a heads-up, not a plan." },
  insufficient: { label: "not enough", bars: 0, className: "text-danger", explain: "Too little information to rely on. Check with the site first." },
};

export const certaintyLabel = (l: CertaintyLevel) => `Evidence: ${levels[l].label}`;
export const certaintyExplainer = (l: CertaintyLevel) => levels[l].explain;

/** "Evidence: moderate" with a three-step meter. The title explains the level in plain words. */
export function CertaintyBadge({ level, className }: { level: CertaintyLevel; className?: string }) {
  const c = levels[level];
  return (
    <span
      title={c.explain}
      className={cn("inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full bg-current/[0.08] px-2 text-[11px] font-semibold whitespace-nowrap", c.className, className)}
    >
      <span className="flex items-end gap-px" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-[1px]", i < c.bars ? "bg-current" : "bg-current/20")} style={{ height: 4 + i * 2 }} />
        ))}
      </span>
      Evidence: {c.label}
      <span className="sr-only">. {c.explain}</span>
    </span>
  );
}

const prov: Record<Provenance, { label: string; title: string; className: string }> = {
  recorded: { label: "Recorded", title: "Entered in the app by a person (simulated records in this prototype)", className: "text-foreground/80 bg-muted" },
  calculated: { label: "Calculated", title: "Deterministic arithmetic from recorded values and assumptions", className: "text-brand-strong bg-brand-soft" },
  assumption: { label: "Assumption", title: "Editable value on the Assumptions page, source still to confirm", className: "text-forecast-ink bg-forecast-soft" },
  model: { label: "Model output", title: "Produced by the photo model and not yet verified", className: "text-info bg-info-soft" },
  demo: { label: "Demo result", title: "Pre-written result used in demo mode; no model ran", className: "text-warning bg-warning-soft" },
};

export function ProvenanceTag({ provenance, className }: { provenance: Provenance; className?: string }) {
  const p = prov[provenance];
  return (
    <span title={p.title} className={cn("inline-flex h-[18px] shrink-0 items-center rounded px-1.5 text-[10.5px] font-medium whitespace-nowrap", p.className, className)}>
      {p.label}
    </span>
  );
}
