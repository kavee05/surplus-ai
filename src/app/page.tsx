import type { Metadata } from "next";
import Link from "next/link";
import { SimulatedBadge } from "@/components/app/simulated-badge";
import { HeroVisual } from "@/components/landing/hero-visual";
import { DISCLAIMER, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { Button } from "@/components/ui/button";
import { HERO_INPUT, seedState } from "@/data/initial";
import { evidence } from "@/data/evidence";
import { HERO_FORECAST_ID } from "@/data/seed";
import { computeForecasts } from "@/lib/engine/forecast";
import { impactSummary } from "@/lib/engine/impact";
import { preOrderCheck } from "@/lib/engine/preorder";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";

export const metadata: Metadata = {
  title: { absolute: "Surplus AI: check before you buy" },
  description:
    "Surplus AI forecasts leftover construction material across township sites from ordered versus planned quantities, and tells buyers on other sites to order less. A student prototype using simulated data.",
  alternates: { canonical: "/" },
};

const state = seedState();
const g = state.assumptions.global;
const tile = state.assumptions.materials["tile-porcelain"];
const hero = computeForecasts(state).find((f) => f.id === HERO_FORECAST_ID)!;
const plan = state.plans.find((p) => p.id === "elm-p3-tile")!;
const r = preOrderCheck(state, { ...HERO_INPUT });
const rc = preOrderCheck(state, { ...HERO_INPUT, conservative: true });
const impact = impactSummary(state);

const steps = [
  { verb: "Forecast", title: "Forecast surplus from purchase plans", body: "For every phase, compare what was ordered with what the bill of quantities needs plus a wastage allowance. The difference is likely surplus, with an evidence level that rises as the phase progresses." },
  { verb: "Check", title: "Check before you buy", body: "A buyer enters an item, quantity and date. Logged surplus is used first, then forecast surplus from nearby sites. The answer: reserve this much, order the rest now, and confirm by a set date." },
  { verb: "Confirm", title: "Log the real surplus by photo", body: "When the phase ends, the site engineer photographs what is left. The AI suggests the item and an estimated quantity; the engineer confirms. The forecast is marked Confirmed or Revised." },
  { verb: "Measure", title: "Transfer and measure", body: "The transfer moves from Matched to Completed, with engineer approval for structural items. Management sees money saved, tonnes diverted and forecast accuracy." },
];

const roles = [
  { title: "Site engineer or storekeeper", device: "Mostly on a phone", body: "Logs leftover material from a photo in under a minute, approves structural transfers, and sees who is waiting for the surplus." },
  { title: "Procurement officer or QS", device: "Mostly on a desktop", body: "Runs a Pre-Order Check before every order, reserves forecast surplus, and orders only the shortfall." },
  { title: "Sustainability and management", device: "Weekly dashboard", body: "Tracks savings, tonnes diverted, forecast accuracy and surplus left unclaimed for too long." },
];

const aiSplit = [
  {
    who: "AI model",
    tone: "bg-info",
    items: [
      ["Reading photos", "Suggests the item, condition and an estimated quantity. The engineer checks and confirms before saving."],
      ["Understanding requests", "Turns a sentence like “1,000 floor tiles at Bandar Bukit Raja by 7 December” into fields, checked against the real catalogue."],
      ["Writing the summary", "A short briefing, shown only if every number and date in it matches the engine. Otherwise a template is shown."],
    ],
  },
  {
    who: "Deterministic code",
    tone: "bg-brand",
    items: [
      ["Forecasting surplus", "Ordered minus planned quantity with wastage, from purchase plans."],
      ["Matching and ranking", "Hard filters, then a weighted score you can inspect."],
      ["Savings and carbon", "Quantity times assumed factors, with every formula shown."],
    ],
  },
  {
    who: "People",
    tone: "bg-forecast",
    items: [
      ["Approving and reserving", "Holds, matches and transfers need a person to confirm. Rejections need a reason."],
      ["Structural sign-off", "Steel and precast items need a site engineer's approval."],
      ["Ordering", "Surplus AI never places a supplier order or books a truck."],
    ],
  },
];

const faqs = [
  { q: "Is this validated with SDP?", a: "No. This is a student prototype. We have not validated site-level surplus, ordering data or workflows with Sime Darby Property, and SDP has not endorsed it. The next step would be a short pilot in one township to test the assumptions." },
  { q: "Is the data real?", a: "Township names are real SDP townships, used for realism. Every quantity, person, company, phase and transfer is simulated. Evidence figures on the problem come from cited public sources, listed with their limits on the Evidence page." },
  { q: "Who owns the surplus?", a: "We do not know yet. It could belong to SDP, to the contractor, or be shared. The app has a policy setting for all three, but the answer must be agreed in a pilot before any material moves." },
  { q: "Where is the AI?", a: "In three places: reading surplus photos, understanding a plain-language request such as “1,000 floor tiles at Bandar Bukit Raja by 7 December”, and writing a short summary of the result. Each is a suggestion with a visible Live AI or Demo mode badge. The summary is shown only if every number in it matches the engine. Forecasting, matching and savings are deliberately not AI: they are plain arithmetic you can check, because a buyer has to trust the quantity." },
  { q: "Does the AI decide what to buy?", a: "No. The AI never sets a quantity or takes an action. The deterministic engine calculates the recommendation, and a person confirms every hold, match and transfer. Surplus AI never places a supplier order." },
  { q: "How accurate is the forecast?", a: "Unknown until it runs on real ordering data. The prototype shows how accuracy would be tracked, using simulated history that is labelled as such." },
  { q: "What about steel and other structural items?", a: "They can be listed, but a transfer cannot be reserved until a site engineer approves it." },
];

const SECTION = "mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 lg:py-20";
const H2 = "font-display text-[2.25rem] leading-[1.05] text-balance sm:text-[2.75rem]";

export default function Landing() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow-raised">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:pt-16 lg:pb-20">
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-[3.25rem] leading-[0.98] text-balance sm:text-7xl">Check before you buy.</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Surplus AI forecasts the material each township phase will have left over, from what was ordered against what the plans need. Buyers on other sites see it weeks early and order less.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link prefetch={false} href="/app?demo=start">Try the guided demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5 text-base">
                <Link prefetch={false} href="/app/evidence">See the evidence</Link>
              </Button>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">Student prototype for the Township of Tomorrow hackathon. Not affiliated with Sime Darby Property. Data is simulated.</p>
          </div>
          <HeroVisual />
        </section>

        {/* Problem */}
        <section aria-labelledby="problem-h" className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2 id="problem-h" className={H2}>
                Buffers become waste because nobody sees across sites.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Teams order a little extra to stay safe. At the end of each phase, usable tiles, timber, paving, steel offcuts and safety items are left over. Another phase a few kilometres away buys the same things new.
              </p>
              <Link prefetch={false} href="/app/evidence" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand underline underline-offset-4 hover:no-underline">
                Sources and their limits
              </Link>
            </div>
            <ul className="flex flex-col divide-y border-y">
              {evidence
                .filter((e) => e.id !== "haehre")
                .map((e) => (
                  <li key={e.id} className="grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[11.5rem_1fr]">
                    <span className="tabular text-[1.75rem] leading-tight font-semibold tracking-tight">{e.figure}</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-[0.9375rem]">{e.figureLabel}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.who}. {e.source.split(" (")[0]}. <span className="text-foreground/80">Limit:</span> {e.limits}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </section>

        {/* How it works: a process line, not icon cards */}
        <section id="how" aria-labelledby="how-h" className={SECTION}>
          <h2 id="how-h" className={`max-w-2xl ${H2}`}>
            How it works
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">One loop across every township: forecast, check, confirm, measure.</p>
          <ol className="mt-10 grid gap-y-8 md:grid-cols-2 md:gap-x-10 lg:grid-cols-4 lg:gap-x-0">
            {steps.map((s) => (
              <li key={s.title} className="relative flex flex-col gap-2 border-l-2 border-brand/25 pl-5 lg:border-t-2 lg:border-l-0 lg:pt-5 lg:pr-8 lg:pl-0">
                <span className="absolute top-0 -left-[5px] size-2 rounded-[2px] bg-brand lg:-top-[5px] lg:left-0" aria-hidden />
                <span className="text-xs font-semibold tracking-wide text-brand uppercase">{s.verb}</span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Radar: a light, sunken worked example (no dark band) */}
        <section id="radar" aria-labelledby="radar-h" className="scroll-mt-16 border-y bg-muted/60">
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
            <div>
              <h2 id="radar-h" className={H2}>
                Surplus Radar works before the surplus exists.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A normal exchange can only help once leftovers are logged, which is usually after the next site has already ordered. Radar reads the purchase plans instead, so the buyer can order less in the first place.
              </p>
              <ul className="mt-6 flex flex-col divide-y border-y text-sm">
                {[
                  "Every number has a “how this was calculated” drawer. No black box.",
                  "Every recommendation shows its evidence, its arithmetic and what is still unknown.",
                  "A decision date says when to confirm the forecast or top up the order.",
                  "Change an assumption on the Settings page and every result updates.",
                ].map((t) => (
                  <li key={t} className="py-2.5">
                    {t}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-7 h-11 px-5 text-base">
                <Link prefetch={false} href="/app/radar">Open Surplus Radar</Link>
              </Button>
            </div>
            <div className="rounded-xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
                <h3 className="font-semibold">The worked example</h3>
                <SimulatedBadge />
              </div>
              <dl className="flex flex-col divide-y px-5 text-sm">
                {[
                  ["City of Elmina Phase 3 ordered", `${fmtNum(plan.orderedQty)} tiles`],
                  ["The plans need, with 5% wastage", `${fmtNum(plan.plannedQty)} × ${(1 + tile.wastageAllowance).toFixed(2)} = ${fmtNum(plan.plannedQty * (1 + tile.wastageAllowance))}`],
                  ["Expected surplus", `${fmtNum(hero.qty)} tiles from ${fmtDate(hero.availableFrom)}`],
                  [`Evidence at ${state.phases.find((p) => p.id === hero.phaseId)!.progressPct}% progress`, "Evidence: moderate"],
                  ["Bandar Bukit Raja needs", `${fmtNum(HERO_INPUT.qty)} tiles by ${fmtDate(HERO_INPUT.neededBy)}`],
                  ["Recommendation", `Reserve ${fmtNum(r.reservedForecast)}, order ${fmtNum(r.orderNow)} now`],
                  ["Conservative mode", `Reserve ${fmtNum(rc.reservedForecast)}, order ${fmtNum(rc.orderNow)} now`],
                  ["Decision date", `${fmtDate(r.decisionDate)} (need date minus ${tile.leadTimeDays + g.handlingBufferDays} days)`],
                  ["Estimated saving", `${fmtRm(r.expected.savedRm)}, ${fmtNum(r.expected.tonnes, 1)} t diverted`],
                ].map(([k, v], i) => (
                  <div key={k} className={`flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-6 ${i === 5 ? "-mx-5 bg-forecast-soft/60 px-5" : ""}`}>
                    <dt className="shrink-0 text-muted-foreground">{k}</dt>
                    <dd className="tabular font-medium sm:text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="border-t px-5 py-3 text-xs text-muted-foreground">
                Evidence levels come from phase progress using a rule of thumb. They are not a measured probability.
              </p>
            </div>
          </div>
        </section>

        {/* Where AI is used */}
        <section id="ai" aria-labelledby="ai-h" className={SECTION}>
          <h2 id="ai-h" className={`max-w-2xl ${H2}`}>
            Where AI is used, and where it is not
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">AI reads messy input and writes plain-language summaries. Deterministic code does every calculation. People approve every action.</p>
          <div className="mt-10 grid gap-y-8 md:grid-cols-3 md:gap-x-10">
            {aiSplit.map((col) => (
              <div key={col.who} className="border-t-2 border-foreground/80 pt-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className={`size-2 rounded-[2px] ${col.tone}`} aria-hidden />
                  {col.who}
                </p>
                <dl className="mt-4 flex flex-col divide-y">
                  {col.items.map(([t, d]) => (
                    <div key={t} className="py-3 first:pt-0">
                      <dt className="font-medium">{t}</dt>
                      <dd className="mt-0.5 text-sm text-muted-foreground">{d}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">The app shows a Live AI or Demo mode badge wherever AI is used. In demo mode no model runs: sample photos and a rule-based reader stand in, and the summary is the template.</p>
        </section>

        {/* Roles: ruled rows */}
        <section id="roles" aria-labelledby="roles-h" className="border-t">
          <div className={SECTION}>
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 id="roles-h" className={H2}>
                  One habit, three roles
                </h2>
                <p className="mt-3 max-w-md text-muted-foreground">These users are our assumption. We have not interviewed SDP staff yet.</p>
              </div>
              <ul className="flex flex-col divide-y border-y">
                {roles.map((x) => (
                  <li key={x.title} className="grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[13rem_1fr]">
                    <div>
                      <h3 className="font-semibold">{x.title}</h3>
                      <p className="text-xs text-muted-foreground">{x.device}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{x.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Impact + model */}
        <section aria-labelledby="impact-h" className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="impact-h" className={H2}>
                  Impact in the demo
                </h2>
                <SimulatedBadge />
              </div>
              <p className="mt-3 max-w-xl text-muted-foreground">Simulated transfers between eight townships over seven months. These are not results; they show what the dashboard would measure.</p>
              <dl className="mt-8 grid grid-cols-2 border-t sm:grid-cols-4">
                {[
                  [fmtRm(impact.savedRm), "saved on completed transfers"],
                  [`${fmtNum(impact.tonnes, 1)} t`, "kept out of disposal"],
                  [`${fmtNum(impact.co2eKg / 1000, 1)} t`, "CO2e avoided, illustrative"],
                  [`${Math.round((impact.accuracy ?? 0) * 100)}%`, "forecast accuracy, simulated history"],
                ].map(([v, k]) => (
                  <div key={k} className="flex flex-col-reverse gap-1 border-b py-4 pr-4 sm:border-b-0">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="tabular text-2xl font-semibold tracking-tight">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="font-display text-[1.875rem] leading-[1.1]">How it could pay for itself</h2>
              <p className="mt-3 text-muted-foreground">Two business models we would test. Both are assumptions; we have not set prices.</p>
              <dl className="mt-6 flex flex-col divide-y border-y">
                <div className="py-4">
                  <dt className="font-semibold">Per-township subscription</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">A flat fee for each township connected. Simple to budget, but value depends on how many sites join.</dd>
                </div>
                <div className="py-4">
                  <dt className="font-semibold">Share of verified savings</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">A percentage of the RM saved on completed transfers. Aligns cost with results, but needs savings both sides trust.</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">Hypotheses to test in a pilot. No pricing has been discussed with anyone.</p>
            </div>
          </div>
        </section>

        {/* FAQ: an open two-column list */}
        <section id="faq" aria-labelledby="faq-h" className={SECTION}>
          <h2 id="faq-h" className={H2}>
            Honest answers
          </h2>
          <dl className="mt-10 grid gap-x-12 md:grid-cols-2">
            {faqs.map((f) => (
              <div key={f.q} className="border-t py-5">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-sm text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-h" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="flex flex-col items-start gap-6 border-t-2 border-foreground/80 pt-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="cta-h" className="font-display text-[2.25rem] leading-[1.05]">
                See it in two minutes.
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">Follow 1,000 tiles from a buyer&rsquo;s first check to a completed transfer. No sign-in needed.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link prefetch={false} href="/app?demo=start">Try the guided demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5 text-base">
                <Link prefetch={false} href="/app/evidence">See the evidence</Link>
              </Button>
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">{DISCLAIMER}</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
