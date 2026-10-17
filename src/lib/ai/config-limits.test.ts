import { describe, expect, it } from "vitest";
import { aiConfig, DEFAULT_MODELS } from "./config";
import { checkLimits, memoryStore } from "./limits";

describe("aiConfig", () => {
  it("is off with a plain reason when LIVE_AI is missing or not true", () => {
    expect(aiConfig({}).live).toBe(false);
    expect(aiConfig({}).offReason).toMatch(/LIVE_AI is not set to true/);
    expect(aiConfig({ LIVE_AI: "false", GEMINI_API_KEY: "k" }).live).toBe(false);
  });

  it("tolerates case, spaces and quotes in LIVE_AI and keys", () => {
    const c = aiConfig({ LIVE_AI: " TRUE ", GEMINI_API_KEY: ' "abc" ' });
    expect(c.live).toBe(true);
    expect(c.key).toBe("abc");
  });

  it("explains a missing key for the chosen provider", () => {
    const c = aiConfig({ LIVE_AI: "true", LLM_PROVIDER: "anthropic", GEMINI_API_KEY: "k" });
    expect(c.live).toBe(false);
    expect(c.offReason).toMatch(/no Anthropic API key/);
  });

  it("defaults models and daily cap, and reports only booleans for variables", () => {
    const c = aiConfig({ LIVE_AI: "true", GEMINI_API_KEY: "secret" });
    expect(c.model).toBe(DEFAULT_MODELS.gemini);
    expect(c.dailyCap).toBe(200);
    expect(Object.values(c.env).every((v) => typeof v === "boolean")).toBe(true);
    expect(JSON.stringify(c.env)).not.toContain("secret");
    expect(aiConfig({ LIVE_AI_DAILY_CAP: "abc" }).dailyCap).toBe(200);
    expect(aiConfig({ LIVE_AI_DAILY_CAP: "5" }).dailyCap).toBe(5);
  });
});

describe("usage limits", () => {
  it("blocks after the per-IP limit within the window", async () => {
    const store = memoryStore(() => 0);
    for (let i = 0; i < 3; i++) expect((await checkLimits(store, "1.1.1.1", { perIp: 3, dailyCap: 100, now: 0 })).ok).toBe(true);
    const r = await checkLimits(store, "1.1.1.1", { perIp: 3, dailyCap: 100, now: 0 });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe("ip");
    expect((await checkLimits(store, "2.2.2.2", { perIp: 3, dailyCap: 100, now: 0 })).ok).toBe(true);
  });

  it("enforces the global daily cap across IPs and resets the next day", async () => {
    let t = Date.parse("2026-10-20T10:00:00Z");
    const store = memoryStore(() => t);
    for (let i = 0; i < 2; i++) expect((await checkLimits(store, `ip${i}`, { perIp: 10, dailyCap: 2, now: t })).ok).toBe(true);
    const capped = await checkLimits(store, "ip9", { perIp: 10, dailyCap: 2, now: t });
    expect(capped.ok).toBe(false);
    expect(!capped.ok && capped.reason).toBe("daily");
    t = Date.parse("2026-10-21T10:00:00Z");
    expect((await checkLimits(store, "ip9", { perIp: 10, dailyCap: 2, now: t })).ok).toBe(true);
  });

  it("fails closed when the shared counter is unavailable", async () => {
    const broken = { shared: true, incr: async () => Promise.reject(new Error("down")) };
    const r = await checkLimits(broken, "x", { perIp: 10, dailyCap: 10 });
    expect(r.ok).toBe(false);
  });
});
