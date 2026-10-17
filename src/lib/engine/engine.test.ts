import { describe, expect, it } from "vitest";
import { HERO_INPUT, seedState } from "@/data/initial";
import { HERO_FORECAST_ID } from "@/data/seed";
import { computeForecasts, confidenceFor, expectedSurplusQty, forecastAccuracy, recordActual, riskLabel } from "./forecast";
import { haversineKm, siteDistanceKm } from "./geo";
import { matchNeed } from "./matching";
import { preOrderCheck } from "./preorder";
import { savingsFor } from "./savings";
import { nextStatus } from "./transfers";

const g = seedState().assumptions.global;

describe("forecast", () => {
  it("computes expected surplus from ordered vs planned plus wastage", () => {
    expect(expectedSurplusQty(5000, 4000, 0.05)).toBe(800);
    expect(expectedSurplusQty(600, 600, 0.08)).toBe(0);
    expect(expectedSurplusQty(100, 200, 0)).toBe(0);
  });

  it("raises confidence linearly with progress between the marks", () => {
    expect(confidenceFor(10, g)).toBe(0.3);
    expect(confidenceFor(24.9, g)).toBe(0.3);
    expect(confidenceFor(25, g)).toBe(0.3);
    expect(confidenceFor(62, g)).toBe(0.7);
    expect(confidenceFor(80, g)).toBe(0.9);
    expect(confidenceFor(100, g)).toBe(0.9);
  });

  it("labels risk from confidence", () => {
    expect(riskLabel(0.75, g)).toBe("High");
    expect(riskLabel(0.7, g)).toBe("Medium");
    expect(riskLabel(0.5, g)).toBe("Medium");
    expect(riskLabel(0.49, g)).toBe("Low");
  });

  it("produces the hero forecast with an explanation", () => {
    const s = seedState();
    const f = computeForecasts(s).find((x) => x.id === HERO_FORECAST_ID)!;
    expect(f.qty).toBe(800);
    expect(f.confidence).toBe(0.7);
    expect(f.availableFrom).toBe("2026-11-23");
    expect(f.explanation.join(" ")).toContain("5,000");
  });

  it("skips completed phases and zero surplus", () => {
    const s = seedState();
    const fs = computeForecasts(s);
    expect(fs.some((f) => f.phaseId === "elm-p2")).toBe(false);
    expect(fs.some((f) => f.planId === "elm-p3-ply")).toBe(false);
  });

  it("marks forecasts Confirmed or Revised against actuals", () => {
    const f = { id: "x", qty: 800, materialId: "tile-porcelain", siteId: "elmina" };
    expect(recordActual(f, 820, "2026-11-23", 15).status).toBe("Confirmed");
    expect(recordActual(f, 500, "2026-11-23", 15).status).toBe("Revised");
  });

  it("measures accuracy as 1 minus mean absolute percentage error", () => {
    expect(forecastAccuracy([])).toBeNull();
    const acc = forecastAccuracy([
      { forecastId: "a", status: "Confirmed", forecastQty: 100, actualQty: 90, loggedAt: "" },
      { forecastId: "b", status: "Revised", forecastQty: 100, actualQty: 70, loggedAt: "" },
    ])!;
    expect(acc).toBeCloseTo(0.8);
  });

  it("recalculates when an assumption changes", () => {
    const s = seedState();
    s.assumptions.materials["tile-porcelain"].wastageAllowance = 0.1;
    const f = computeForecasts(s).find((x) => x.id === HERO_FORECAST_ID)!;
    expect(f.qty).toBe(600);
  });
});

describe("geo", () => {
  it("computes haversine distance", () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111.19, 1);
  });
  it("keeps Elmina close to Bandar Bukit Raja and Ainsdale beyond the haul limit", () => {
    const s = seedState();
    expect(siteDistanceKm(s.sites, "elmina", "bbr")).toBeLessThan(20);
    expect(siteDistanceKm(s.sites, "ainsdale", "bbr")).toBeGreaterThan(60);
  });
});

