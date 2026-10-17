import type {
  ForecastOutcome,
  Listing,
  Material,
  Need,
  Phase,
  PurchasePlan,
  Site,
  Transfer,
} from "@/lib/types";

/**
 * SIMULATED DATA. Township names are real SDP townships used for realism.
 * Every quantity, person, company and date below is fictional.
 * Coordinates are approximate township centres.
 */

/** The demo runs on a fixed clock so every screen shows the same numbers. */
export const DEMO_TODAY = "2026-11-02";
/** "Three weeks later" in the Guided Demo: Elmina Phase 3 finishes. */
export const DEMO_LATER = "2026-11-23";

export const people = {
  engineer: { name: "Aina Rahman", title: "Site engineer", siteId: "elmina" },
  procurement: { name: "Daniel Wong", title: "Procurement officer", siteId: "bbr" },
  management: { name: "Priya Nair", title: "Sustainability lead", siteId: "bbr" },
} as const;

export const sites: Site[] = [
  { id: "elmina", township: "City of Elmina", lat: 3.183, lng: 101.511 },
  { id: "bbr", township: "Bandar Bukit Raja", lat: 3.083, lng: 101.453 },
  { id: "serenia", township: "Serenia City", lat: 2.895, lng: 101.703 },
  { id: "kleast", township: "KL East", lat: 3.205, lng: 101.752 },
  { id: "putra", township: "Putra Heights", lat: 3.0, lng: 101.578 },
  { id: "sjcc", township: "Subang Jaya City Centre", lat: 3.068, lng: 101.588 },
  { id: "ainsdale", township: "Bandar Ainsdale", lat: 2.684, lng: 101.98 },
  { id: "nilai", township: "Nilai Impian", lat: 2.818, lng: 101.795 },
];

export const materials: Material[] = [
  { id: "tile-porcelain", name: "Porcelain floor tile 600 x 600", category: "Tiles and finishes", unit: "pcs", structural: false },
  { id: "tile-wall", name: "Ceramic wall tile 300 x 600", category: "Tiles and finishes", unit: "pcs", structural: false },
  { id: "plywood", name: "Plywood formwork sheet 18 mm", category: "Formwork", unit: "sheets", structural: false },
  { id: "batten", name: "Timber batten 50 x 75", category: "Timber", unit: "m", structural: false },
  { id: "paver", name: "Interlocking concrete paver", category: "Paving and landscape", unit: "m²", structural: false },
  { id: "kerb", name: "Precast kerb 1 m", category: "Paving and landscape", unit: "pcs", structural: false },
  { id: "rebar", name: "Rebar Y12 offcuts", category: "Steel", unit: "kg", structural: true },
  { id: "brc-mesh", name: "BRC mesh A10 sheet", category: "Steel", unit: "sheets", structural: true },
  { id: "aggregate", name: "Crushed aggregate 20 mm", category: "Aggregates and binders", unit: "tonnes", structural: false },
  { id: "sand", name: "River sand", category: "Aggregates and binders", unit: "tonnes", structural: false },
  { id: "cement", name: "Portland cement 50 kg bag", category: "Aggregates and binders", unit: "bags", structural: false },
  { id: "prop", name: "Adjustable steel prop", category: "Formwork", unit: "pcs", structural: false },
  { id: "u-drain", name: "Precast U-drain 600 mm", category: "Concrete elements", unit: "pcs", structural: true },
  { id: "barrier", name: "Water-filled safety barrier", category: "Safety and site supplies", unit: "pcs", structural: false },
  { id: "netting", name: "Safety netting roll 50 m", category: "Safety and site supplies", unit: "rolls", structural: false },
];

