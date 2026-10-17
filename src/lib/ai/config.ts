/**
 * Server-only AI configuration. Never import this from a client component:
 * it reads the API key from the environment. Values are read at request time,
 * so a Vercel redeploy picks up changed variables without code changes.
 *
 * Surplus AI uses the Google Gemini API only.
 */

/** Current fast, multimodal Gemini model (stable, no shutdown date announced as of Oct 2026). */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

const truthy = (v: string | undefined) => /^(true|1|yes|on)$/i.test((v ?? "").trim());
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "");

export interface AiConfig {
  live: boolean;
  model: string;
  key: string;
  dailyCap: number;
  perIpLimit: number;
  /** Plain-language reason live AI is off, or null when it is on. */
  offReason: string | null;
  env: { liveFlag: boolean; geminiKey: boolean; model: boolean; dailyCap: boolean; upstash: boolean };
}

export function aiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const key = clean(env.GEMINI_API_KEY);
  const modelEnv = clean(env.GEMINI_MODEL);
  const liveFlag = truthy(env.LIVE_AI);
  const capRaw = Number.parseInt(clean(env.LIVE_AI_DAILY_CAP), 10);
  const offReason = !liveFlag
    ? "Live AI is off in this deployment (LIVE_AI is not set to true)."
    : !key
      ? "Live AI is off: no Gemini API key is configured (GEMINI_API_KEY)."
      : null;
  return {
    live: offReason === null,
    model: modelEnv || DEFAULT_GEMINI_MODEL,
    key,
    dailyCap: Number.isFinite(capRaw) && capRaw > 0 ? capRaw : 200,
    perIpLimit: 10,
    offReason,
    env: {
      liveFlag,
      geminiKey: !!key,
      model: !!modelEnv,
      dailyCap: !!clean(env.LIVE_AI_DAILY_CAP),
      upstash: !!clean(env.UPSTASH_REDIS_REST_URL) && !!clean(env.UPSTASH_REDIS_REST_TOKEN),
    },
  };
}
