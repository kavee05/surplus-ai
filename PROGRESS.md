# Progress

## Done
- M1 scaffold: Next.js 15, Tailwind v4, shadcn/ui (Radix), tokens in `src/app/globals.css`, logo, favicon, OG image, app shell (sidebar, top bar, role switcher, breadcrumbs, guided demo provider), assumptions config `src/lib/assumptions.ts`, seed data `src/data/seed.ts` with the hero scenario.
- M5 `/app/impact`: KPIs, charts by month, township, material, forecast vs actual (simulated history), alerts, scale projection. Chart colours validated with the dataviz validator (#00809E, #C47D12).
- M4 site flow: `/app/surplus` table + drawer, `/app/surplus/log` photo log (demo AI via `/api/analyze-photo`, live Gemini opt-in), `/app/needs` with ranked matches, `/app/transfers` workflow with engineer approval.
- M3 Radar view `/app/radar`: timeline (shared component), filters, Pre-Order Check with Conservative mode, explain drawers, reserve-from-forecast.
- M2 Radar engine `src/lib/engine/*` (forecast, pre-order check, matching, savings, transfers, impact) with Vitest tests (`npm test`).

## Next step
- M6 Guided Demo polish (provider in `src/components/demo/guided-demo.tsx` exists and runs end to end), then M7 landing page.

## Known issues
- Pages other than Overview not built yet.
