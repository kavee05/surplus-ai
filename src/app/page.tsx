import { Camera, Check, ClipboardCheck, HardHat, LineChart, Radar, Repeat, ShoppingCart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SimulatedBadge } from "@/components/app/simulated-badge";
import { HeroVisual } from "@/components/landing/hero-visual";
import { DISCLAIMER, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  { icon: Radar, title: "Forecast surplus from purchase plans", body: "For every phase, compare what was ordered with what the bill of quantities needs plus a wastage allowance. The difference is likely surplus, with an evidence level that rises as the phase progresses." },
  { icon: ShoppingCart, title: "Check before you buy", body: "A buyer enters an item, quantity and date. Logged surplus is used first, then forecast surplus from nearby sites. The answer: reserve this much, order the rest now, and confirm by a set date." },
  { icon: Camera, title: "Log the real surplus by photo", body: "When the phase ends, the site engineer photographs what is left. The AI suggests the item and an estimated quantity; the engineer confirms. The forecast is marked Confirmed or Revised." },
  { icon: Repeat, title: "Transfer and measure", body: "The transfer moves from Matched to Completed, with engineer approval for structural items. Management sees money saved, tonnes diverted and forecast accuracy." },
];

const roles = [
  { icon: HardHat, title: "Site engineer or storekeeper", device: "Mostly on a phone", body: "Logs leftover material from a photo in under a minute, approves structural transfers, and sees who is waiting for the surplus." },
  { icon: ClipboardCheck, title: "Procurement officer or QS", device: "Mostly on a desktop", body: "Runs a Pre-Order Check before every order, reserves forecast surplus, and orders only the shortfall." },
  { icon: LineChart, title: "Sustainability and management", device: "Weekly dashboard", body: "Tracks savings, tonnes diverted, forecast accuracy and surplus left unclaimed for too long." },
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

export default function Landing() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow-raised">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:pt-16 lg:pb-16">
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl">Check before you buy.</h1>
            <p className="max-w-xl text-lg text-muted-foreground text-pretty">
              Surplus AI forecasts the material each township phase will have left over, from what was ordered against what the plans need. Buyers on other sites see it weeks early and order less.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link href="/app?demo=start">Try the guided demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5 text-base">
                <Link href="/app/evidence">See the evidence</Link>
              </Button>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">Student prototype for the Township of Tomorrow hackathon. Not affiliated with Sime Darby Property. Data is simulated.</p>
          </div>
          <HeroVisual />
        </section>

        {/* Problem */}
        <section aria-labelledby="problem-h" className="border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <h2 id="problem-h" className="text-3xl font-semibold tracking-tight text-balance">Buffers become waste because nobody sees across sites.</h2>
                <p className="mt-4 text-muted-foreground text-pretty">
                  Teams order a little extra to stay safe. At the end of each phase, usable tiles, timber, paving, steel offcuts and safety items are left over. Another phase a few kilometres away buys the same things new.
                </p>
                <Link href="/app/evidence" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline">
                  Sources and their limits
                </Link>
              </div>
              <ul className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
                {evidence.filter((e) => e.id !== "haehre").map((e) => (
                  <li key={e.id} className="flex flex-col gap-2 bg-card p-5">
                    <span className="tabular text-3xl font-semibold tracking-tight">{e.figure}</span>
                    <span className="text-sm">{e.figureLabel}</span>
                    <span className="mt-auto pt-2 text-xs text-muted-foreground">
                      {e.who}. {e.source.split(" (")[0]}.
                      <span className="mt-1 block">Limit: {e.limits}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" aria-labelledby="how-h" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 lg:py-16">
          <h2 id="how-h" className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">
            How it works
          </h2>
          <ol className="mt-8 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex flex-col gap-3">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand text-primary-foreground">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <span className="tabular text-sm font-medium text-muted-foreground">Step {i + 1}</span>
                  {i < steps.length - 1 && <span className="ml-1 hidden h-px flex-1 bg-border lg:block" aria-hidden />}
                </span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Radar deep-dive */}
        <section id="radar" aria-labelledby="radar-h" className="scroll-mt-16 bg-brand-strong text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
            <div>
              <h2 id="radar-h" className="text-3xl font-semibold tracking-tight text-balance">
                Surplus Radar works before the surplus exists.
              </h2>
              <p className="mt-4 text-white/80 text-pretty">
                A normal exchange can only help once leftovers are logged, which is usually after the next site has already ordered. Radar reads the purchase plans instead, so the buyer can order less in the first place.
              </p>
              <ul className="mt-6 flex flex-col gap-2.5 text-sm text-white/85">
                {[
                  "Every number has a “how this was calculated” drawer. No black box.",
                  "Every recommendation shows its evidence, its arithmetic and what is still unknown.",
                  "A decision date says when to confirm the forecast or top up the order.",
                  "Change an assumption on the Settings page and every result updates.",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-forecast" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant="secondary" className="mt-7 h-11 px-5 text-base">
                <Link href="/app/radar">Open Surplus Radar</Link>
              </Button>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/15 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">The worked example</h3>
                <SimulatedBadge />
              </div>
              <dl className="mt-5 flex flex-col divide-y divide-white/15 text-sm">
                {[
                  ["City of Elmina Phase 3 ordered", `${fmtNum(plan.orderedQty)} tiles`],
                  ["The plans need, with 5% wastage", `${fmtNum(plan.plannedQty)} × ${(1 + tile.wastageAllowance).toFixed(2)} = ${fmtNum(plan.plannedQty * (1 + tile.wastageAllowance))}`],
                  ["Expected surplus", `${fmtNum(hero.qty)} tiles from ${fmtDate(hero.availableFrom)}`],
                  [`Evidence at ${state.phases.find((p) => p.id === hero.phaseId)!.progressPct}% progress`, `Moderate (score ${hero.confidence.toFixed(2)}, not calibrated)`],
                  ["Bandar Bukit Raja needs", `${fmtNum(HERO_INPUT.qty)} tiles by ${fmtDate(HERO_INPUT.neededBy)}`],
                  ["Recommendation", `Reserve ${fmtNum(r.reservedForecast)}, order ${fmtNum(r.orderNow)} now`],
                  ["Conservative mode", `Reserve ${fmtNum(rc.reservedForecast)}, order ${fmtNum(rc.orderNow)} now`],
                  ["Decision date", `${fmtDate(r.decisionDate)} (need date minus ${tile.leadTimeDays + g.handlingBufferDays} days)`],
                  ["Estimated saving", `${fmtRm(r.expected.savedRm)}, ${fmtNum(r.expected.tonnes, 1)} t diverted`],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-6">
                    <dt className="shrink-0 text-white/70">{k}</dt>
                    <dd className="tabular font-medium sm:text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Where AI is used */}
        <section id="ai" aria-labelledby="ai-h" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 lg:py-16">
          <h2 id="ai-h" className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">
            Where AI is used, and where it is not
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">AI reads messy input and writes plain-language summaries. Deterministic code does every calculation. People approve every action.</p>
          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
            {[
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
            ].map((col) => (
              <div key={col.who} className="bg-card p-6">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className={`size-2 rounded-full ${col.tone}`} aria-hidden />
                  {col.who}
                </p>
                <dl className="mt-4 flex flex-col gap-4">
                  {col.items.map(([t, d]) => (
                    <div key={t}>
                      <dt className="font-medium">{t}</dt>
                      <dd className="mt-0.5 text-sm text-muted-foreground">{d}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">The app shows a Live AI or Demo mode badge wherever AI is used. In demo mode no model runs: sample photos and a rule-based reader stand in, and the summary is the template.</p>
        </section>

        {/* Roles */}
        <section id="roles" aria-labelledby="roles-h" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 lg:py-16">
          <h2 id="roles-h" className="text-3xl font-semibold tracking-tight">
            One habit, three roles
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">These users are our assumption. We have not interviewed SDP staff yet.</p>
          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
            {roles.map((x) => (
              <div key={x.title} className="flex flex-col gap-3 bg-card p-6">
                <x.icon className="size-6 text-brand" aria-hidden />
                <h3 className="font-semibold">{x.title}</h3>
                <p className="text-xs text-muted-foreground">{x.device}</p>
                <p className="text-sm text-muted-foreground text-pretty">{x.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Impact + model */}
        <section aria-labelledby="impact-h" className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="impact-h" className="text-3xl font-semibold tracking-tight">
                  Impact in the demo
                </h2>
                <SimulatedBadge />
              </div>
              <p className="mt-3 text-muted-foreground">Simulated transfers between eight townships over seven months. These are not results; they show what the dashboard would measure.</p>
              <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border">
                {[
                  [fmtRm(impact.savedRm), "saved on completed transfers"],
                  [`${fmtNum(impact.tonnes, 1)} t`, "kept out of disposal"],
                  [`${fmtNum(impact.co2eKg / 1000, 1)} t`, "CO2e avoided, illustrative"],
                  [`${Math.round((impact.accuracy ?? 0) * 100)}%`, "forecast accuracy, simulated history"],
                ].map(([v, k]) => (
                  <div key={k} className="bg-card p-5">
                    <dt className="sr-only">{k}</dt>
                    <dd className="tabular text-3xl font-semibold tracking-tight">{v}</dd>
                    <dd className="mt-1 text-sm text-muted-foreground">{k}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">How it could pay for itself</h2>
              <p className="mt-3 text-muted-foreground">Two business models we would test. Both are assumptions; we have not set prices.</p>
              <div className="mt-8 flex flex-col gap-4">
                <div className="rounded-xl border p-5">
                  <h3 className="font-semibold">Per-township subscription</h3>
                  <p className="mt-1 text-sm text-muted-foreground">A flat fee for each township connected. Simple to budget, but value depends on how many sites join.</p>
                </div>
                <div className="rounded-xl border p-5">
                  <h3 className="font-semibold">Share of verified savings</h3>
                  <p className="mt-1 text-sm text-muted-foreground">A percentage of the RM saved on completed transfers. Aligns cost with results, but needs savings both sides trust.</p>
                </div>
                <p className="text-xs text-muted-foreground">Hypotheses to test in a pilot. No pricing has been discussed with anyone.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-h" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-14 sm:px-6 lg:py-16">
          <h2 id="faq-h" className="text-3xl font-semibold tracking-tight">
            Honest answers
          </h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-h" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="flex flex-col items-start gap-6 rounded-2xl border bg-card p-8 shadow-card sm:p-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="cta-h" className="text-2xl font-semibold tracking-tight">
                See it in two minutes.
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">Follow 1,000 tiles from a buyer&rsquo;s first check to a completed transfer. No sign-in needed.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link href="/app?demo=start">Try the guided demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5 text-base">
                <Link href="/app/evidence">
                  See the evidence
                </Link>
              </Button>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{DISCLAIMER}</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
