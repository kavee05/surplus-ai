import { ArrowRight, Bot, Calculator, Camera, Check, ClipboardCheck, HardHat, LineChart, Radar, Repeat, ShoppingCart, UserCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroVisual } from "@/components/landing/hero-visual";
import { DISCLAIMER, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
const hero = computeForecasts(state).find((f) => f.id === HERO_FORECAST_ID)!;
const plan = state.plans.find((p) => p.id === "elm-p3-tile")!;
const r = preOrderCheck(state, { ...HERO_INPUT });
const impact = impactSummary(state);

const steps = [
  { icon: Radar, title: "Forecast", body: "Compare what each phase ordered with what its plans need. The gap is likely surplus." },
  { icon: ShoppingCart, title: "Check before you buy", body: "Buyers see surplus coming from nearby sites and order only the rest." },
  { icon: Camera, title: "Confirm by photo", body: "When the phase ends, the engineer snaps what is left. A person confirms the count." },
  { icon: Repeat, title: "Transfer and measure", body: "Material moves between sites. Savings and tonnes are tracked." },
];

const split = [
  { icon: Bot, tone: "from-sky-500 to-sky-600", title: "AI suggests", body: "Reads surplus photos and plain-language requests, and writes short summaries." },
  { icon: Calculator, tone: "from-emerald-500 to-emerald-600", title: "Code calculates", body: "Forecasts, matches and savings are plain arithmetic you can check." },
  { icon: UserCheck, tone: "from-amber-500 to-amber-600", title: "People approve", body: "Every hold, match and transfer needs a person. Nothing is ordered automatically." },
];

const roles = [
  { icon: HardHat, title: "Site engineer", body: "Logs leftovers from a photo and approves structural reuse." },
  { icon: ClipboardCheck, title: "Procurement", body: "Checks before every order and reserves what is coming." },
  { icon: LineChart, title: "Management", body: "Sees savings, tonnes diverted and forecast accuracy." },
];

const faqs = [
  { q: "Is this validated with SDP?", a: "No. This is a student prototype. We have not validated site-level surplus, ordering data or workflows with Sime Darby Property, and SDP has not endorsed it. The next step would be a short pilot in one township." },
  { q: "Is the data real?", a: "Township names are real SDP townships, used for realism. Every quantity, person, company, phase and transfer is simulated. The figures about the problem come from cited public sources, listed with their limits on the Evidence page." },
  { q: "Who owns the surplus?", a: "We do not know yet. It could belong to SDP, to the contractor, or be shared. The app has a policy setting for all three, but it must be agreed in a pilot before any material moves." },
  { q: "Where is the AI?", a: "In three places: reading surplus photos, understanding a request such as “1,000 floor tiles at Bandar Bukit Raja by 7 December”, and writing a short summary that is shown only if every number matches the engine. Forecasting, matching and savings are not AI." },
  { q: "Does the AI decide what to buy?", a: "No. The AI never sets a quantity or takes an action. The engine calculates the recommendation, and a person confirms every hold, match and transfer." },
  { q: "How accurate is the forecast?", a: "Unknown until it runs on real ordering data. The prototype shows how accuracy would be tracked, using simulated history that is labelled as such." },
];

const SECTION = "mx-auto max-w-6xl 2xl:max-w-[88rem] scroll-mt-20 px-4 py-20 sm:px-6 lg:py-24";
const EYEBROW = "text-sm font-bold text-emerald-700";
const H2 = "mt-2 text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl";
const PRIMARY =
  "inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 font-bold text-white shadow-[0_10px_24px_-10px_rgba(15,23,42,0.55)] transition-transform duration-150 ease-[var(--ease-out)] hover:bg-slate-800 active:scale-[0.97]";

export default function Landing() {
  return (
    <div className="font-jakarta bg-white text-slate-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow-lg">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[radial-gradient(1200px_500px_at_85%_-10%,#d7f5ea_0%,transparent_60%),radial-gradient(800px_400px_at_-10%_110%,#e4f0ff_0%,transparent_60%)]">
          <div className="mx-auto grid max-w-6xl 2xl:max-w-[88rem] items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:pt-20 lg:pb-28">
            <div>
              <span className="l-rise l-d1 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> Simulated data · student prototype
              </span>
              <h1 className="l-rise l-d2 mt-5 text-[2.9rem] leading-[1.02] font-extrabold tracking-[-0.03em] sm:text-7xl">
                Check before
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">you buy.</span>
              </h1>
              <p className="l-rise l-d3 mt-5 max-w-md text-lg leading-relaxed text-slate-600 sm:text-xl">See leftover material across township sites weeks early, and order only what you need.</p>
              <div className="l-rise l-d4 mt-8 flex flex-wrap gap-3">
                <Link prefetch={false} href="/app?demo=start" className={PRIMARY}>
                  Try the guided demo <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  prefetch={false}
                  href="/app/evidence"
                  className="inline-flex items-center rounded-2xl bg-white px-6 py-3.5 font-bold text-slate-900 shadow-[inset_0_0_0_1.5px_#e2e8f0] transition-transform duration-150 ease-[var(--ease-out)] hover:bg-slate-50 active:scale-[0.97]"
                >
                  See the evidence
                </Link>
              </div>
              <p className="l-rise l-d5 mt-6 text-[13px] text-slate-500">Not affiliated with Sime Darby Property.</p>
            </div>
            <HeroVisual />
          </div>
        </section>

        {/* Problem */}
        <section aria-labelledby="problem-h" className={SECTION}>
          <div className="max-w-2xl">
            <p className={EYEBROW}>The problem</p>
            <h2 id="problem-h" className={H2}>
              Extra material gets thrown away because no site can see what others have.
            </h2>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {evidence
              .filter((e) => e.id !== "haehre")
              .map((e) => (
                <li key={e.id} className="flex flex-col rounded-3xl bg-white p-6 shadow-card">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900">{e.figure}</span>
                  <span className="mt-2 text-[15px] leading-snug text-slate-700">{e.figureLabel}</span>
                  <span className="mt-auto pt-4 text-xs leading-relaxed text-slate-500">
                    {e.who}. Limit: {e.limits}
                  </span>
                </li>
              ))}
          </ul>
          <Link prefetch={false} href="/app/evidence" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800">
            Sources and their limits <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>

        {/* How it works */}
        <section id="how" aria-labelledby="how-h" className="scroll-mt-16 bg-slate-50">
          <div className={SECTION}>
            <div className="max-w-2xl">
              <p className={EYEBROW}>How it works</p>
              <h2 id="how-h" className={H2}>
                One simple loop across every township.
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-3xl bg-white p-6 shadow-card">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 text-white shadow-[0_8px_18px_-8px_rgba(5,150,105,0.7)]">
                    <s.icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Radar worked example */}
        <section id="radar" aria-labelledby="radar-h" className={SECTION}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className={EYEBROW}>Surplus Radar</p>
              <h2 id="radar-h" className={H2}>
                It works before the surplus even exists.
              </h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-600">Radar reads purchase plans, so the next site can order less in the first place. Every number shows its working.</p>
              <ul className="mt-6 flex flex-col gap-3 text-[15px] text-slate-700">
                {["How each number was calculated, one click away", "A decision date to confirm or top up", "Change an assumption and everything updates"].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link prefetch={false} href="/app/radar" className={`mt-8 ${PRIMARY}`}>
                Open Surplus Radar <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold">The worked example</h3>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">Simulated data</span>
              </div>
              <dl className="mt-5 flex flex-col gap-3 text-[15px]">
                {[
                  ["City of Elmina ordered", `${fmtNum(plan.orderedQty)} tiles`],
                  ["Its plans need, with wastage", `${fmtNum(plan.plannedQty * (1 + state.assumptions.materials["tile-porcelain"].wastageAllowance))} tiles`],
                  ["Expected surplus", `${fmtNum(hero.qty)} tiles from ${fmtDate(hero.availableFrom)}`],
                  ["Evidence", "Moderate (phase 62% done)"],
                  ["Bandar Bukit Raja needs", `${fmtNum(HERO_INPUT.qty)} tiles by ${fmtDate(HERO_INPUT.neededBy)}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-0.5">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 p-5">
                <p className="text-sm font-semibold text-emerald-800">Recommendation</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight">
                  Reserve {fmtNum(r.reservedForecast)}, order {fmtNum(r.orderNow)} now
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Confirm by {fmtDate(r.decisionDate)}. Saves {fmtRm(r.expected.savedRm)}, {fmtNum(r.expected.tonnes, 1)} t diverted.
                </p>
              </div>
              <p className="mt-4 text-xs text-slate-500">Evidence levels use a rule of thumb from phase progress, not a measured probability.</p>
            </div>
          </div>
        </section>

        {/* Where AI is used */}
        <section id="ai" aria-labelledby="ai-h" className="scroll-mt-16 bg-slate-50">
          <div className={SECTION}>
            <div className="max-w-2xl">
              <p className={EYEBROW}>Where AI is used</p>
              <h2 id="ai-h" className={H2}>
                AI helps. Code calculates. People decide.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {split.map((c) => (
                <div key={c.title} className="rounded-3xl bg-white p-6 shadow-card">
                  <span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${c.tone} text-white`}>
                    <c.icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{c.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{c.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-500">Every AI feature shows a Live AI or Demo mode badge.</p>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" aria-labelledby="roles-h" className={SECTION}>
          <div className="max-w-2xl">
            <p className={EYEBROW}>Who it is for</p>
            <h2 id="roles-h" className={H2}>
              One habit, three roles.
            </h2>
            <p className="mt-3 text-slate-500">Our assumption. We have not interviewed SDP staff yet.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {roles.map((x) => (
              <div key={x.title} className="flex gap-4 rounded-3xl bg-white p-6 shadow-card">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <x.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{x.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{x.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Impact */}
        <section aria-labelledby="impact-h" className="px-4 sm:px-6">
          <div className="mx-auto max-w-6xl 2xl:max-w-[88rem] rounded-[2rem] bg-slate-900 px-6 py-14 text-white sm:px-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-400">Impact in the demo</p>
                <h2 id="impact-h" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  What the dashboard measures.
                </h2>
              </div>
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">Simulated data, not results</span>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {[
                [fmtRm(impact.savedRm), "saved on completed transfers"],
                [`${fmtNum(impact.tonnes, 1)} t`, "kept out of disposal"],
                [`${fmtNum(impact.co2eKg / 1000, 1)} t`, "CO2e avoided, illustrative"],
                [`${Math.round((impact.accuracy ?? 0) * 100)}%`, "forecast accuracy, simulated"],
              ].map(([v, k]) => (
                <div key={k} className="flex flex-col-reverse gap-1">
                  <dt className="text-sm text-slate-400">{k}</dt>
                  <dd className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent tabular-nums sm:text-4xl">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-h" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-24">
          <p className={`${EYEBROW} text-center`}>FAQ</p>
          <h2 id="faq-h" className={`${H2} text-center`}>
            Honest answers.
          </h2>
          <Accordion type="single" collapsible className="mt-10 flex flex-col gap-3">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q} className="rounded-2xl border border-slate-200 px-5 last:border-b">
                <AccordionTrigger className="py-4 text-base font-bold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="pb-4 text-[15px] leading-relaxed text-slate-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-h" className="px-4 pb-20 sm:px-6">
          <div className="mx-auto flex max-w-6xl 2xl:max-w-[88rem] flex-col items-start gap-6 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-sky-700 p-10 text-white sm:p-14 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="cta-h" className="text-3xl font-extrabold tracking-tight">
                See it in two minutes.
              </h2>
              <p className="mt-2 text-white/90">Follow 1,000 tiles from first check to completed transfer. No sign-in.</p>
            </div>
            <Link
              prefetch={false}
              href="/app?demo=start"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-bold text-slate-900 transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.97]"
            >
              Try the guided demo <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="mx-auto mt-8 max-w-6xl 2xl:max-w-[88rem] text-xs text-slate-500">{DISCLAIMER}</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
