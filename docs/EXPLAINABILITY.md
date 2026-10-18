# How Surplus AI explains its recommendations

Surplus AI should earn trust by showing its evidence, not by sounding confident. This page describes what produces each result, how the explanation is built, and what is still simulated or unverified.

## What produces each result

| Feature | What produces it | AI model involved? |
| --- | --- | --- |
| Surplus forecast | `src/lib/engine/forecast.ts`: ordered minus planned × (1 + wastage) | No |
| Pre-Order Check | `src/lib/engine/preorder.ts`: your existing holds, then logged surplus, then ranked forecasts | No |
| Need to surplus matching | `src/lib/engine/matching.ts`: hard filters, then a weighted score | No |
| Impact (RM, tonnes, CO2e) | `src/lib/engine/savings.ts` and `impact.ts`: quantity × assumed factors | No |
| Decision queue on Overview | `src/lib/engine/queue.ts`: derived from transfers, needs and listings | No |
| Photo suggestion | `src/app/api/analyze-photo/route.ts`: Gemini in live mode, canned results in demo mode | Yes (live mode only) |

## The explanation layer

Every result is passed to a builder in `src/lib/explain/builders.ts`, which returns a structured `Explanation` (`src/lib/explain/types.ts`):

- `recommendation` and `outcome`: what to do, in plain language.
- `reasons`: the factors the engine actually used, each marked as supporting, weakening or blocking.
- `evidence`: the purchase plan, phase, listing, need or transfer records, with links, the record's update date, and a stale flag.
- `facts`: key values, each tagged with where it came from: recorded, calculated, assumption, model output or demo result.
- `assumptions`: the editable values used, linked to the Assumptions page.
- `calculations`: each formula with its real inputs and result.
- `alternatives`: other options with trade-offs, plus sources that were ruled out and why.
- `certainty`: an evidence level (strong, moderate, tentative, not enough evidence), the reason for it, what is missing, and what could change the result.
- `requiresHumanApproval` and `method`.

The builders only restate what the engine computed. Tests in `src/lib/explain/explain.test.ts` check that each explanation matches the engine's numbers, that stale or missing data lowers certainty, and that no score is presented as calibrated.

The interface uses one component for all of these, `src/components/explain/explanation-panel.tsx`: what and why first, then evidence, calculation, assumptions, alternatives and limitations on demand.

## How certainty is set

There is no calibrated probability anywhere in this prototype. Certainty levels come from simple, visible rules:

- **Forecasts**: moderate when the phase is at least 60% complete and its progress was reported in the last 21 days; tentative otherwise; strong once the actual surplus is logged.
- **Matches**: strong for the same item covering the whole need, nearby, in new or good condition; tentative for substitutes, structural items awaiting approval, or poor condition; moderate in between.
- **Pre-Order Check**: the weakest level of anything it relies on.
- **Photo suggestions**: always tentative until a person checks; "not enough evidence" if the item is not recognised.

On screen each level reads as a short tag, for example "Evidence: moderate", with a three-step meter and a one-line plain explanation (hover, or read it in the How sure section). Numbers shown alongside these levels are labelled for what they are: a progress-based rule of thumb, a ranking score, the model's own estimate, or a canned demo value.

## Human control

- Holding forecast surplus, approving a match, approving or cancelling a transfer all need explicit confirmation.
- Rejections require a short reason. Approvals can change the quantity, which is recorded as "modified".
- Every decision is saved with the recommendation exactly as it was shown and its evidence level at the time. See the Activity page.
- Nothing in the app places a supplier order, books a truck or sends a message. Dialogs say so.

## What is still simulated or unverified

- All records are simulated seed data, including four seeded example decisions (labelled on the Activity page).
- Progress-report dates are simulated.
- Forecast accuracy uses 10 simulated outcomes; it is not evidence that the forecast rule works.
- Costs, weights, haul rates and carbon factors are assumptions with sources still to confirm. Carbon is illustrative and transport emissions are not deducted.
- Distances are straight-line between approximate township centres.
- Decisions and data live in the browser's local storage. There is no server-side audit log, user accounts or permissions; the role switcher is for demonstration.
