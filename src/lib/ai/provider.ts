import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { AiConfig } from "./config";

/** Why a live call failed, in categories safe to show and log. Never contains a key. */
export type FailureCategory = "auth" | "bad-model" | "quota" | "timeout" | "invalid-output" | "refused" | "provider-error" | "network";

export const failureMessage: Record<FailureCategory, string> = {
  auth: "the API key was rejected",
  "bad-model": "the configured model name is not available",
  quota: "the provider's rate limit or quota was reached",
  timeout: "the AI service took too long to answer",
  "invalid-output": "the AI answer did not match the expected format",
  refused: "the AI declined this request",
  "provider-error": "the AI service returned an error",
  network: "the AI service could not be reached",
};

export type StructuredResult<T> = { ok: true; data: T; provider: string; model: string } | { ok: false; category: FailureCategory; status?: number };

export interface StructuredRequest<T> {
  /** Strict schema the final result must satisfy. */
  schema: z.ZodType<T>;
  /** Looser schema sent to the provider as the output format (no numeric bounds). */
  wire: z.ZodObject;
  /** Gemini response schema (OpenAPI subset). */
  geminiSchema: Record<string, unknown>;
  system: string;
  /** User content. Always treated by the prompt as data, not instructions. */
  text: string;
  image?: { mimeType: "image/jpeg" | "image/png" | "image/webp"; data: string };
  timeoutMs?: number;
  /** Fix small format slips (for example 82 instead of 0.82) before strict validation. */
  normalize?: (raw: Record<string, unknown>) => Record<string, unknown>;
}

const TRANSIENT: FailureCategory[] = ["timeout", "provider-error", "network", "invalid-output"];

export async function generateStructured<T>(cfg: AiConfig, req: StructuredRequest<T>): Promise<StructuredResult<T>> {
  const run = cfg.provider === "anthropic" ? callAnthropic : callGemini;
  let res = await run(cfg, req);
  if (!res.ok && TRANSIENT.includes(res.category)) res = await run(cfg, req); // one retry
  return res;
}

function categoryFromStatus(status: number, message = ""): FailureCategory {
  if (status === 401 || status === 403) return "auth";
  if (status === 404 || (status === 400 && /model/i.test(message))) return "bad-model";
  if (status === 429) return "quota";
  if (status === 408 || status === 504) return "timeout";
  return "provider-error";
}

async function callGemini<T>(cfg: AiConfig, req: StructuredRequest<T>): Promise<StructuredResult<T>> {
  const parts: unknown[] = [{ text: req.text }];
  if (req.image) parts.push({ inlineData: { mimeType: req.image.mimeType, data: req.image.data } });
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", responseSchema: req.geminiSchema, temperature: 0.2, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(req.timeoutMs ?? 20_000),
    });
  } catch (e) {
    return { ok: false, category: e instanceof DOMException && e.name === "TimeoutError" ? "timeout" : "network" };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { ok: false, category: categoryFromStatus(res.status, body?.error?.message), status: res.status };
  }
  const json = (await res.json().catch(() => null)) as { candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[] } | null;
  const cand = json?.candidates?.[0];
  if (cand?.finishReason === "SAFETY" || cand?.finishReason === "PROHIBITED_CONTENT") return { ok: false, category: "refused" };
  const text = (cand?.content?.parts ?? []).filter((p) => p.text && !p.thought).pop()?.text;
  return finish(text, req, cfg);
}

async function callAnthropic<T>(cfg: AiConfig, req: StructuredRequest<T>): Promise<StructuredResult<T>> {
  const client = new Anthropic({ apiKey: cfg.key, timeout: req.timeoutMs ?? 25_000, maxRetries: 0 });
  const content: Anthropic.ContentBlockParam[] = [];
  if (req.image) content.push({ type: "image", source: { type: "base64", media_type: req.image.mimeType, data: req.image.data } });
  content.push({ type: "text", text: req.text });
  try {
    const response = await client.messages.parse({
      model: cfg.model,
      max_tokens: 8000,
      system: req.system,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(req.wire), effort: "low" },
    });
    if (response.stop_reason === "refusal") return { ok: false, category: "refused" };
    if (response.parsed_output == null) return { ok: false, category: "invalid-output" };
    const parsed = req.schema.safeParse(req.normalize ? req.normalize({ ...(response.parsed_output as Record<string, unknown>) }) : response.parsed_output);
    return parsed.success ? { ok: true, data: parsed.data, provider: cfg.provider, model: cfg.model } : { ok: false, category: "invalid-output" };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) return { ok: false, category: "auth", status: error.status };
    if (error instanceof Anthropic.NotFoundError) return { ok: false, category: "bad-model", status: 404 };
    if (error instanceof Anthropic.RateLimitError) return { ok: false, category: "quota", status: 429 };
    if (error instanceof Anthropic.BadRequestError) return { ok: false, category: categoryFromStatus(400, error.message), status: 400 };
    if (error instanceof Anthropic.APIConnectionTimeoutError) return { ok: false, category: "timeout" };
    if (error instanceof Anthropic.APIConnectionError) return { ok: false, category: "network" };
    if (error instanceof Anthropic.APIError) return { ok: false, category: "provider-error", status: error.status };
    return { ok: false, category: "invalid-output" };
  }
}

function finish<T>(text: string | undefined, req: StructuredRequest<T>, cfg: AiConfig): StructuredResult<T> {
  if (!text) return { ok: false, category: "invalid-output" };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, category: "invalid-output" };
  }
  const parsed = req.schema.safeParse(req.normalize && raw && typeof raw === "object" ? req.normalize({ ...(raw as Record<string, unknown>) }) : raw);
  return parsed.success ? { ok: true, data: parsed.data, provider: cfg.provider, model: cfg.model } : { ok: false, category: "invalid-output" };
}
