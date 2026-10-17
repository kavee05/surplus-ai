import type { Explanation } from "./explain/types";
import type { DecisionKind, DecisionOutcome, DecisionRecord, Role } from "./types";

let seq = 0;

/** Snapshot the recommendation as shown, plus the person's decision. */
export function makeDecision(opts: {
  e: Explanation;
  kind: DecisionKind;
  outcome: DecisionOutcome;
  subjectId: string;
  subjectLabel: string;
  by: string;
  role: Role;
  today: string;
  detail?: string;
  reason?: string;
  href?: string;
}): DecisionRecord {
  return {
    id: `D-${Date.now().toString(36)}${(seq++).toString(36)}`,
    at: opts.today,
    by: opts.by,
    role: opts.role,
    kind: opts.kind,
    subjectId: opts.subjectId,
    subjectLabel: opts.subjectLabel,
    recommendation: opts.e.recommendation,
    certainty: opts.e.certainty.level,
    outcome: opts.outcome,
    detail: opts.detail,
    reason: opts.reason?.trim() || undefined,
    href: opts.href,
  };
}
