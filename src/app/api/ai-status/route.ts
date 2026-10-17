import { NextResponse } from "next/server";
import { z } from "zod";
import { aiConfig, DEFAULT_GEMINI_MODEL } from "@/lib/ai/config";
import { failureMessage, generateStructured, recentFailures, type FailureCategory } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One tiny test call per instance every 10 minutes at most, so this route cannot burn credit. */
let lastCheck: { at: number; model: string; result: "ok" | FailureCategory; status?: number } | null = null;
const CHECK_TTL = 10 * 60_000;
const Ping = z.object({ ok: z.boolean() });

/** Current stable Gemini models with image input, from Google's model list (October 2026). */
const KNOWN_GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-4-argon"];

/**
 * Safe diagnostics for live AI.
 * Production: mode, model, plain reason, and the category of one cached test call.
 * Preview and local development (VERCEL_ENV is "preview" or not on Vercel): also
 * non-secret setup details. Never returns a key, any part of a key, or its length.
 */
export async function GET(req: Request) {
  const cfg = aiConfig();
  const url = new URL(req.url);
  const wantCheck = url.searchParams.get("check") === "1";
  const vercelEnv = process.env.VERCEL_ENV ?? "local";
  const detailed = vercelEnv !== "production";

  let check: string | undefined;
  if (wantCheck && cfg.live) {
    if (!lastCheck || lastCheck.model !== cfg.model || Date.now() - lastCheck.at > CHECK_TTL) {
      const r = await generateStructured(cfg, {
        schema: Ping,
        geminiSchema: { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } }, required: ["ok"] },
        system: "Return JSON only.",
        text: 'Return {"ok": true}.',
        timeoutMs: 10_000,
      });
      lastCheck = { at: Date.now(), model: cfg.model, result: r.ok ? "ok" : r.category, status: r.ok ? undefined : r.status };
    }
    check = lastCheck.result;
  }

  const reason = cfg.offReason ?? (check && check !== "ok" ? `Live AI is configured but the test call failed: ${failureMessage[check as FailureCategory]}.` : null);
  const base = {
    mode: cfg.live ? "live" : "demo",
    model: cfg.model,
    reason,
    check: check ?? (wantCheck ? "skipped (live AI is off)" : "not run (add ?check=1)"),
  };
  if (!detailed) return NextResponse.json(base, { headers: { "Cache-Control": "no-store" } });

  const rawLive = process.env.LIVE_AI;
  const rawKey = process.env.GEMINI_API_KEY ?? "";
  return NextResponse.json(
    {
      ...base,
      environment: vercelEnv,
      deployment: {
        branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
        region: process.env.VERCEL_REGION ?? null,
      },
      variables: {
        LIVE_AI: { set: rawLive !== undefined, value: rawLive === undefined ? null : rawLive.trim().slice(0, 8), readAsTrue: cfg.env.liveFlag },
        GEMINI_API_KEY: {
          set: cfg.env.geminiKey,
          looksLikeGoogleKey: cfg.key.startsWith("AIza"),
          hadSpacesOrQuotes: rawKey !== "" && rawKey !== cfg.key,
        },
        GEMINI_MODEL: { set: cfg.env.model, inUse: cfg.model, isDefault: cfg.model === DEFAULT_GEMINI_MODEL, knownCurrentModel: KNOWN_GEMINI_MODELS.includes(cfg.model) },
        LIVE_AI_DAILY_CAP: { set: cfg.env.dailyCap, inUse: cfg.dailyCap },
        UPSTASH: { set: cfg.env.upstash },
      },
      limits: { dailyCap: cfg.dailyCap, perIpPer10Min: cfg.perIpLimit, sharedCounter: cfg.env.upstash },
      lastCheck: lastCheck ? { at: new Date(lastCheck.at).toISOString(), result: lastCheck.result, httpStatus: lastCheck.status ?? null } : null,
      recentFailures,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
