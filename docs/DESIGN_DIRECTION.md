# Design direction

**Style A, "Fresh".** Chosen by the project owner from three hero mockups (Fresh, Night, Earth), then approved page by page: landing, app shell and Overview, Radar, Inventory, Needs and Transfers, then Impact, Evidence and Settings.

**Goals from the owner:** less text, more breathing room, a clear and friendly look, a new colour palette, and a little animation. An earlier "site plan meets control room" direction (serif headlines, monospace figures, hairline rules) was rejected as too dense and too technical, and has been replaced.

## Tokens

| Role | Value | Use |
| --- | --- | --- |
| Page | `#F8FAFC` (slate 50) | App background; landing is white |
| Surface | `#FFFFFF` with a soft shadow | Cards and panels (no hard borders) |
| Text | `#0F172A` / muted `#475569` | Body and secondary text (AA on every surface) |
| Primary action | `#0F172A` | Dark buttons |
| Accent | Emerald `#047857` to sky `#0284C7` | Links, active nav, headline gradient, logo |
| Forecast | Amber `#F59E0B` / ink `#92400E` | Forecasts and "Simulated data" tags only |
| Success, warning, danger | `#15803D`, `#92400E`, `#B91C1C` | Status |

All text and surface pairs pass WCAG AA (`node scripts/contrast.mjs`).

## Type and shape

- One family: **Plus Jakarta Sans** (next/font), extra bold for headings, tabular figures for numbers.
- Rounded shapes: 12 px controls, 16 to 24 px cards, pill badges.
- Icons in soft or gradient tiles on landing cards; Lucide throughout.

## Motion

Light and purposeful: the landing hero rises in, the route line draws and flows, numbers count up once, the hero card floats gently. Buttons press to 0.97. In the app: changed numbers flash briefly and the Radar timeline draws in once per session. All of it is off under `prefers-reduced-motion`.

## Content rules

Short copy: one-sentence explanations, long explanations folded behind "Why this recommendation" or the FAQ accordion. Honesty labels stay visible: Simulated data tags, limits beside every evidence figure, Live AI or Demo mode badges, and "not affiliated with Sime Darby Property".
