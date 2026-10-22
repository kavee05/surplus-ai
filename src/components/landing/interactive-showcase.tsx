"use client";

import { useState, useEffect } from "react";
import {
  Radar,
  ShoppingCart,
  Camera,
  Repeat,
  Bot,
  Calculator,
  UserCheck,
  HardHat,
  ClipboardCheck,
  LineChart,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Radar,
    title: "Forecast Surplus",
    body: "Compare ordered quantities with planned need. Surplus is predicted 14 days before phase completion.",
    badge: "14-Day Horizon",
  },
  {
    step: "02",
    icon: ShoppingCart,
    title: "Check Before Buying",
    body: "Procurement teams see incoming surplus from nearby sites and order only the remaining balance.",
    badge: "Inter-Site Sharing",
  },
  {
    step: "03",
    icon: Camera,
    title: "Confirm by Photo",
    body: "Engineers photograph leftover materials on-site. AI detects quantities and engineers sign off.",
    badge: "Visual Verification",
  },
  {
    step: "04",
    icon: Repeat,
    title: "Transfer & Measure",
    body: "Materials move between sites. Cost avoidance, carbon abatement, and landfill diversion are logged.",
    badge: "ESG Telemetry",
  },
];

const split = [
  {
    icon: Bot,
    tag: "Generative AI",
    title: "AI Suggests",
    body: "Analyzes site photos to count leftovers, interprets natural-language searches, and generates summaries.",
    guardrail: "Bounded execution; cannot execute purchases or transfer orders.",
  },
  {
    icon: Calculator,
    tag: "Deterministic Logic",
    title: "Code Calculates",
    body: "Surplus forecasting, proximity routing (km), and RM savings are deterministic arithmetic you can audit.",
    guardrail: "100% auditable formulas. Zero black-box pricing estimates.",
  },
  {
    icon: UserCheck,
    tag: "Human Authority",
    title: "People Approve",
    body: "Every hold, reservation, match, and handover requires a person. Nothing is ordered automatically.",
    guardrail: "Mandatory human sign-off with named engineer audit trails.",
  },
];

const roles = [
  {
    icon: HardHat,
    role: "Site Engineer",
    scope: "Field Operations",
    body: "Snaps surplus photos at phase end and verifies material condition for structural reuse.",
    keyAction: "Photo logging & structural sign-off",
  },
  {
    icon: ClipboardCheck,
    role: "Procurement Buyer",
    scope: "Purchasing",
    body: "Checks nearby township surplus before issuing purchase orders to prevent duplicate buys.",
    keyAction: "Pre-order check & surplus reservation",
  },
  {
    icon: LineChart,
    role: "Management & ESG",
    scope: "Executive Oversight",
    body: "Monitors group-wide RM saved, landfill diversion tonnes, and carbon abatement in real-time.",
    keyAction: "Executive dashboard & ESG audit reports",
  },
];

export function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<"how" | "ai" | "roles">("how");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === "#how") setActiveTab("how");
      else if (hash === "#ai") setActiveTab("ai");
      else if (hash === "#roles") setActiveTab("roles");
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <section id="showcase" className="relative scroll-mt-20 border-y border-[#E7E2D9] bg-white py-20 lg:py-24 text-[#0F172A]">
      {/* Anchor targets */}
      <div id="how" className="absolute top-0 pointer-events-none" />
      <div id="ai" className="absolute top-0 pointer-events-none" />
      <div id="roles" className="absolute top-0 pointer-events-none" />

      <div className="mx-auto max-w-6xl 2xl:max-w-[88rem] px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#047857]">
            <Layers className="size-3.5" /> Platform Architecture
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            One closed loop across all sites.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#475569]">
            Select a view to inspect the operational workflow, AI guardrails, or site roles.
          </p>

          {/* Segmented Control Tabs */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-2xl border border-[#E7E2D9] bg-[#FAF8F4] p-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("how");
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", "#how");
                  }
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                  activeTab === "how"
                    ? "bg-white text-[#0F172A] border border-[#E7E2D9] shadow-xs"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                <Repeat className={`size-4 ${activeTab === "how" ? "text-[#047857]" : "text-[#475569]"}`} />
                <span>The 4-Step Loop</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("ai");
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", "#ai");
                  }
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                  activeTab === "ai"
                    ? "bg-white text-[#0F172A] border border-[#E7E2D9] shadow-xs"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                <Sparkles className={`size-4 ${activeTab === "ai" ? "text-[#047857]" : "text-[#475569]"}`} />
                <span>AI Governance</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("roles");
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", "#roles");
                  }
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                  activeTab === "roles"
                    ? "bg-white text-[#0F172A] border border-[#E7E2D9] shadow-xs"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                <Users className={`size-4 ${activeTab === "roles" ? "text-[#047857]" : "text-[#475569]"}`} />
                <span>Who It Is For</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: The 4-Step Loop */}
        {activeTab === "how" && (
          <div className="mt-10 animate-in fade-in duration-300">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className="flex flex-col justify-between rounded-2xl border border-[#E7E2D9] bg-[#FAF8F4] p-6 transition-all hover:border-[#CBD5E1]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[#047857]">{s.step}</span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
                        {s.badge}
                      </span>
                    </div>

                    <div className="mt-4 flex size-11 items-center justify-center rounded-xl bg-white border border-[#E7E2D9] text-[#047857]">
                      <s.icon className="size-5" />
                    </div>

                    <h3 className="mt-3 text-base font-bold text-[#0F172A]">{s.title}</h3>
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#475569]">{s.body}</p>
                  </div>

                  <div className="mt-4 border-t border-[#E7E2D9] pt-2.5">
                    <span className="text-xs font-semibold text-[#047857]">Continuous loop →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: AI Governance */}
        {activeTab === "ai" && (
          <div className="mt-10 animate-in fade-in duration-300">
            <div className="grid gap-5 md:grid-cols-3">
              {split.map((c) => (
                <div
                  key={c.title}
                  className="flex flex-col justify-between rounded-2xl border border-[#E7E2D9] bg-[#FAF8F4] p-6 transition-all hover:border-[#CBD5E1]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
                        {c.tag}
                      </span>
                    </div>

                    <div className="mt-4 flex size-11 items-center justify-center rounded-xl bg-white border border-[#E7E2D9] text-[#047857]">
                      <c.icon className="size-5" />
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-[#0F172A]">{c.title}</h3>
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#475569]">{c.body}</p>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#E7E2D9] bg-white p-3 text-xs text-[#475569]">
                    <span className="font-semibold text-[#0F172A]">Guardrail: </span>
                    {c.guardrail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Roles */}
        {activeTab === "roles" && (
          <div className="mt-10 animate-in fade-in duration-300">
            <div className="grid gap-5 md:grid-cols-3">
              {roles.map((x) => (
                <div
                  key={x.role}
                  className="flex flex-col justify-between rounded-2xl border border-[#E7E2D9] bg-[#FAF8F4] p-6 transition-all hover:border-[#CBD5E1]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
                        {x.scope}
                      </span>
                    </div>

                    <div className="mt-4 flex size-11 items-center justify-center rounded-xl bg-white border border-[#E7E2D9] text-[#047857]">
                      <x.icon className="size-5" />
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-[#0F172A]">{x.role}</h3>
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#475569]">{x.body}</p>
                  </div>

                  <div className="mt-4 border-t border-[#E7E2D9] pt-3">
                    <span className="text-xs font-semibold text-[#047857]">Primary task: </span>
                    <span className="text-xs text-[#475569]">{x.keyAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
