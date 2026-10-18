import { describe, expect, it } from "vitest";
import { seedState, STATE_VERSION } from "@/data/initial";
import { invalidReason, loadState } from "./persist";

describe("loadState", () => {
  it("starts fresh when nothing is saved", () => {
    expect(loadState(null).status).toBe("fresh");
  });

  it("restores a valid saved state", () => {
    const s = { ...seedState(), role: "engineer" as const };
    const r = loadState(JSON.stringify(s));
    expect(r.status).toBe("restored");
    expect(r.state.role).toBe("engineer");
  });

  it("resets corrupt JSON with a reason", () => {
    const r = loadState("{not json");
    expect(r.status).toBe("reset");
    expect(r.reason).toMatch(/could not be read/);
    expect(r.state.version).toBe(STATE_VERSION);
  });

  it("resets a state from a newer, unknown version", () => {
    expect(loadState(JSON.stringify({ ...seedState(), version: STATE_VERSION + 1 })).status).toBe("reset");
  });

  it("resets a state with missing or broken records", () => {
    const s = seedState();
    expect(loadState(JSON.stringify({ ...s, transfers: undefined })).status).toBe("reset");
    expect(loadState(JSON.stringify({ ...s, role: "admin" })).status).toBe("reset");
    const broken = { ...s, transfers: [{ ...s.transfers[0], materialId: "nope" }] };
    expect(invalidReason(broken)).toMatch(/unknown record/);
  });

  it("migrates version 1 by adding the decision log", () => {
    const s = seedState() as unknown as Record<string, unknown>;
    const v1: Record<string, unknown> = { ...s, version: 1 };
    delete v1.decisions;
    delete v1.dismissedMatches;
    const r = loadState(JSON.stringify(v1));
    expect(r.status).toBe("migrated");
    expect(r.state.version).toBe(STATE_VERSION);
    expect(r.state.decisions).toEqual([]);
  });
});
