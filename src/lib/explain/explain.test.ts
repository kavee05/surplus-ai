import { describe, expect, it } from "vitest";
import { HERO_INPUT, seedState } from "@/data/initial";
import { HERO_FORECAST_ID } from "@/data/seed";
import { samples, uploadFallback } from "@/lib/ai/samples";
import { computeForecasts } from "@/lib/engine/forecast";
import { matchNeed } from "@/lib/engine/matching";
import { preOrderCheck } from "@/lib/engine/preorder";
import { savingsFor } from "@/lib/engine/savings";
import { explainForecast, explainMatch, explainPhoto, explainPreOrder, explainTransferImpact, STALE_PROGRESS_DAYS } from "./builders";
import type { Explanation } from "./types";

const shapeOk = (e: Explanation) => {
  expect(e.recommendation.length).toBeGreaterThan(10);
  expect(e.method.length).toBeGreaterThan(10);
  expect(e.certainty.calibrated).toBe(false);
  expect(["strong", "moderate", "tentative", "insufficient"]).toContain(e.certainty.level);
};

describe("forecast explanation", () => {
  it("restates the engine's arithmetic and inputs", () => {
    const s = seedState();
    const f = computeForecasts(s).find((x) => x.id === HERO_FORECAST_ID)!;
    const e = explainForecast(f, s);
    shapeOk(e);
    expect(e.recommendation).toContain("800");
    expect(e.calculations.map((c) => c.result).join(" ")).toContain("800");
    expect(e.facts.find((x) => x.label === "Ordered")?.value).toContain("5,000");
    expect(e.evidence.some((x) => x.kind === "purchase-plan" && x.provenance === "recorded")).toBe(true);
    expect(e.certainty.level).toBe("moderate");
    expect(e.certainty.score?.label).toMatch(/not a calibrated probability/);
  });

  it("downgrades certainty and flags stale progress", () => {
    const s = seedState();
    const f = computeForecasts(s).find((x) => x.phaseId === "kle-2")!;
    const e = explainForecast(f, s);
    expect(e.certainty.level).toBe("tentative");
    expect(e.reasons.some((r) => r.code === "STALE_PROGRESS")).toBe(true);
    expect(e.evidence.find((x) => x.kind === "phase")?.stale).toBe(true);
    expect(e.certainty.missing.join(" ")).toMatch(new RegExp(`last reported \\d+ days ago`));
    expect(STALE_PROGRESS_DAYS).toBe(21);
  });

  it("treats a missing progress date as insufficient freshness", () => {
    const s = seedState();
    s.phases = s.phases.map((p) => (p.id === "elm-p3" ? { ...p, progressAsOf: undefined } : p));
    const f = computeForecasts(s).find((x) => x.id === HERO_FORECAST_ID)!;
    const e = explainForecast(f, s);
    expect(e.certainty.level).toBe("tentative");
    expect(e.certainty.missing).toContain("Phase progress has no reported date.");
  });
});

describe("pre-order explanation", () => {
  it("matches the hero result exactly", () => {
    const s = seedState();
    const r = preOrderCheck(s, { ...HERO_INPUT });
    const e = explainPreOrder(r, s);
    shapeOk(e);
    expect(e.recommendation).toBe("For 1,000 pcs at Bandar Bukit Raja: reserve 800 from forecast surplus, order 200 new.");
    expect(e.calculations.find((c) => c.label === "Order now")?.result).toBe("200 pcs");
    expect(e.calculations.find((c) => c.label === "Decision date")?.result).toBe("24 Nov 2026");
    expect(e.requiresHumanApproval).toBe(true);
    expect(e.evidence.some((x) => x.id === HERO_FORECAST_ID)).toBe(true);
    expect(e.evidence.some((x) => x.id === "N01" && x.kind === "need")).toBe(true);
  });

  it("lists excluded sources as alternatives with the engine's reason", () => {
    const s = seedState();
    const r = preOrderCheck(s, { ...HERO_INPUT });
    const e = explainPreOrder(r, s);
    const excluded = e.alternatives.filter((a) => a.excludedReason);
    expect(excluded.length).toBe(r.exclusions.length);
    expect(excluded.find((a) => a.id === "L15")?.excludedReason).toMatch(/haul limit/);
    expect(e.alternatives.some((a) => a.id === "order-all")).toBe(true);
    expect(e.alternatives.find((a) => a.id === "conservative")?.summary).toBe("Reserve 560, order 440 now.");
  });

  it("is honest when nothing can be reserved", () => {
    const s = seedState();
    s.assumptions.global.maxHaulKm = 5;
    const r = preOrderCheck(s, { ...HERO_INPUT });
    const e = explainPreOrder(r, s);
    expect(r.orderNow).toBe(1000);
    expect(e.recommendation).toContain("order 1,000 new");
    expect(e.certainty.score).toBeUndefined();
    expect(e.outcome).toMatch(/Nothing to reserve/);
  });
});

describe("match explanation", () => {
  it("reflects the matcher's score, distance and alternatives", () => {
    const s = seedState();
    const need = s.needs.find((n) => n.id === "N06")!;
    const { matches } = matchNeed(s, need);
    const e = explainMatch(matches[0], need, matches, s);
    shapeOk(e);
    expect(e.certainty.score?.value).toBe(matches[0].score);
    expect(e.alternatives).toHaveLength(matches.length);
    expect(e.alternatives.filter((a) => a.chosen)).toHaveLength(1);
    expect(e.evidence.map((x) => x.kind).sort()).toEqual(["listing", "need"]);
  });

  it("marks structural matches tentative and blocked until approval", () => {
    const s = seedState();
    const need = s.needs.find((n) => n.id === "N15")!;
    const { matches } = matchNeed(s, need);
    const e = explainMatch(matches[0], need, matches, s);
    expect(e.certainty.level).toBe("tentative");
    expect(e.reasons.some((r) => r.effect === "blocks")).toBe(true);
    expect(e.approvalReason).toMatch(/engineer/);
  });
});

describe("photo explanation", () => {
  it("never presents the model score as calibrated", () => {
    const e = explainPhoto(samples[0].result, "demo", seedState());
    expect(e.certainty.level).toBe("tentative");
    expect(e.certainty.score?.label).toMatch(/canned, not measured/);
    expect(e.facts.every((f) => f.provenance === "demo")).toBe(true);
    const live = explainPhoto(samples[0].result, "live", seedState());
    expect(live.certainty.score?.label).toMatch(/self-reported, not calibrated/);
  });

  it("reports insufficient evidence for an unrecognised photo", () => {
    const e = explainPhoto(uploadFallback, "demo", seedState());
    expect(e.certainty.level).toBe("insufficient");
    expect(e.certainty.score).toBeUndefined();
  });

  it("flags a unit mismatch from the model", () => {
    const e = explainPhoto({ ...samples[0].result, unit: "boxes" }, "live", seedState());
    expect(e.limitations.join(" ")).toMatch(/answered in boxes/);
  });
});

describe("transfer impact explanation", () => {
  it("reconciles with the savings engine and says when it is counted", () => {
    const s = seedState();
    const t = s.transfers.find((x) => x.id === "T01")!;
    const e = explainTransferImpact(t, s);
    const expected = savingsFor(t.materialId, t.qty, 0, s.assumptions);
    expect(e.recommendation).toMatch(/^Counted/);
    expect(e.calculations[0].result).toBe(`RM ${expected.valueRm.toLocaleString("en-MY")}`);
    const pending = explainTransferImpact(s.transfers.find((x) => x.id === "T04")!, s);
    expect(pending.recommendation).toMatch(/^Not yet counted/);
  });
});
