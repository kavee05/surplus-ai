# Design audit

Audit of the build before the design upgrade (branch `design/upgrade`, starting from commit `c48e110`), run with the `redesign-existing-projects` checklist and the taste house rules. Screenshots: `screenshots/before/` at 375, 768 and 1280 px for landing, overview, Radar, inventory, needs, transfers, impact, evidence and settings.

Severity: **High** hurts first impressions or comprehension; **Medium** reads as template; **Low** polish.

## Findings

| # | Severity | Page and element | Problem |
| --- | --- | --- | --- |
| 1 | High | Whole product | No signature visual. Apart from the Radar timeline, nothing is specific to a township network. The overview reads as a generic SaaS dashboard. |
| 2 | High | Typography, all pages | One family (IBM Plex Sans) for headlines, UI and numbers. Headlines lack presence; the type does not carry any personality. |
| 3 | High | Overview | KPI strip, then an AI box, then a list and a side panel: a stack of equal bordered blocks with no clear first action. Queue items link away instead of offering one-click actions. |
| 4 | High | Landing, Radar section | A full-bleed dark teal band in an otherwise light page (the "random dark section" pattern). |
| 5 | High | Mobile, app shell | No bottom navigation. Engineers on site must open a drawer to reach Log surplus. The demo date is hidden below 1280 px. |
| 6 | Medium | Landing, How it works | Four equal columns, each topped by an icon tile and a "Step N" label: icon-topped feature row plus index numbering. |
| 7 | Medium | Landing, roles and business model | Three identical role cards; two identical model cards. |
| 8 | Medium | Landing and evidence | FAQ as a default accordion; evidence as a 2 x 2 grid of identical cards. |
| 9 | Medium | Radar, Pre-Order result | Card inside card inside card: bordered figure tiles, a bordered savings strip and an accordion inside one bordered panel. Very long on mobile. |
| 10 | Medium | Badges, all app pages | Badge noise: Simulated badge, certainty badge, status badge and AI badge all share the same small rounded style, so none stands out. |
| 11 | Medium | Impact charts | Default Recharts look: generic axes, uniform bars, four equal chart cards, no sparklines. The chart teal (#00809E) differs from the brand teal, so colour meaning drifts. |
| 12 | Medium | Tables (inventory, needs, transfers) | Default shadcn table styling; IDs and quantities set in the text face, so columns do not scan. |
| 13 | Medium | Icons | Lucide everywhere at the same size, including decorative icons in KPI cards that add nothing. |
| 14 | Medium | Certainty labels | "Moderate evidence" badge plus "Progress-based score 0.70 (rule of thumb..., not a calibrated probability)" is accurate but heavy for non-technical readers. |
| 15 | Low | Colour | Cool stone neutrals with a warm amber accent: the greys and the accent sit in different temperature families. |
| 16 | Low | Motion | Almost none, and inconsistent: default accordion slide, no press feedback on most controls, no feedback when numbers change after an assumption edit. |
| 17 | Low | Buttons | Default height 32 px; several primary actions are small touch targets on mobile. |
| 18 | Low | Command access | No keyboard command palette for a data-heavy tool. |
| 19 | Low | Footer and credit | Credit line present but visually buried. |

## What already works (kept)

Honest labelling (simulated data, limits next to evidence), the explanation panel pattern, ruled KPI strips, the ink sidebar, tabular figures, and the Radar timeline.

## Motion review (Before, After, Why)

Filled in during the motion pass (step D5).

| Element | Before | After | Why |
| --- | --- | --- | --- |
| Buttons | Colour change only | Scale to 0.97 on press, 150 ms, strong ease-out | Immediate physical feedback that the press registered |
| Forecast ring on the Surplus Network | Did not exist | Green ring fades and scales in from 0.95 when a forecast is confirmed, 220 ms | Marks the one state change the product exists for: forecast becoming real |
| Changed numbers (KPIs, Pre-Order figures) | Swapped silently | Brief amber highlight that fades over 600 ms, only when the value changes, never on first render | After an assumption or input edit the eye finds what moved. Longer than 300 ms on purpose: it is a fade-out after an instant change, not a transition the user waits on |
| Radar timeline bars | Static | Draw in from the left once per browser session, 280 ms, transform only | Shows time running left to right; once only, so repeat visits are calm |
| Menus, selects, popovers | Default fade and zoom | Kept, growing from the trigger (Radix transform origin), 100 ms | Already matched the rule; origin ties the layer to its trigger |
| Command palette | Did not exist | No animation | Opened many times a session; animation would only slow it |
| Charts | Bars grew on every mount | No mount animation | Decorative, delayed reading, and repeated on every visit |
| Mobile camera button | Did not exist | Scale to 0.97 on press | Same press feedback as other buttons |
| Accordion and "items for other roles" chevron | Default | Rotation only, 150 ms | Small, frequent, so short |
| Everything | Partly covered | `prefers-reduced-motion` sets all animation and transition durations to near zero | Accessibility first (precedence rank 2) |

## Quality checks after the upgrade

| Check | Result |
| --- | --- |
| Axe (WCAG 2.2 AA tags), 13 routes at 1280 and 375 px | One serious issue found (sidebar group labels, 4.15:1) and fixed; now no serious or critical issues. Runs in the e2e suite. |
| Contrast of every text token on every surface (`node scripts/contrast.mjs`) | All pairs 4.5:1 or higher after darkening the success green to `#1A7046` |
| Lighthouse, landing page, local production build | Accessibility 100, Best practices 100, SEO 100. Performance 73 to 85 on the mobile preset (varies run to run on this machine; the old production site scored 75 on the same machine), 99 on the desktop preset |
| Landing first-load JavaScript | 196 kB before, 107 kB after (`optimizePackageImports` for the radix-ui barrel; tooltip provider moved to the app) |
