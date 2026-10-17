/**
 * Structured explanation returned alongside every recommendation, prediction,
 * match, classification and impact estimate. Built from the same inputs and
 * outputs the engine used, never written after the fact.
 */

/** Where a value comes from. Drives the label shown next to every fact. */
export type Provenance =
  | "recorded" // entered in the app by a person (simulated records in this prototype)
  | "calculated" // deterministic arithmetic from recorded values and assumptions
  | "assumption" // editable value on the Assumptions page, source still to confirm
  | "model" // output of the photo model, not verified
  | "demo"; // canned result used in demo mode

export type EvidenceKind = "purchase-plan" | "phase" | "listing" | "forecast" | "need" | "transfer" | "assumption" | "photo";

export interface EvidenceRef {
  id: string;
  kind: EvidenceKind;
  label: string;
  detail: string;
  provenance: Provenance;
  href?: string;
  /** When the underlying record was last updated, if known. */
  asOf?: string;
  stale?: boolean;
}

export type ReasonEffect = "supports" | "weakens" | "blocks";

export interface Reason {
  code: string;
  label: string;
  detail: string;
  effect: ReasonEffect;
}

export interface Fact {
  label: string;
  value: string;
  provenance: Provenance;
}

export interface AssumptionUsed {
  key: string;
  label: string;
  value: string;
}

export interface CalculationStep {
  label: string;
  formula: string;
  result: string;
}

export interface Alternative {
  id: string;
  label: string;
  summary: string;
  tradeoffs: string[];
  /** Ranking score from the engine, if the alternative was scored. */
  score?: number;
  chosen?: boolean;
  excludedReason?: string;
}

export type CertaintyLevel = "strong" | "moderate" | "tentative" | "insufficient";

export interface Certainty {
  level: CertaintyLevel;
  /** Plain-language reason for the level. */
  basis: string;
  /** True only if the score has been validated against outcomes. Nothing in this prototype is. */
  calibrated: false;
  /** A rule-based or model-reported score, shown only with its label. */
  score?: { value: number; label: string };
  missing: string[];
  couldChange: string[];
}

export interface Explanation {
  kind: "forecast" | "preorder" | "match" | "photo" | "impact";
  recommendation: string;
  outcome: string;
  reasons: Reason[];
  evidence: EvidenceRef[];
  facts: Fact[];
  assumptions: AssumptionUsed[];
  calculations: CalculationStep[];
  limitations: string[];
  alternatives: Alternative[];
  certainty: Certainty;
  requiresHumanApproval: boolean;
  approvalReason?: string;
  /** How this result was produced, in one line. */
  method: string;
}