export const phases: Phase[] = [
  { id: "elm-p3", siteId: "elmina", name: "Phase 3 link homes", start: "2026-03-02", plannedEnd: "2026-11-23", progressPct: 62, status: "active" },
  { id: "bbr-2b", siteId: "bbr", name: "Phase 2B terrace homes", start: "2026-12-07", plannedEnd: "2027-09-30", progressPct: 0, status: "planned" },
  { id: "ser-1c", siteId: "serenia", name: "Phase 1C townhouses", start: "2026-02-02", plannedEnd: "2026-12-14", progressPct: 70, status: "active" },
  { id: "kle-2", siteId: "kleast", name: "Phase 2 condominium podium", start: "2025-11-03", plannedEnd: "2027-01-31", progressPct: 40, status: "active" },
  { id: "ph-4a", siteId: "putra", name: "Phase 4A shop offices", start: "2026-01-12", plannedEnd: "2026-12-21", progressPct: 78, status: "active" },
  { id: "sjcc-t2", siteId: "sjcc", name: "Tower 2 fit-out", start: "2026-06-01", plannedEnd: "2027-02-15", progressPct: 35, status: "active" },
  { id: "ain-5", siteId: "ainsdale", name: "Phase 5 semi-detached", start: "2026-01-05", plannedEnd: "2026-11-30", progressPct: 85, status: "active" },
  { id: "nil-3", siteId: "nilai", name: "Phase 3B terrace homes", start: "2026-08-03", plannedEnd: "2027-03-31", progressPct: 20, status: "active" },
  { id: "ser-2a", siteId: "serenia", name: "Phase 2A link homes", start: "2027-01-11", plannedEnd: "2027-12-31", progressPct: 0, status: "planned" },
  { id: "kle-3", siteId: "kleast", name: "Phase 3 residences", start: "2027-02-01", plannedEnd: "2028-01-31", progressPct: 0, status: "planned" },
  { id: "elm-p2", siteId: "elmina", name: "Phase 2 terrace homes", start: "2025-10-06", plannedEnd: "2026-09-30", progressPct: 100, status: "completed" },
  { id: "bbr-1", siteId: "bbr", name: "Phase 1 landscape works", start: "2025-09-01", plannedEnd: "2026-08-15", progressPct: 100, status: "completed" },
];

const p = (id: string, phaseId: string, materialId: string, plannedQty: number, orderedQty: number): PurchasePlan => ({
  id,
  phaseId,
  materialId,
  plannedQty,
  orderedQty,
});

export const purchasePlans: PurchasePlan[] = [
  // Hero: 5,000 ordered against 4,000 planned plus 5% wastage leaves 800.
  p("elm-p3-tile", "elm-p3", "tile-porcelain", 4000, 5000),
  p("elm-p3-batten", "elm-p3", "batten", 3000, 3600),
  p("elm-p3-ply", "elm-p3", "plywood", 600, 640),
  p("ser-1c-tile", "ser-1c", "tile-porcelain", 2400, 2700),
  p("ser-1c-paver", "ser-1c", "paver", 1800, 2000),
  p("ser-1c-kerb", "ser-1c", "kerb", 900, 960),
  p("kle-2-brc", "kle-2", "brc-mesh", 900, 1000),
  p("kle-2-prop", "kle-2", "prop", 400, 460),
  p("kle-2-rebar", "kle-2", "rebar", 42000, 46000),
  p("ph-4a-agg", "ph-4a", "aggregate", 1200, 1350),
  p("ph-4a-sand", "ph-4a", "sand", 400, 440),
  p("ph-4a-cement", "ph-4a", "cement", 1500, 1600),
  p("sjcc-t2-wall", "sjcc-t2", "tile-wall", 6000, 6800),
  p("sjcc-t2-tile", "sjcc-t2", "tile-porcelain", 1500, 1600),
  p("sjcc-t2-net", "sjcc-t2", "netting", 30, 36),
  p("ain-5-tile", "ain-5", "tile-porcelain", 2000, 2300),
  p("ain-5-ply", "ain-5", "plywood", 500, 560),
  p("ain-5-barrier", "ain-5", "barrier", 40, 52),
  p("nil-3-paver", "nil-3", "paver", 2500, 2700),
  p("nil-3-kerb", "nil-3", "kerb", 1200, 1300),
  p("nil-3-ply", "nil-3", "plywood", 700, 800),
  p("bbr-2b-tile", "bbr-2b", "tile-porcelain", 950, 0),
  p("ser-2a-agg", "ser-2a", "aggregate", 900, 0),
  p("kle-3-ply", "kle-3", "plywood", 1100, 0),
];

type LArgs = [string, string, string | undefined, string, number, Listing["condition"], string, Listing["status"], string, string?, string?];
const L = ([id, siteId, phaseId, materialId, qty, condition, loggedAt, status, loggedBy, sampleId, notes]: LArgs): Listing => ({
  id,
  siteId,
  phaseId,
  materialId,
  qty,
  condition,
  availableFrom: loggedAt,
  loggedAt,
  status,
  loggedBy,
  sampleId,
  notes,
});

