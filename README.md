# Surplus AI

**Check before you buy.** Surplus AI is a working prototype of a closed-network surplus platform for township developers, built for the Sime Darby Property (SDP) University Hackathon 2026, theme "Township of Tomorrow", Planet track (circular economy and waste management).

Construction teams order with a buffer, so usable material is left at the end of each phase while other phases buy the same items new. Surplus AI shows surplus across sites. Its main feature, **Surplus Radar**, forecasts surplus *before* it exists, from ordered versus planned quantities, and tells a buyer on another site to order less.

> Student prototype. Not affiliated with or endorsed by Sime Darby Property. All operational data is simulated.

## Run it

Requirements: Node.js 20 or newer, npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Click **Try the guided demo** for the two-minute walkthrough.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm test` | Vitest unit tests for forecast, Pre-Order Check, matching, savings and transfer workflow |
| `npm run lint` | ESLint |
| `npm run build` then `npm start` | Production build and server |

## Demo mode and live AI

Photo analysis runs on the server only (`src/app/api/analyze-photo/route.ts`). The model never decides anything else: forecasts, matching and every explanation come from deterministic code in `src/lib/engine`.

- **Demo mode (default, also on a public deployment).** No API key needed. Eight sample photos (simple SVG illustrations made for this project, in `public/samples`) return canned, zod-validated results. Uploaded photos are not analysed; the user fills in the details.
- **Live AI (opt-in).** Uses the Google Gemini API. Copy `.env.example` to `.env.local` and set:

  ```
  LIVE_AI=true
  GEMINI_API_KEY=your-key
  GEMINI_MODEL=gemini-2.5-flash
  ```

  Safeguards: images are resized in the browser, requests over about 4 MB are refused, there is an in-memory rate limit of 8 analyses per IP per 10 minutes, image text is treated as data, and output is validated with zod. The AI result is only a suggestion: it shows confidence, labels quantities as estimates, and the user must tick a confirmation box before saving.

Never commit `.env.local`. It is already ignored by git.

## What is real and what is simulated

| Real | Simulated or assumed |
| --- | --- |
| SDP township names (used for realism) | Every quantity, phase, listing, need, transfer, person and company |
| Evidence figures on the Evidence page, with sources and limits | Township coordinates (approximate centres) |
| The forecast, matching and savings arithmetic | All costs, weights, carbon factors, lead times and wastage allowances (tagged ASSUMPTION, editable in Settings) |
| | Forecast accuracy history (seeded, labelled simulated) |
| | Community projects (no organisation has agreed) |

Carbon figures are illustrative. Forecasts are estimates.

## The hero scenario

A procurement officer at Bandar Bukit Raja plans 1,000 floor tiles for Phase 2B, starting 7 Dec 2026 (five weeks after the demo date of 2 Nov 2026). City of Elmina Phase 3 ordered 5,000 tiles against 4,000 planned plus 5% wastage, so about 800 will be left when it finishes on 23 Nov, at 0.70 confidence (62% progress).

- Recommendation: reserve 800, order 200 now, confirm by 24 Nov.
- Conservative mode: reserve 560, order 440.
- Estimated saving: RM 11,098, 6.4 t diverted, 5.0 t CO2e avoided (illustrative).
- Three weeks later the Elmina engineer logs 820 tiles by photo; the forecast turns Confirmed and the transfer completes. The dashboard's RM saved rises by RM 11,098.

The landing page visual, Radar, Guided Demo and unit tests all compute these from the same seed data and engine.

## How it is built

- Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui on Radix, lucide-react, Recharts, TanStack Table, sonner, zod, Geist via next/font.
- No database. Seed data in `src/data/seed.ts`; state in the browser's localStorage, with **Reset demo data** in the user menu and on the Assumptions page.
- Distances use the haversine formula on approximate coordinates. No map API.
- Key folders: `src/lib/engine` (pure logic and tests), `src/lib/assumptions.ts` (every number, tagged ASSUMPTION with a source to confirm), `src/app/app/*` (app screens), `src/components/radar` (timeline and Pre-Order Check).

### Forecast logic

- expected surplus = max(0, ordered − planned × (1 + wastage))
- confidence = 0.3 below 25% progress, rising linearly to 0.9 at 80% or more, rounded to two decimals
- available from = the phase's planned end
- Pre-Order Check: use the buyer's own existing reservations first, then unclaimed logged surplus that passes hard filters (same item, available in time, within the haul limit), then forecasts from other sites that arrive before the need date minus a handling buffer, ranked by coverage, distance, timing slack and confidence.
- Risk: High at 0.75 or more, Medium 0.5 to 0.75, Low below 0.5. Decision date = need date minus supplier lead time minus handling buffer.

## Limits

- Nothing here has been validated with SDP. Site-level surplus, ordering data and workflows are assumptions.
- Most evidence is from overseas, and some is vendor-written.
- Who owns surplus (developer, contractor or shared) is unknown; the Settings page records a policy choice but it must be agreed in a pilot.
- There is no sign-in. The role switcher in the user menu changes the view between site engineer, procurement officer and management.
- localStorage is per browser, so each visitor sees their own copy of the demo.

## Licence

MIT. See `LICENSE`.
