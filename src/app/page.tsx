import { ArrowRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroVisual } from "@/components/landing/hero-visual";
import { InteractiveShowcase } from "@/components/landing/interactive-showcase";
import { SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: { absolute: "Surplus AI: check before you buy" },
  description:
    "Surplus AI forecasts leftover construction material across township sites from ordered versus planned quantities, and tells buyers on other sites to order less.",
  alternates: { canonical: "/" },
};

const faqs = [
  {
    q: "Does the platform make automated purchasing decisions?",
    a: "Never. Surplus AI recommends decisions, but human procurement managers and site engineers retain full sign-off. Every material reservation, purchase modification, and dispatch transfer requires explicit, named approval.",
  },
  {
    q: "Where does AI operate?",
    a: "AI operates strictly where probabilistic interpretation is needed: computer vision for site photo condition grading and natural-language assistance. All inventory arithmetic, distance routing, and cost savings are 100% deterministic.",
  },
  {
    q: "What’s been tested so far?",
    a: "Not yet deployed on active construction sites. The system has been validated as an end-to-end prototype simulating real Sime Darby Property township geography (Elmina, Bandar Bukit Raja, Serenia City), verifying bill-of-quantities diffing, photo auditing, and multi-site transfer workflows.",
  },
  {
    q: "Who owns the surplus material across sites?",
    a: "The platform supports configurable ownership models (developer-owned, main contractor-owned, or shared-savings incentive splits) that can be aligned per township construction contract.",
  },
  {
    q: "How does it integrate with existing ERP workflows?",
    a: "Surplus AI sits upstream of purchase order creation. Rather than replacing your ERP or SAP system, it performs a pre-order check against regional site inventories before commitments are issued.",
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
                  Sime Darby Hackathon 2026 · Prototype
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
                  Connect your township construction sites. Anticipate surplus materials weeks before phase completion, and order only what you actually need.
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
              Figures shown are from a simulated scenario based on Sime Darby Property data.
            </p>
          </div>
        </section>

        {/* NUMBERS AT A GLANCE - WARM OFF-WHITE BACKGROUND (#FAF8F4) */}
        <section className="border-b border-[#E7E2D9] bg-[#FAF8F4] py-20 lg:py-24">
          <div className="mx-auto max-w-6xl 2xl:max-w-[88rem] px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 border-b border-[#E7E2D9] pb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                  Why site silos waste millions.
                </h2>
                <p className="mt-1 text-sm text-[#475569]">
                  Construction supply chain benchmarks and proven exchange outcomes.
                </p>
              </div>
              <Link
                href="/app/evidence"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#047857] hover:text-[#065f46] transition-colors"
              >
                View research citations <ExternalLink className="size-3.5" />
              </Link>
            </div>

            {/* 4 Stat Cards: White cards with warm border, navy numbers, 43% in green */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#E7E2D9] bg-white p-6 shadow-xs transition-all hover:border-[#CBD5E1]">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] tabular-nums">31,288 t</p>
                <p className="mt-2 text-sm font-semibold text-[#0F172A]">Annual waste diverted</p>
                <p className="mt-1 text-xs text-[#475569] leading-relaxed">Across 27 active Sime Darby Property townships in FY2025.</p>
              </div>

              <div className="rounded-2xl border border-[#E7E2D9] bg-white p-6 shadow-xs transition-all hover:border-[#CBD5E1]">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#047857] tabular-nums">43%</p>
                <p className="mt-2 text-sm font-semibold text-[#0F172A]">Cost cut in exchange trials</p>
                <p className="mt-1 text-xs text-[#475569] leading-relaxed">By claiming surplus from neighboring township sites.</p>
              </div>

              <div className="rounded-2xl border border-[#E7E2D9] bg-white p-6 shadow-xs transition-all hover:border-[#CBD5E1]">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] tabular-nums">75 Sites</p>
                <p className="mt-2 text-sm font-semibold text-[#0F172A]">Inter-connected sites</p>
                <p className="mt-1 text-xs text-[#475569] leading-relaxed">In established corporate surplus exchange programs.</p>
              </div>

              <div className="rounded-2xl border border-[#E7E2D9] bg-white p-6 shadow-xs transition-all hover:border-[#CBD5E1]">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">#1 Cause</p>
                <p className="mt-2 text-sm font-semibold text-[#0F172A]">Over-ordering & silos</p>
                <p className="mt-1 text-xs text-[#475569] leading-relaxed">Ranked by Peninsular Malaysia construction practitioners.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM ARCHITECTURE - WHITE BACKGROUND (#FFFFFF) */}
        <InteractiveShowcase />

        {/* FAQ SECTION - WARM OFF-WHITE BACKGROUND (#FAF8F4) WITH LIGHT THEME CARDS */}
        <section id="faq" aria-labelledby="faq-h" className="border-t border-[#E7E2D9] bg-[#FAF8F4] py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 id="faq-h" className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Frequently asked questions
              </h2>
              <p className="mt-2 text-sm text-[#475569]">
                Everything you need to know about the platform, governance, and deployment.
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
