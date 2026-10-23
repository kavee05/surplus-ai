import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroVisual } from "@/components/landing/hero-visual";
import { InteractiveShowcase } from "@/components/landing/interactive-showcase";
import { SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { evidence } from "@/data/evidence";

export const metadata: Metadata = {
  title: { absolute: "Surplus AI: check before you buy" },
  description:
    "Surplus AI forecasts leftover construction material across township sites from ordered versus planned quantities, and tells buyers on other sites to order less. A student prototype using simulated data.",
  alternates: { canonical: "/" },
};

const faqs = [
  {
    q: "Is this validated with Sime Darby Property?",
    a: "No. This is a student prototype. It has not been tested on real construction sites or with Sime Darby Property data, and SDP has not endorsed it. The next step would be a short pilot in one township to test the assumptions.",
  },
  {
    q: "Is the data real?",
    a: "No. Every quantity, person, company, phase and transfer is simulated. Township names are real Sime Darby Property townships, used only as an example. The figures about the problem come from cited public sources, listed with their limits in our supporting documents.",
  },
  {
    q: "Is it only for Sime Darby Property?",
    a: "No. It works for any developer, contractor or township in Malaysia. Sime Darby Property townships are our example and proposed first pilot.",
  },
  {
    q: "Does the platform make purchasing decisions?",
    a: "Never. Surplus AI recommends; people decide. Every reservation, match and transfer needs a named person to confirm it, and Surplus AI never places a supplier order.",
  },
  {
    q: "Where does AI operate?",
    a: "In three places: reading site photos to suggest the item, condition and an estimated quantity; reading plain-language requests; and writing short summaries that are shown only if every number matches the engine. Forecasting, matching and savings are plain arithmetic you can check.",
  },
  {
    q: "Who owns the surplus material?",
    a: "We do not know yet. It could belong to the developer, the main contractor, or be shared. The app has a setting for all three, but it must be agreed in a pilot before any material moves.",
  },
  {
    q: "How would it fit with existing purchasing systems?",
    a: "It would sit before the purchase order: a buyer checks for nearby leftovers before ordering. This prototype is not connected to any ERP or SAP system; that integration would be part of a pilot.",
  },
];

export default function Landing() {
  return (
    <div className="font-jakarta min-h-screen bg-[#FAF8F4] text-[#0F172A] antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900 focus:shadow-lg"
      >
        Skip to content
      </a>
      <SiteHeader />

      <main id="main">
        {/* HERO SECTION - DARK NAVY FRAMING TOP OF PAGE */}
        <section id="radar" className="relative overflow-hidden bg-[#0F172A] py-24 lg:py-32 text-white">
          <div className="mx-auto max-w-6xl 2xl:max-w-[88rem] px-4 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1.1fr] lg:gap-14">
              <div>
                {/* Translucent pill badge on dark */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-medium text-white">
                  <span className="size-1.5 rounded-full bg-[#34D399]" />
                  Student prototype · Simulated data
                </div>

                {/* Hero Title */}
                <h1 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                  Check before <br />
                  <span className="text-[#34D399]">
                    you buy.
                  </span>
                </h1>

                {/* Subheading */}
                <p className="mt-4 max-w-lg text-base sm:text-lg text-[#CBD5E1] font-normal leading-relaxed">
                  For any developer or contractor in Malaysia: see leftover material across your sites weeks before a phase ends, and order only what you actually need.
                </p>

                {/* Primary Green CTA + Clickable Underlined Text Link */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    prefetch={false}
                    href="/app?demo=start"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#047857] px-5 py-3 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#065f46] active:scale-[0.98]"
                  >
                    Try the guided demo <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    prefetch={false}
                    href="/app"
                    className="text-sm font-medium text-slate-300 underline underline-offset-4 hover:text-white transition-colors"
                  >
                    Open the app
                  </Link>
                </div>
              </div>

              {/* Dark Navy Radar Card Floating on Hero */}
              <HeroVisual />
            </div>

            {/* Footnote centered below the hero grid, smaller and further away */}
            <p className="mt-12 text-center text-[11px] text-slate-400 tracking-wide">
              All figures are simulated for this demo. Township names are used as an example only. Not affiliated with or endorsed by Sime Darby Property.
            </p>
          </div>
        </section>

        {/* NUMBERS AT A GLANCE - WARM OFF-WHITE BACKGROUND (#FAF8F4) */}
        <section className="border-b border-[#E7E2D9] bg-[#FAF8F4] py-20 lg:py-24">
          <div className="mx-auto max-w-6xl 2xl:max-w-[88rem] px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 border-b border-[#E7E2D9] pb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                  Leftover material is a known problem.
                </h2>
                <p className="mt-1 text-sm text-[#475569]">
                  Public evidence, each shown with its limit.
                </p>
              </div>
            </div>

            {/* Evidence cards: figures and limits come from src/data/evidence.ts */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {evidence
                .filter((e) => e.id !== "haehre")
                .map((e) => (
                  <div key={e.id} className="flex flex-col rounded-2xl border border-[#E7E2D9] bg-white p-6 shadow-xs transition-all hover:border-[#CBD5E1]">
                    <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] tabular-nums">{e.figure}</p>
                    <p className="mt-2 text-sm font-semibold text-[#0F172A]">{e.figureLabel}</p>
                    <p className="mt-1 text-xs text-[#475569] leading-relaxed">{e.who}</p>
                    <p className="mt-auto pt-3 text-xs text-[#475569] leading-relaxed">
                      <span className="font-semibold text-[#0F172A]">Limit: </span>
                      {e.limits}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* PLATFORM ARCHITECTURE - WHITE BACKGROUND (#FFFFFF) */}
        <InteractiveShowcase />

        {/* BUSINESS MODEL */}
        <section aria-labelledby="model-h" className="border-t border-[#E7E2D9] bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl 2xl:max-w-[88rem] px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 id="model-h" className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                How it could pay for itself
              </h2>
              <p className="mt-2 text-sm text-[#475569]">Two business models we would test in a pilot. Both are assumptions; no prices have been set or discussed with anyone.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#E7E2D9] bg-[#FAF8F4] p-6">
                <h3 className="text-base font-bold text-[#0F172A]">Per-township subscription</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">A flat fee for each township connected. Simple to budget, but the value depends on how many sites join.</p>
              </div>
              <div className="rounded-2xl border border-[#E7E2D9] bg-[#FAF8F4] p-6">
                <h3 className="text-base font-bold text-[#0F172A]">Share of verified savings</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">A percentage of the money saved on completed transfers. It ties the cost to results, but needs savings figures both sides trust.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION - WARM OFF-WHITE BACKGROUND (#FAF8F4) WITH LIGHT THEME CARDS */}
        <section id="faq" aria-labelledby="faq-h" className="border-t border-[#E7E2D9] bg-[#FAF8F4] py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 id="faq-h" className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Frequently asked questions
              </h2>
              <p className="mt-2 text-sm text-[#475569]">
                Honest answers about the prototype, the data and the AI.
              </p>
            </div>

            <Accordion type="single" collapsible className="mt-8 flex flex-col gap-3">
              {faqs.map((f) => (
                <AccordionItem
                  key={f.q}
                  value={f.q}
                  className="rounded-xl border border-[#E7E2D9] bg-white px-5 shadow-xs transition-colors hover:border-[#CBD5E1] last:border-b"
                >
                  <AccordionTrigger className="py-4 text-left text-sm font-semibold text-[#0F172A] hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-xs sm:text-sm leading-relaxed text-[#475569]">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
