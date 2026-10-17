# Architecture

Surplus AI is one Next.js 15 app (App Router, TypeScript). There is no database and no sign-in: the demo state lives in the visitor's browser, and the only server code is three small API routes for AI and diagnostics.

## Layers

| Layer | Where | What it does |
| --- | --- | --- |
| Seed data | `src/data/seed.ts`, `src/data/initial.ts` | Simulated townships, phases, purchase plans, listings, needs, transfers and history. Demo date fixed at 2 Nov 2026. |
| Assumptions | `src/lib/assumptions.ts` | Every cost, weight, carbon factor, lead time, wastage allowance and scoring weight, each tagged with the source to confirm it. Editable on the Assumptions page. |
| Engine (pure functions, unit tested) | `src/lib/engine/*` | `forecast.ts` (surplus from ordered versus planned), `preorder.ts` (Pre-Order Check), `matching.ts` (hard filters then a weighted score), `savings.ts` and `impact.ts` (money, tonnes, carbon, ledger), `transfers.ts` (workflow), `queue.ts` (what needs a decision), `geo.ts` (haversine distance). |
| Explanations | `src/lib/explain/*` | Turns engine results into a structured explanation: recommendation, reasons, evidence records, calculation steps, assumptions, alternatives, evidence level and limits. Nothing is presented as a calibrated probability. |
| State | `src/lib/store.tsx`, `src/lib/persist.ts` | A reducer over the app state, saved to localStorage. Saved data is validated and migrated on load; anything unreadable falls back to the seed with a visible notice. |
| AI (Gemini only) | `src/lib/ai/*`, `src/app/api/*` | Photo intake and Ask Surplus AI. Config is read at request time, calls are rate limited and capped per day, and results are validated with zod. In demo mode no model runs. |
| Interface | `src/app/*`, `src/components/*` | Landing page (server rendered), app screens (client), shared components, the Surplus Network SVG and the Radar timeline. |

## Request flow for Ask Surplus AI

1. The browser sends the sentence to `/api/ask`.
2. In live mode, Gemini extracts fields (material, site, quantity, date). In demo mode, a rule-based reader does it. Both are checked against the real catalogue.
3. The browser runs the deterministic Pre-Order Check on those fields.
4. Gemini may write a short briefing from the engine's facts. It is shown only if every number and date in it matches the engine; otherwise a template is shown.
5. A person decides whether to hold surplus. The AI never sets a quantity or takes an action.

## Guardrails

- Per-IP limit (10 calls per 10 minutes) and a daily cap (`LIVE_AI_DAILY_CAP`), shared through Upstash when configured. If the shared counter is down, live AI pauses.
- `/api/ai-status` reports mode, model and a cached test call. It never returns a key, part of one, or its length.
- Tests use a mocked provider; no test calls a real model.

## Testing

- `npm test`: Vitest unit tests for the engine, explanations, AI parsing and guards, routes, and storage loading.
- `npm run test:e2e`: Playwright tests against a production build: the guided demo from the landing page, hero numbers, no horizontal scroll at 375 px, no overlapping elements, mobile navigation, and reset from corrupted storage.
- CI (`.github/workflows/ci.yml`) runs lint, unit tests, build and the end-to-end tests on every push and pull request.

## Related documents

- [AI_USAGE.md](AI_USAGE.md): where AI is and is not used
- [EXPLAINABILITY.md](EXPLAINABILITY.md): the explanation model
- [LIVE_AI_SETUP.md](LIVE_AI_SETUP.md): turning on live AI
- [DESIGN_DIRECTION.md](DESIGN_DIRECTION.md) and [DESIGN_AUDIT.md](DESIGN_AUDIT.md): the visual system and the audit behind it