export const listings: Listing[] = (
  [
    ["L01", "elmina", "elm-p2", "plywood", 85, "good", "2026-10-01", "available", "Aina Rahman", "plywood", "Stacked under cover at store B."],
    ["L02", "elmina", "elm-p2", "batten", 420, "usable", "2026-10-03", "available", "Aina Rahman", "timber"],
    ["L03", "elmina", "elm-p2", "prop", 60, "good", "2026-10-05", "available", "Aina Rahman", "prop"],
    ["L04", "bbr", "bbr-1", "paver", 140, "good", "2026-08-20", "transferred", "Daniel Wong", "paver"],
    ["L05", "bbr", "bbr-1", "kerb", 85, "good", "2026-08-22", "available", "Daniel Wong", "kerb"],
    ["L06", "bbr", "bbr-1", "barrier", 24, "good", "2026-09-02", "reserved", "Daniel Wong", "barrier"],
    ["L07", "serenia", "ser-1c", "sand", 18, "new", "2026-10-20", "available", "Hafiz Osman"],
    ["L08", "serenia", "ser-1c", "cement", 120, "new", "2026-10-25", "available", "Hafiz Osman", undefined, "Bags sealed, use within 8 weeks."],
    ["L09", "kleast", "kle-2", "rebar", 1850, "usable", "2026-10-12", "reserved", "Mei Ling Tan", "rebar"],
    ["L10", "kleast", "kle-2", "brc-mesh", 22, "good", "2026-10-18", "available", "Mei Ling Tan", "rebar"],
    ["L11", "putra", "ph-4a", "aggregate", 35, "good", "2026-10-08", "reserved", "Ravi Kumar"],
    ["L12", "putra", "ph-4a", "netting", 6, "good", "2026-10-15", "available", "Ravi Kumar"],
    ["L13", "sjcc", "sjcc-t2", "tile-wall", 380, "new", "2026-10-22", "available", "Siti Zulaikha", "tiles", "Boxed, same batch."],
    ["L14", "sjcc", "sjcc-t2", "barrier", 16, "good", "2026-09-28", "available", "Siti Zulaikha", "barrier"],
    ["L15", "ainsdale", "ain-5", "tile-porcelain", 300, "new", "2026-10-26", "available", "Arjun Pillai", "tiles"],
    ["L16", "ainsdale", "ain-5", "plywood", 40, "usable", "2026-09-15", "available", "Arjun Pillai", "plywood"],
    ["L17", "nilai", "nil-3", "paver", 60, "good", "2026-10-02", "available", "Farah Idris", "paver"],
    ["L18", "nilai", "nil-3", "u-drain", 14, "good", "2026-10-10", "available", "Farah Idris"],
    ["L19", "elmina", "elm-p2", "tile-porcelain", 120, "good", "2026-10-06", "reserved", "Aina Rahman", "tiles"],
    ["L20", "serenia", "ser-1c", "kerb", 40, "new", "2026-10-28", "available", "Hafiz Osman", "kerb"],
    ["L21", "kleast", "kle-2", "prop", 45, "good", "2026-10-02", "transferred", "Mei Ling Tan", "prop"],
    ["L22", "putra", "ph-4a", "cement", 60, "good", "2026-09-20", "available", "Ravi Kumar", undefined, "Opened pallet, bags intact."],
    ["L23", "sjcc", "sjcc-t2", "netting", 4, "good", "2026-10-30", "available", "Siti Zulaikha"],
    ["L24", "bbr", "bbr-1", "batten", 260, "usable", "2026-09-10", "transferred", "Daniel Wong", "timber"],
    ["L25", "elmina", "elm-p2", "aggregate", 12, "usable", "2026-10-14", "available", "Aina Rahman"],
    ["L26", "serenia", "ser-1c", "batten", 180, "good", "2026-10-19", "available", "Hafiz Osman", "timber"],
    ["L27", "nilai", "nil-3", "plywood", 55, "good", "2026-10-21", "available", "Farah Idris", "plywood"],
    ["L28", "kleast", "kle-2", "u-drain", 8, "good", "2026-09-25", "reserved", "Mei Ling Tan"],
    ["L29", "ainsdale", "ain-5", "paver", 90, "good", "2026-10-06", "available", "Arjun Pillai", "paver"],
    ["L30", "putra", "ph-4a", "rebar", 640, "usable", "2026-10-27", "available", "Ravi Kumar", "rebar"],
  ] as LArgs[]
).map(L);

