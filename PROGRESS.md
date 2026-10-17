# Progress

## Done
- M1 to M8 complete and verified (see the final report in the session, and README.md).
- M1 scaffold, tokens (`src/app/globals.css`), brand (logo, `src/app/icon.svg`, `src/app/opengraph-image.tsx`), app shell, assumptions config (`src/lib/assumptions.ts`), seed data with hero scenario (`src/data/seed.ts`).
- M2 engine in `src/lib/engine` with 26 Vitest tests.
- M3 `/app/radar`: timeline (core in `src/components/radar/timeline-core.tsx`, interactive wrapper `radar-timeline.tsx`), Pre-Order Check, Conservative mode, explain drawers, reserve-from-forecast.
- M4 `/app/surplus`, `/app/surplus/log` (demo AI, live Gemini opt-in via `/api/analyze-photo`), `/app/needs`, `/app/transfers`.
- M5 `/app/impact`.
- M6 Guided Demo (`src/components/demo/guided-demo.tsx`), verified end to end in production build.
- M7 landing `/`, `/app/evidence`, `/app/settings`, `/app/community`, `/app/pilot`, 404, error boundary.
- M8 screenshots in `screenshots/` (13 screens at 375, 768, 1280), Lighthouse on landing (perf 89 to 90, a11y 100, best practices 100, SEO 100), README, PITCH_NOTES, DEMO_SCRIPT, SUBMISSION_NOTES, MIT licence.

## Next step
- Owner tasks in SUBMISSION_NOTES.md (GitHub, Vercel, video, form).
- Optional COULD items: dark theme, command palette.

## Known issues
- Live Gemini mode is implemented but not tested against the real API (no key was used).
- npm audit reports advisories in Next 15's bundled postcss (build-time only). The fix is a breaking upgrade to Next 16.
- Rate limit is in-memory, so on serverless it is per instance, not global.
- localStorage state is per browser; there is no shared backend.
