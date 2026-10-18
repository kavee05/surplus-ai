import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const DISCLAIMER =
  "Surplus AI is a student prototype built for the Sime Darby Property University Hackathon 2026. It is not affiliated with or endorsed by Sime Darby Property. All operational data is simulated.";

export const CREDIT = "Built by Team ALICE, UTM KL. Code by Kaveetiran A/L Sitambaram.";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
          {[
            ["#how", "How it works"],
            ["#radar", "Radar"],
            ["#ai", "Where AI is used"],
            ["#roles", "Who it is for"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-xl px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link prefetch={false} href="/app" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex">
            Open the app
          </Link>
          <Link prefetch={false} href="/app?demo=start" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-transform duration-150 ease-[var(--ease-out)] hover:bg-slate-800 active:scale-[0.97]">
            Try the guided demo
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-sm text-sm text-slate-600">{DISCLAIMER}</p>
        </div>
        <nav aria-label="Product" className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Product</span>
          <Link prefetch={false} href="/app/radar" className="text-slate-600 hover:text-slate-900">Surplus Radar</Link>
          <Link prefetch={false} href="/app/surplus" className="text-slate-600 hover:text-slate-900">Surplus inventory</Link>
          <Link prefetch={false} href="/app/impact" className="text-slate-600 hover:text-slate-900">Impact dashboard</Link>
          <Link prefetch={false} href="/app/pilot" className="text-slate-600 hover:text-slate-900">Pilot plan</Link>
        </nav>
        <nav aria-label="About" className="flex flex-col gap-2 text-sm">
          <span className="font-medium">About</span>
          <Link prefetch={false} href="/app/evidence" className="text-slate-600 hover:text-slate-900">Evidence and assumptions</Link>
          <Link prefetch={false} href="/app/settings" className="text-slate-600 hover:text-slate-900">Assumptions in use</Link>
          <a href="#faq" className="text-slate-600 hover:text-slate-900">FAQ</a>
        </nav>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-slate-600 sm:flex-row sm:justify-between sm:px-6">
          <p>{CREDIT}</p>
          <p>MIT licence. No SDP logos or trademarks are used. Township names appear for realism only; quantities, people and companies are fictional.</p>
        </div>
      </div>
    </footer>
  );
}
