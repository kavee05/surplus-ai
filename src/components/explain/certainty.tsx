import { CircleDashed, CircleDot, CircleHelp, ShieldCheck } from "lucide-react";
import type { CertaintyLevel, Provenance } from "@/lib/explain/types";
import { cn } from "@/lib/utils";

const levels: Record<CertaintyLevel, { label: string; className: string; icon: typeof ShieldCheck }> = {
  strong: { label: "Strong evidence", className: "border-success/30 bg-success-soft text-success", icon: ShieldCheck },
  moderate: { label: "Moderate evidence", className: "border-info/30 bg-info-soft text-info", icon: CircleDot },
  tentative: { label: "Tentative", className: "border-warning/30 bg-warning-soft text-warning", icon: CircleDashed },
  insufficient: { label: "Not enough evidence", className: "border-danger/30 bg-danger-soft text-danger", icon: CircleHelp },
};

export const certaintyLabel = (l: CertaintyLevel) => levels[l].label;

export function CertaintyBadge({ level, className }: { level: CertaintyLevel; className?: string }) {
  const c = levels[level];
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium whitespace-nowrap", c.className, className)}>
      <c.icon className="size-3" aria-hidden />
      {c.label}
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
