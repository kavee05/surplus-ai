# Surplus AI: pitch outline (10 slides)

All operational figures are simulated. Evidence figures are from cited sources, with limits.

## 1. Title
- Surplus AI. Check before you buy.
- Township of Tomorrow, Planet track: circular economy and waste management.
- Student prototype. Not affiliated with or endorsed by Sime Darby Property.

## 2. Problem
- Teams order with a buffer. Usable tiles, timber, paving, steel offcuts and safety items are left when each phase ends.
- Another phase nearby buys the same items new, because nobody sees across sites.
- Evidence: a University of Malaya survey of 60 practitioners ranked over-ordering a highly important cause of waste (Zainon and colleagues). Limit: perception survey.
- SDP already diverts 69% of waste (31,288 t in FY2025). Diversion is downstream; we aim upstream, at the order. Limit: group-level figure, no site-level surplus data.

## 3. Target user (assumed, not yet validated)
- Site engineer or storekeeper, on a phone: logs leftovers.
- Procurement officer or QS, on a desktop: checks before buying.
- Sustainability and management: watch the dashboard.
- The habit change: check before you buy.

## 4. Solution
- A closed-network surplus platform for one developer's townships.
- Log surplus by photo, post needs, see ranked matches, run transfers with engineer approval for structural items.
- Management dashboard with savings, tonnes, illustrative carbon and forecast accuracy.

## 5. Innovation: Surplus Radar
- Exchanges only work after surplus exists. Radar works before the order is placed.
- Forecast = ordered minus planned × (1 + wastage). Confidence rises with phase progress.
- Pre-Order Check: reserve forecast surplus, order only the shortfall, confirm by a decision date. Conservative mode for cautious buyers.
- Every number has a "how this was calculated" drawer. No black box.
- Show the live Radar here (the landing page hero is the real component).

## 6. How it works (hero scenario)
- Bandar Bukit Raja needs 1,000 tiles by 7 Dec.
- City of Elmina Phase 3 ordered 5,000 against 4,200 needed, finishing 23 Nov: about 800 spare at 0.70 confidence.
- Recommendation: reserve 800, order 200 now, confirm by 24 Nov. Conservative: 560 and 440.
- On 23 Nov the engineer logs 820 tiles by photo. Forecast Confirmed, transfer completed, dashboard updates by RM 11,098.

## 7. Impact (simulated)
- Hero transfer: RM 11,098 saved, 6.4 t diverted, 5.0 t CO2e avoided (illustrative).
- Demo network: RM 30,621 saved before the demo and RM 41,719 after, across eight townships over seven months (simulated).
- Scale view: value grows with each township joining; SDP reports 27 active townships. Projection is simulated.

## 8. Feasibility
- Built as a working web app: Next.js, deterministic engine with unit tests, no database needed for the pilot stage.
- AI is used only to read photos, server-side, opt-in, rate-limited, always confirmed by a person.
- Biggest unknowns: access to ordered and BoQ quantities per phase; who owns surplus; whether engineers will log at handover.

## 9. Implementation and scale
- 8-week pilot in one township, four non-structural materials (tiles, plywood, pavers, barriers).
- Metrics: RM saved, tonnes diverted, match rate, forecast accuracy.
- Then a second township, then structural items with engineer approval, then the wider township network.
- Business model hypotheses (no prices set): per-township subscription, or a share of verified savings.

## 10. Team and evidence
- Team: [names and roles to add].
- Evidence: GS E&C (75 sites, over 2,000 transactions; construction materials only about 6%), Persimmon (43% saving on one topsoil trial, trade press), Haehre (vendor case study), Zainon and colleagues (survey of 60), SDP reports.
- Differentiation and its limits: exchanges exist and some let teams list needs early. We did not find one that forecasts surplus from ordered versus planned quantities and advises ordering less, but we checked only a few.

## Appendix
- A1. Forecast and Pre-Order Check formulas, with the worked example.
- A2. Assumptions table (every value tagged ASSUMPTION, with a source to confirm).
- A3. Evidence list with limits (APA 7th formatting to be added by the team).
- A4. Ownership policy options: developer-owned, contractor-owned, shared credit.
- A5. Pilot plan detail and first assumptions to confirm.
- A6. AI safeguards: server-side only, demo mode default, size limit, rate limit, zod validation, human confirmation.
- A7. Screenshots of each screen.
