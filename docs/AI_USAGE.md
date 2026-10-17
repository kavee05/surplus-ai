# How Surplus AI uses AI

Principle: **AI reads messy input and writes plain-language summaries. Deterministic code calculates. People approve.** The AI never sets a quantity, never chooses what to reserve, and never takes an action.

## Every AI use

| Feature | Where | What the model does | What it cannot do | Fallback |
| --- | --- | --- | --- | --- |
| Photo intake | Log surplus (`/app/surplus/log`), `/api/analyze-photo` | Suggests item, condition, estimated quantity and whether engineer approval is needed, from an uploaded photo | Save anything. The engineer checks, edits and ticks a confirmation box first | Demo mode: sample photos return pre-written results; uploads ask the user to fill in details, with the reason shown |
| Request reader | Ask Surplus AI on Radar and Overview, `/api/ask` (`parse`) | Turns a sentence into material, site, quantity, date and phase hint | Invent catalogue values (they are replaced from the rule-based reader), or trigger any action | Rule-based reader in `src/lib/ai/ask.ts` |
| Summary writer | Ask Surplus AI, `/api/ask` (`brief`) | Writes a 2 to 3 sentence briefing from the engine's structured result only (it never sees the user's sentence) | Change numbers. Every number and date must appear in the engine's facts or the text is discarded | Deterministic template summary, always computed first |

Not AI, on purpose: forecasting, the Pre-Order Check, matching, ranking, savings and carbon, certainty levels, the decision queue. These are plain TypeScript in `src/lib/engine` and `src/lib/explain` with unit tests, because a buyer has to be able to check the quantity.

## Providers and configuration

`src/lib/ai/provider.ts` supports two providers behind one function:

- **Gemini** (default) over the REST API, model from `GEMINI_MODEL` (default `gemini-3.5-flash-lite`).
- **Anthropic** through the official `@anthropic-ai/sdk` with structured output (`messages.parse` + `zodOutputFormat`), model from `ANTHROPIC_MODEL` (default `claude-opus-5-5`; set `claude-haiku-5-5` for lower cost).

Choose with `LLM_PROVIDER=gemini` or `anthropic`. Live AI runs only when `LIVE_AI=true` and the provider's key is set. Keys are read on the server only, at request time.

Every call has a timeout (15 to 25 seconds), one retry for transient failures, and strict zod validation of the output. Failures are reported as a category (auth, bad model, quota, timeout, invalid output, refused, provider error, network) and never include a key or raw provider message.

## Guardrails

- **Untrusted input.** Photos, text inside photos, and user sentences are treated as data. Prompts say so, outputs are schema-validated, catalogue values are checked against the real lists, and the model has no tools or actions.
- **Number guard.** `verifyBriefing` accepts a summary only if every number and day-month date in it appears in the engine's facts (normal rounding allowed). Otherwise the template is shown with the label "Template summary".
- **Labels.** Every AI surface shows a Live AI or Demo mode badge. Summaries are labelled "AI-written summary, numbers verified against the engine" or "Template summary". Photo quantities are labelled estimates; model confidence is labelled "the model's own estimate, not calibrated".
- **Usage limits.** 10 live calls per IP per 10 minutes and a global daily cap (`LIVE_AI_DAILY_CAP`, default 200). Counts are shared across serverless instances when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set; otherwise they are kept in memory per instance, which is best-effort only. If the shared counter is unreachable, live AI pauses (fails closed). When a limit is hit, the app switches to demo behaviour and says why.
- **Request size.** Photos are resized in the browser to 1280 px JPEG; the server rejects bodies above about 4.2 MB (Vercel's limit is 4.5 MB).
- **Human approval.** Holds, matches and transfers need explicit confirmation; rejections need a reason; every decision is logged on the Activity page.

## Diagnostics

`GET /api/ai-status` returns the mode, provider, model name, whether each variable exists (true or false), and the usage limits. `GET /api/ai-status?check=1` also runs one tiny test call (cached for 10 minutes per instance) and reports `ok` or a failure category. It never returns a key or its length.

## Tests

`src/lib/ai/*.test.ts` cover configuration parsing, per-IP and daily limits (including failing closed), the rule-based reader, catalogue validation, clarifying questions, prompt-injection text, the number guard, the template summary, and route-level fallbacks with a mocked provider.

## Limits

- Photo quantities from a model are rough; they are estimates for a person to correct.
- The rule-based reader understands common phrasings only. It asks a question when it cannot read a field.
- The in-memory limiter is not shared across instances. Use Upstash for a public deployment with live AI on.
- No AI output has been evaluated against a labelled dataset.
