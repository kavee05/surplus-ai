# Design direction

**Concept: site plan meets control room.** Surplus AI is the room where a developer watches material move between townships. It should feel like a drawn site plan (warm paper, ink lines, a measured grid) read through a control room's discipline (dense, aligned, calm, one accent per meaning).

**Personality:** precise, calm, candid, grounded, quietly confident.

## Tokens

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Paper | `--background` | `#F4F3EF` | Page ground, a light warm grey (not cream) |
| Surface | `--card` | `#FCFBF8` | Panels |
| Sunken | `--muted` | `#ECEAE4` | Inset areas, table headers |
| Line | `--border` | `#DEDAD2` | Hairlines in product UI |
| Ink | `--foreground` | `#14201F` | Text |
| Ink muted | `--muted-foreground` | `#59625F` | Secondary text (AA on paper and surface) |
| Brand teal | `--brand` | `#0F4C5C` | Primary actions, network, charts series 1 |
| Forecast amber | `--forecast` / `--forecast-ink` | `#E9A23B` / `#83500B` | Forecasts only (fills / text) |
| Confirmed green | `--success` | `#1E7A4C` | Confirmed, completed, achieved |
| Risk red | `--danger` | `#B3382C` | Risk, rejection, blockers |
| Control ink | `--ink` | `#0E2A30` | Sidebar and the network canvas frame |

One tinted grey family (warm). Shadows only on floating layers (menus, dialogs, the palette), tinted with ink.

## Type

- **Display:** Instrument Serif (headlines and page titles only, regular weight, tight tracking).
- **Interface:** Geist (all UI text, 400/500/600).
- **Numerals and IDs:** Geist Mono with tabular figures (KPI values, quantities, IDs, dates in tables).
- All through `next/font`. Type scale: 12, 13, 14, 16, 20, 28, 40, 56 px.

## Space, radius, elevation

- Spacing on a 4 px base: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius by level: 6 px controls, 10 px panels, 14 px floating layers, full only for status dots.
- Elevation: level 0 (paper), level 1 (surface plus hairline), level 2 (floating, tinted shadow).

## Signature element

**The Surplus Network**: a schematic SVG of the eight townships placed by approximate coordinates. Nodes are site marks sized by open activity. Flow lines show transfers (teal solid for real surplus, amber dashed for holds on forecast). Forecast rings around a township show expected surplus; a ring solidifies into green when the forecast is confirmed. It appears in the landing hero (static, server-rendered, the hero scenario highlighted) and at the top of the overview (live from the demo state). Plain SVG, no map API.

## Components

App shell (ink sidebar, top bar with demo date, mobile bottom bar), page header (serif title), buttons (6 px radius, 36 px default, press feedback), inputs, status and evidence tags (square, not pills), KPI strip with sparklines, decision card (inbox row with one-click action), data table (mono numerals, sunken header), drawer, command palette, explanation panel, charts (brand teal and amber only, no gridline clutter).

## Motion principles

Strong ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`), under 300 ms, never ease-in, no bounce. Enter with opacity plus scale from 0.95. Menus and popovers grow from their trigger. Press feedback on buttons. No animation on frequent actions (palette, tabs, sorting). Only transform and opacity. Purposeful moments: forecast to Confirmed, numbers flashing when an assumption changes, the timeline drawing in once. `prefers-reduced-motion` turns all of it off.

## Avoid

Stock photos and illustrations, gradient blobs, glassmorphism, emoji icons, three identical icon cards, pill eyebrows above headlines, index numbering, a dark band in the middle of a light page.

## Conflicts resolved

| Conflict | Resolution | Why (precedence) |
| --- | --- | --- |
| Taste house rules ban monospace; the brief asks for mono numerals and IDs | Geist Mono only for numerals, quantities and IDs inside product UI; never for prose or labels | The taste skill exempts real interface data; the brief is explicit |
| Taste allows at most two typefaces; the brief asks for display, interface and mono | Three faces, each with one job; the display face appears only in headlines | Brief explicit; data legibility (accessibility) outranks the taste rule |
| Taste bans thin rules and grid lines; the brief asks for hairlines and a blueprint grid | Hairlines only inside product UI (tables, panels); the grid only inside the Surplus Network and Radar canvas | Taste exempts tables and `data-ui` fragments |
| Taste and frontend-design flag "warm cream plus serif" as a generated look | Paper is a light warm grey, not cream; accent is teal, not terracotta; the serif is limited to headlines | Brief asks for warm paper and a serif; this keeps the brief while avoiding the cliché |
| Redesign skill suggests replacing Lucide icons | Kept Lucide at one stroke width, removed decorative icons | Switching icon sets risks regressions before the code freeze (functionality first) |
| Redesign skill suggests staggered entries and scroll reveals | Not used | Emil's rules (rank 3) and the performance target (rank 2) win: motion only where it explains a change |
