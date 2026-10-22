"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const DISCLAIMER =
  "Surplus AI is a student prototype built for the Sime Darby Property University Hackathon 2026. It is not affiliated with or endorsed by Sime Darby Property. All operational data is simulated.";

export const CREDIT = "Built by Team ELIZA, UTM KL. Code by Kaveetiran A/L Sitambaram.";

export function SiteHeader() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "#" || href === "/") {
      if (window.location.pathname === "/") {
        e.preventDefault();
        window.history.pushState(null, "", "/");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (href.startsWith("#")) {
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        window.history.pushState(null, "", href);
        window.dispatchEvent(new Event("hashchange"));
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E2D9] bg-[#FAF8F4]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl 2xl:max-w-[88rem] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="rounded-md">
          <Logo onDark={false} />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
          {[
            ["#", "Home"],
            ["#how", "How it works"],
            ["#ai", "Where AI is used"],
            ["#roles", "Who it is for"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleNavClick(e, href)}
              className="rounded-xl px-3 py-2 font-medium text-[#475569] transition-colors hover:bg-[#E7E2D9]/40 hover:text-[#0F172A]"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            prefetch={false}
            href="/app"
            className="hidden text-sm font-medium text-[#475569] transition-colors hover:text-[#0F172A] underline-offset-4 hover:underline sm:inline-flex"
          >
            Open the app
          </Link>
          <Link
            prefetch={false}
            href="/app?demo=start"
            className="rounded-xl bg-[#047857] px-4 py-2 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#065f46] active:scale-[0.97]"
          >
            Try the demo
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const handleFaqClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById("faq");
    if (el) {
      e.preventDefault();
      window.history.pushState(null, "", "#faq");
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-slate-800 bg-[#0F172A] text-[#CBD5E1]">

      {/* 3-COLUMN FOOTER NAVIGATION */}
      <div className="mx-auto grid max-w-6xl 2xl:max-w-[88rem] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo onDark={true} />
          <p className="max-w-sm text-sm text-[#CBD5E1] leading-relaxed">{DISCLAIMER}</p>
        </div>
        <nav aria-label="Product" className="flex flex-col gap-2.5 text-sm">
          <span className="font-bold text-white uppercase text-xs tracking-wider">Product</span>
          <Link prefetch={false} href="/app/radar" className="text-[#CBD5E1] hover:text-[#34D399] transition-colors">
            Surplus Radar
          </Link>
          <Link prefetch={false} href="/app/surplus" className="text-[#CBD5E1] hover:text-[#34D399] transition-colors">
            Surplus inventory
          </Link>
          <Link prefetch={false} href="/app/needs" className="text-[#CBD5E1] hover:text-[#34D399] transition-colors">
            Needs
          </Link>
          <Link prefetch={false} href="/app/transfers" className="text-[#CBD5E1] hover:text-[#34D399] transition-colors">
            Transfers
          </Link>
        </nav>
        <nav aria-label="About" className="flex flex-col gap-2.5 text-sm">
          <span className="font-bold text-white uppercase text-xs tracking-wider">About</span>
          <Link prefetch={false} href="/" className="text-[#CBD5E1] hover:text-[#34D399] transition-colors">
            Home
          </Link>
          <Link prefetch={false} href="/app?demo=start" className="text-[#CBD5E1] hover:text-[#34D399] transition-colors">
            Guided demo
          </Link>
          <a
            href="#faq"
            onClick={handleFaqClick}
            className="text-[#CBD5E1] hover:text-[#34D399] transition-colors"
          >
            FAQ
          </a>
        </nav>
      </div>

      {/* COPYRIGHT BAR */}
      <div className="border-t border-slate-800/80">
        <div className="mx-auto flex max-w-6xl 2xl:max-w-[88rem] flex-col gap-2 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:justify-between sm:px-6">
          <p>{CREDIT}</p>
          <p>
            Hackathon submission; IP follows the programme terms. No SDP logos or trademarks are used. Township names are an example only; quantities, people and companies are fictional.
          </p>
        </div>
      </div>
    </footer>
  );
}
