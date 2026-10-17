import { describe, expect, it } from "vitest";
import { HERO_INPUT, seedState } from "@/data/initial";
import { heroReservation } from "@/lib/actions";
import { impactSummary } from "./impact";
import { preOrderCheck } from "./preorder";
import { decisionQueue, impactStages } from "./queue";

describe("decision queue", () => {
  it("puts engineer approvals first and links to the record", () => {
    const q = decisionQueue(seedState());
    expect(q[0].kind).toBe("approval");
    expect(q[0].href).toBe("/app/transfers?transfer=T06");
    expect(q.some((i) => i.kind === "unclaimed")).toBe(true);
  });

  it("only surfaces matches with strong or moderate evidence, and skips rejected ones", () => {
    const s = seedState();
    const q = decisionQueue(s);
    for (const i of q.filter((x) => x.kind === "match")) expect(["strong", "moderate"]).toContain(i.certainty);
    expect(q.some((i) => i.id === "match-N02" && i.detail.includes("Bandar Ainsdale"))).toBe(false);
  });

  it("adds a forecast decision with the Pre-Order decision date after a hold", () => {
    const s = seedState();
    s.transfers.push(heroReservation(s.today));
    const item = decisionQueue(s).find((i) => i.kind === "forecast-decision")!;
    const r = preOrderCheck(s, { ...HERO_INPUT });
    expect(item.action).toBe("Confirm or top up by 24 Nov 2026");
    expect(r.decisionDate).toBe("2026-11-24");
    expect(item.dueInDays).toBe(22);
  });
});

describe("impact stages", () => {
  it("reconciles achieved with the Impact totals and keeps stages separate", () => {
    const s = seedState();
    const st = impactStages(s);
    expect(st.achieved.savedRm).toBeCloseTo(impactSummary(s).savedRm);
    expect(st.achieved.count).toBe(11);
    s.transfers.push(heroReservation(s.today));
    const st2 = impactStages(s);
    expect(st2.onForecast.count).toBe(1);
    expect(st2.achieved.savedRm).toBeCloseTo(st.achieved.savedRm);
  });
});