const n = (id: string, siteId: string, phaseId: string, materialId: string, qty: number, neededBy: string, postedBy: string, status: Need["status"] = "open"): Need => ({
  id,
  siteId,
  phaseId,
  materialId,
  qty,
  neededBy,
  postedBy,
  status,
});

export const HERO_NEED_ID = "N01";

export const needs: Need[] = [
  // Hero: 1,000 floor tiles for BBR Phase 2B, starting in 5 weeks.
  n("N01", "bbr", "bbr-2b", "tile-porcelain", 1000, "2026-12-07", "Daniel Wong"),
  n("N02", "nilai", "nil-3", "paver", 120, "2026-11-20", "Farah Idris"),
  n("N03", "putra", "ph-4a", "rebar", 900, "2026-11-16", "Ravi Kumar", "matched"),
  n("N04", "serenia", "ser-2a", "barrier", 24, "2026-12-01", "Hafiz Osman", "matched"),
  n("N05", "serenia", "ser-2a", "tile-porcelain", 120, "2027-01-11", "Hafiz Osman", "matched"),
  n("N06", "kleast", "kle-3", "plywood", 120, "2027-01-20", "Mei Ling Tan"),
  n("N07", "sjcc", "sjcc-t2", "kerb", 60, "2026-12-01", "Siti Zulaikha"),
  n("N08", "elmina", "elm-p3", "sand", 15, "2026-11-15", "Aina Rahman"),
  n("N09", "bbr", "bbr-2b", "batten", 300, "2026-12-15", "Daniel Wong"),
  n("N10", "kleast", "kle-3", "prop", 80, "2027-01-15", "Mei Ling Tan"),
  n("N11", "putra", "ph-4a", "u-drain", 8, "2026-11-20", "Ravi Kumar", "matched"),
  n("N12", "sjcc", "sjcc-t2", "netting", 8, "2026-11-25", "Siti Zulaikha"),
  n("N13", "serenia", "ser-2a", "aggregate", 30, "2027-01-10", "Hafiz Osman"),
  n("N14", "nilai", "nil-3", "cement", 80, "2026-11-18", "Farah Idris"),
  n("N15", "kleast", "kle-3", "brc-mesh", 30, "2027-02-01", "Mei Ling Tan"),
  n("N16", "bbr", "bbr-2b", "tile-wall", 400, "2026-12-20", "Daniel Wong"),
  n("N17", "ainsdale", "ain-5", "barrier", 10, "2026-11-30", "Arjun Pillai"),
  n("N18", "kleast", "kle-2", "aggregate", 20, "2026-11-10", "Mei Ling Tan", "matched"),
];

const ev = (status: Transfer["history"][number]["status"], at: string, by: string, note?: string) => ({ status, at, by, note });

const done = (id: string, from: string, to: string, materialId: string, qty: number, completedAt: string, listingId?: string): Transfer => ({
  id,
  listingId,
  fromSiteId: from,
  toSiteId: to,
  materialId,
  qty,
  status: "Completed",
  requiresApproval: false,
  createdAt: completedAt,
  completedAt,
  history: [ev("Matched", completedAt, "System"), ev("Completed", completedAt, "Receiving site")],
});

