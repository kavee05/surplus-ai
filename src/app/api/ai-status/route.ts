import { NextResponse } from "next/server";
import { z } from "zod";
import { aiConfig } from "@/lib/ai/config";
import { failureMessage, generateStructured, type FailureCategory } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One tiny test call per instance every 10 minutes at most, so this route cannot burn credit. */
let lastCheck: { at: number; key: string; result: "ok" | FailureCategory } | null = null;
const CHECK_TTL = 10 * 60_000;

const Ping = z.object({ ok: z.boolean() });

/**
 * Safe diagnostics. Returns only non-secret facts: mode, provider, model name,
 * whether each variable exists (yes or no), and the category of one cached test call.
 * Never returns a key, a key length, or a raw provider error message.
 */
export async function GET(req: Request) {
  const cfg = aiConfig();
  const url = new URL(req.url);
  const wantCheck = url.searchParams.get("check") === "1";
  let check: string | undefined;
  if (wantCheck && cfg.live) {
    const cacheKey = `${cfg.provider}:${cfg.model}`;
    if (!lastCheck || lastCheck.key !== cacheKey || Date.now() - lastCheck.at > CHECK_TTL) {
      const r = await generateStructured(cfg, {
        schema: Ping,
        wire: Ping,
        geminiSchema: { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } }, required: ["ok"] },
        system: "Return JSON only.",
        text: 'Return {"ok": true}.',
        timeoutMs: 10_000,
      });
      lastCheck = { at: Date.now(), key: cacheKey, result: r.ok ? "ok" : r.category };
    }
    check = lastCheck.result;
  }
  return NextResponse.json(
    {
      mode: cfg.live ? "live" : "demo",
      provider: cfg.provider,
      model: cfg.model,
      reason: cfg.offReason ?? (check && check !== "ok" ? `Live AI is configured but the test call failed: ${failureMessage[check as FailureCategory]}.` : null),
      check: check ?? (wantCheck ? "skipped (live AI is off)" : "not run (add ?check=1)"),
      variables: {
        LIVE_AI_true: cfg.env.liveFlag,
        LLM_PROVIDER: cfg.env.provider,
        GEMINI_API_KEY: cfg.env.geminiKey,
        ANTHROPIC_API_KEY: cfg.env.anthropicKey,
        MODEL_OVERRIDE: cfg.env.model,
        LIVE_AI_DAILY_CAP: cfg.env.dailyCap,
        UPSTASH: cfg.env.upstash,
      },
      limits: { dailyCap: cfg.dailyCap, perIpPer10Min: cfg.perIpLimit, sharedCounter: cfg.env.upstash },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
