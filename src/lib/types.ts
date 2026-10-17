export type ISODate = string; // YYYY-MM-DD

export type Role = "engineer" | "procurement" | "management";

export type Category =
  | "Tiles and finishes"
  | "Timber"
  | "Formwork"
  | "Paving and landscape"
  | "Steel"
  | "Aggregates and binders"
  | "Concrete elements"
  | "Safety and site supplies";

export interface Site {
  id: string;
  township: string;
  lat: number; // approximate
  lng: number; // approximate
}

export type PhaseStatus = "planned" | "active" | "completed";

export interface Phase {
  id: string;
  siteId: string;
  name: string;
  start: ISODate;
  plannedEnd: ISODate;
  progressPct: number;
  /** When progress was last reported by the site (simulated). */
  progressAsOf?: ISODate;
  status: PhaseStatus;
}

export interface Material {
  id: string;
  name: string;
  category: Category;
  unit: string;
  structural: boolean;
}

/** Numeric material values live in the assumptions config, keyed by material id. */
export interface MaterialValues {
  unitCostRm: number;
  kgPerUnit: number;
  co2ePerKg: number;
  leadTimeDays: number;
  wastageAllowance: number; // fraction, 0.05 = 5%
}

export interface PurchasePlan {
  id: string;
  phaseId: string;
  materialId: string;
  plannedQty: number; // from BoQ
  orderedQty: number;
}

export interface Need {
  id: string;
  siteId: string;
  phaseId: string;
  materialId: string;
  qty: number;
  neededBy: ISODate;
  postedBy: string;
  status: "open" | "matched" | "fulfilled";
}

export type Condition = "new" | "good" | "usable" | "poor";

export type ListingStatus = "available" | "reserved" | "transferred" | "community";

export interface Listing {
  id: string;
  siteId: string;
  phaseId?: string;
  materialId: string;
  qty: number;
  condition: Condition;
  availableFrom: ISODate;
  loggedAt: ISODate;
  loggedBy: string;
  status: ListingStatus;
  sampleId?: string;
  notes?: string;
  forecastId?: string;
  aiEstimated?: boolean;
}

export type TransferStatus =
  | "Matched"
  | "Awaiting approval"
  | "Reserved"
  | "Collected"
  | "Completed"
  | "Cancelled";

export interface TransferEvent {
  status: TransferStatus | "Forecast reserved" | "Forecast confirmed" | "Approved";
  at: ISODate;
  by: string;
  note?: string;
}

export interface Transfer {
  id: string;
  listingId?: string;
  forecastId?: string; // set when reserved against a forecast before surplus exists
  toPhaseId?: string; // the buying phase, used to find the buyer's own reservations
  needId?: string;
  fromSiteId: string;
  toSiteId: string;
  materialId: string;
  qty: number;
  status: TransferStatus;
  requiresApproval: boolean;
  approvedBy?: string;
  createdAt: ISODate;
  completedAt?: ISODate;
  history: TransferEvent[];
}

export type ForecastStatus = "Forecast" | "Confirmed" | "Revised";

export interface ForecastOutcome {
  forecastId: string;
  status: Exclude<ForecastStatus, "Forecast">;
  forecastQty: number;
  actualQty: number;
  loggedAt: ISODate;
  simulated?: boolean;
  materialId?: string;
  siteId?: string;
}

export interface Forecast {
  id: string; // fc-{planId}
  planId: string;
  phaseId: string;
  siteId: string;
  materialId: string;
  qty: number;
  confidence: number;
  availableFrom: ISODate;
  status: ForecastStatus;
  explanation: string[];
}

export type OwnershipPolicy = "sdp" | "contractor" | "shared";

export type DecisionKind = "preorder" | "match" | "photo" | "transfer-approval";
export type DecisionOutcome = "accepted" | "modified" | "rejected";

/** One human decision on a system recommendation, kept as an audit trail. */
export interface DecisionRecord {
  id: string;
  at: ISODate;
  by: string;
  role: Role;
  kind: DecisionKind;
  subjectId: string;
  subjectLabel: string;
  /** The recommendation exactly as it was shown when the decision was made. */
  recommendation: string;
  certainty: "strong" | "moderate" | "tentative" | "insufficient";
  outcome: DecisionOutcome;
  detail?: string;
  reason?: string;
  href?: string;
  simulated?: boolean;
}

export interface DismissedMatch {
  needId: string;
  listingId: string;
  reason: string;
  by: string;
  at: ISODate;
}
