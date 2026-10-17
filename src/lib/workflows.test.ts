import { describe, expect, it } from "vitest";
import { HERO_INPUT, seedState } from "@/data/initial";
import { makeDecision } from "./decisions";
import { preOrderCheck } from "./engine/preorder";
import { explainPreOrder } from "./explain/builders";
import { reducer } from "./store";

describe("human control workflows", () => {
  it("rejecting a transfer cancels it, frees the listing and reopens the need", () => {
    const s = seedState();
    const next = reducer(s, { type: "rejectTransfer", id: "T04", by: "Test", reason: "No longer needed" });
    const t = next.transfers.find((x) => x.id === "T04")!;
    expect(t.status).toBe("Cancelled");
    expect(t.history.at(-1)?.note).toBe("No longer needed");
    expect(next.listings.find((l) => l.id === "L06")?.status).toBe("available");
    expect(next.needs.find((n) => n.id === "N04")?.status).toBe("open");
  });

  it("does not cancel a completed transfer", () => {
    const s = seedState();
    expect(reducer(s, { type: "rejectTransfer", id: "T01", by: "Test", reason: "x" })).toBe(s);
  });

  it("records a decision with the recommendation exactly as shown", () => {
    const s = seedState();
    const e = explainPreOrder(preOrderCheck(s, { ...HERO_INPUT }), s);
    const d = makeDecision({ e, kind: "preorder", outcome: "rejected", subjectId: "x", subjectLabel: "x", by: "Test", role: "procurement", today: s.today, reason: "  Need date too tight  " });
    const next = reducer(s, { type: "logDecision", decision: d });
    expect(next.decisions[0].recommendation).toBe(e.recommendation);
    expect(next.decisions[0].certainty).toBe("moderate");
    expect(next.decisions[0].reason).toBe("Need date too tight");
  });

  it("dismisses and restores a match", () => {
    const s = seedState();
    const a = reducer(s, { type: "dismissMatch", needId: "N06", listingId: "L01", reason: "Wrong grade", by: "Test" });
    expect(a.dismissedMatches.some((d) => d.needId === "N06" && d.listingId === "L01")).toBe(true);
    const b = reducer(a, { type: "restoreMatch", needId: "N06", listingId: "L01" });
    expect(b.dismissedMatches.some((d) => d.needId === "N06" && d.listingId === "L01")).toBe(false);
  });
});