describe("pre-order check: hero scenario", () => {
  it("reserves 800 and orders 200 by default", () => {
    const r = preOrderCheck(seedState(), { ...HERO_INPUT });
    expect(r.listingQty).toBe(0);
    expect(r.reservedForecast).toBe(800);
    expect(r.orderNow).toBe(200);
    expect(r.confidence).toBe(0.7);
    expect(r.risk).toBe("Medium");
    expect(r.decisionDate).toBe("2026-11-24");
    expect(r.forecasts[0].forecast.siteId).toBe("elmina");
  });

  it("reserves 560 and orders 440 in conservative mode", () => {
    const r = preOrderCheck(seedState(), { ...HERO_INPUT, conservative: true });
    expect(r.reservedForecast).toBe(560);
    expect(r.orderNow).toBe(440);
  });

  it("explains why other tile sources were excluded", () => {
    const r = preOrderCheck(seedState(), { ...HERO_INPUT });
    const reasons = r.exclusions.map((e) => `${e.id}:${e.reason}`).join("\n");
    expect(reasons).toMatch(/L15:.*haul limit/);
    expect(reasons).toMatch(/L19:.*reserved/);
    expect(reasons).toMatch(/fc-ser-1c-tile:.*later than/);
    expect(reasons).toMatch(/fc-ain-5-tile:.*haul limit/);
  });

  it("gives best case at full forecast and worst case at confidence-weighted quantity", () => {
    const r = preOrderCheck(seedState(), { ...HERO_INPUT });
    expect(r.bestCase.qty).toBe(800);
    expect(r.worstCase.qty).toBe(560);
    expect(r.bestCase.savedRm).toBeGreaterThan(r.worstCase.savedRm);
  });

  it("subtracts available listings before forecasts", () => {
    const s = seedState();
    s.listings.push({ ...s.listings[0], id: "LX", materialId: "tile-porcelain", siteId: "putra", qty: 150, status: "available" });
    const r = preOrderCheck(s, { ...HERO_INPUT });
    expect(r.listingQty).toBe(150);
    expect(r.reservedForecast).toBe(800);
    expect(r.orderNow).toBe(50);
  });

  it("does not double-reserve a forecast already held by another buyer", () => {
    const s = seedState();
    s.transfers.push({
      id: "TX", forecastId: HERO_FORECAST_ID, fromSiteId: "elmina", toSiteId: "putra", materialId: "tile-porcelain",
      qty: 300, status: "Matched", requiresApproval: false, createdAt: s.today, history: [],
    });
    const r = preOrderCheck(s, { ...HERO_INPUT });
    expect(r.reservedForecast).toBe(500);
    expect(r.orderNow).toBe(500);
  });

  it("changes when an assumption changes", () => {
    const s = seedState();
    s.assumptions.global.maxHaulKm = 10;
    const r = preOrderCheck(s, { ...HERO_INPUT });
    expect(r.reservedForecast).toBe(0);
    expect(r.orderNow).toBe(1000);
  });
});

describe("savings", () => {
  it("nets haul cost from purchase value", () => {
    const s = seedState();
    const sv = savingsFor("tile-porcelain", 800, 10, s.assumptions);
    expect(sv.valueRm).toBe(11200);
    expect(sv.trips).toBe(1);
    expect(sv.haulRm).toBe(80);
    expect(sv.savedRm).toBe(11120);
    expect(sv.tonnes).toBeCloseTo(6.4);
    expect(sv.co2eKg).toBeCloseTo(4992);
  });
  it("returns zero for zero quantity", () => {
    const sv = savingsFor("tile-porcelain", 0, 10, seedState().assumptions);
    expect(sv.savedRm).toBe(0);
    expect(sv.trips).toBe(0);
  });
});

describe("matching", () => {
  it("ranks plywood listings for the KL East need with explanations", () => {
    const s = seedState();
    const need = s.needs.find((n) => n.id === "N06")!;
    const { matches } = matchNeed(s, need);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].listing.materialId).toBe("plywood");
    expect(matches[0].explanation.length).toBeGreaterThan(2);
    for (let i = 1; i < matches.length; i++) expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
  });
  it("excludes listings beyond the haul limit", () => {
    const s = seedState();
    const need = s.needs.find((n) => n.id === "N17")!;
    const { matches, excluded } = matchNeed(s, need);
    expect(matches).toHaveLength(0);
    expect(excluded.some((e) => e.reason.includes("haul limit"))).toBe(true);
  });
  it("flags structural items for approval", () => {
    const s = seedState();
    const need = s.needs.find((n) => n.id === "N15")!;
    const { matches } = matchNeed(s, need);
    expect(matches[0].needsApproval).toBe(true);
  });
});

describe("transfer workflow", () => {
  it("forces engineer approval for structural items", () => {
    expect(nextStatus({ status: "Matched", requiresApproval: true, listingId: "L1" })).toBe("Awaiting approval");
    expect(nextStatus({ status: "Awaiting approval", requiresApproval: true, listingId: "L1" })).toBeNull();
    expect(nextStatus({ status: "Awaiting approval", requiresApproval: true, approvedBy: "Eng", listingId: "L1" })).toBe("Reserved");
  });
  it("runs Matched, Reserved, Collected, Completed for normal items", () => {
    expect(nextStatus({ status: "Matched", requiresApproval: false, listingId: "L1" })).toBe("Reserved");
    expect(nextStatus({ status: "Reserved", requiresApproval: false, listingId: "L1" })).toBe("Collected");
    expect(nextStatus({ status: "Collected", requiresApproval: false, listingId: "L1" })).toBe("Completed");
    expect(nextStatus({ status: "Completed", requiresApproval: false, listingId: "L1" })).toBeNull();
  });
  it("holds a forecast reservation at Matched until surplus is logged", () => {
    expect(nextStatus({ status: "Matched", requiresApproval: false })).toBeNull();
  });
});
