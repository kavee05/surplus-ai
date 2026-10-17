/**
 * Server-only AI configuration. Never import this from a client component:
 * it reads API keys from the environment. Values are read at request time,
 * so a Vercel redeploy picks up changed variables without code changes.
 */

export type Provider = "gemini" | "anthropic";

export const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: "gemini-3.5-flash-lite",
  anthropic: "claude-opus-5-5",
};

const truthy = (v: string | undefined) => /^(true|1|yes|on)$/i.test((v ?? "").trim());
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "");

export interface AiConfig {
  live: boolean;
  provider: Provider;
  model: string;
  key: string;
  dailyCap: number;
  perIpLimit: number;
  /** Plain-language reason live AI is off, or null when it is on. */
  offReason: string | null;
  env: { liveFlag: boolean; provider: boolean; geminiKey: boolean; anthropicKey: boolean; model: boolean; dailyCap: boolean; upstash: boolean };
}

export function aiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const provider: Provider = clean(env.LLM_PROVIDER).toLowerCase() === "anthropic" ? "anthropic" : "gemini";
  const key = provider === "gemini" ? clean(env.GEMINI_API_KEY) : clean(env.ANTHROPIC_API_KEY);
  const modelEnv = provider === "gemini" ? clean(env.GEMINI_MODEL) : clean(env.ANTHROPIC_MODEL);
  const liveFlag = truthy(env.LIVE_AI);
  const capRaw = Number.parseInt(clean(env.LIVE_AI_DAILY_CAP), 10);
  const offReason = !liveFlag
    ? "Live AI is off in this deployment (LIVE_AI is not set to true)."
    : !key
      ? `Live AI is off: no ${provider === "gemini" ? "Gemini" : "Anthropic"} API key is configured.`
      : null;
  return {
    live: offReason === null,
    provider,
    model: modelEnv || DEFAULT_MODELS[provider],
    key,
    dailyCap: Number.isFinite(capRaw) && capRaw > 0 ? capRaw : 200,
    perIpLimit: 10,
    offReason,
    env: {
      liveFlag,
      provider: !!clean(env.LLM_PROVIDER),
      geminiKey: !!clean(env.GEMINI_API_KEY),
      anthropicKey: !!clean(env.ANTHROPIC_API_KEY),
      model: !!modelEnv,
      dailyCap: !!clean(env.LIVE_AI_DAILY_CAP),
      upstash: !!clean(env.UPSTASH_REDIS_REST_URL) && !!clean(env.UPSTASH_REDIS_REST_TOKEN),
    },
  };
}