export const transfers: Transfer[] = [
  // Historical completed transfers (simulated) feed the dashboard trend.
  done("T-H1", "elmina", "bbr", "plywood", 70, "2026-04-14"),
  done("T-H2", "serenia", "putra", "aggregate", 40, "2026-05-08"),
  done("T-H3", "sjcc", "kleast", "barrier", 30, "2026-06-11"),
  done("T-H4", "putra", "serenia", "sand", 25, "2026-07-02"),
  done("T-H5", "ainsdale", "nilai", "kerb", 60, "2026-08-06"),
  done("T-H6", "kleast", "elmina", "netting", 8, "2026-08-27"),
  done("T-H7", "nilai", "bbr", "paver", 75, "2026-09-17"),
  done("T-H8", "elmina", "sjcc", "tile-wall", 260, "2026-10-08"),
  done("T01", "bbr", "nilai", "paver", 140, "2026-09-05", "L04"),
  done("T02", "kleast", "sjcc", "prop", 45, "2026-10-15", "L21"),
  done("T03", "bbr", "elmina", "batten", 260, "2026-09-25", "L24"),
  {
    id: "T04", listingId: "L06", needId: "N04", fromSiteId: "bbr", toSiteId: "serenia", materialId: "barrier", qty: 24,
    status: "Reserved", requiresApproval: false, createdAt: "2026-10-20",
    history: [ev("Matched", "2026-10-20", "Hafiz Osman"), ev("Reserved", "2026-10-22", "Daniel Wong")],
  },
  {
    id: "T05", listingId: "L19", needId: "N05", fromSiteId: "elmina", toSiteId: "serenia", materialId: "tile-porcelain", qty: 120,
    status: "Reserved", requiresApproval: false, createdAt: "2026-10-24",
    history: [ev("Matched", "2026-10-24", "Hafiz Osman"), ev("Reserved", "2026-10-26", "Aina Rahman")],
  },
  {
    id: "T06", listingId: "L28", needId: "N11", fromSiteId: "kleast", toSiteId: "putra", materialId: "u-drain", qty: 8,
    status: "Awaiting approval", requiresApproval: true, createdAt: "2026-10-28",
    history: [ev("Matched", "2026-10-28", "Ravi Kumar"), ev("Awaiting approval", "2026-10-28", "System", "Structural item. Engineer approval required.")],
  },
  {
    id: "T07", listingId: "L09", needId: "N03", fromSiteId: "kleast", toSiteId: "putra", materialId: "rebar", qty: 900,
    status: "Matched", requiresApproval: true, createdAt: "2026-10-30",
    history: [ev("Matched", "2026-10-30", "Ravi Kumar")],
  },
  {
    id: "T08", listingId: "L11", needId: "N18", fromSiteId: "putra", toSiteId: "kleast", materialId: "aggregate", qty: 20,
    status: "Collected", requiresApproval: false, createdAt: "2026-10-16",
    history: [ev("Matched", "2026-10-16", "Mei Ling Tan"), ev("Reserved", "2026-10-17", "Ravi Kumar"), ev("Collected", "2026-10-29", "Mei Ling Tan")],
  },
];

/** SIMULATED forecast history, used to show forecast accuracy before real data exists. */
export const forecastHistory: ForecastOutcome[] = [
  { forecastId: "hist-1", status: "Confirmed", forecastQty: 120, actualQty: 112, loggedAt: "2026-04-10", simulated: true, materialId: "plywood", siteId: "elmina" },
  { forecastId: "hist-2", status: "Revised", forecastQty: 60, actualQty: 44, loggedAt: "2026-05-02", simulated: true, materialId: "aggregate", siteId: "serenia" },
  { forecastId: "hist-3", status: "Confirmed", forecastQty: 35, actualQty: 38, loggedAt: "2026-06-05", simulated: true, materialId: "barrier", siteId: "sjcc" },
  { forecastId: "hist-4", status: "Confirmed", forecastQty: 28, actualQty: 25, loggedAt: "2026-06-30", simulated: true, materialId: "sand", siteId: "putra" },
  { forecastId: "hist-5", status: "Revised", forecastQty: 90, actualQty: 66, loggedAt: "2026-07-28", simulated: true, materialId: "kerb", siteId: "ainsdale" },
  { forecastId: "hist-6", status: "Confirmed", forecastQty: 10, actualQty: 9, loggedAt: "2026-08-20", simulated: true, materialId: "netting", siteId: "kleast" },
  { forecastId: "hist-7", status: "Confirmed", forecastQty: 80, actualQty: 76, loggedAt: "2026-09-12", simulated: true, materialId: "paver", siteId: "nilai" },
  { forecastId: "hist-8", status: "Revised", forecastQty: 320, actualQty: 260, loggedAt: "2026-10-01", simulated: true, materialId: "tile-wall", siteId: "elmina" },
  { forecastId: "hist-9", status: "Confirmed", forecastQty: 150, actualQty: 140, loggedAt: "2026-10-05", simulated: true, materialId: "paver", siteId: "bbr" },
  { forecastId: "hist-10", status: "Confirmed", forecastQty: 50, actualQty: 45, loggedAt: "2026-10-12", simulated: true, materialId: "prop", siteId: "kleast" },
];

/** What the Elmina engineer logs in the Guided Demo, three weeks later. */
export const HERO_ACTUAL_QTY = 820;
export const HERO_FORECAST_ID = "fc-elm-p3-tile";
