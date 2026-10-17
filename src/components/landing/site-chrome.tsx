import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const DISCLAIMER =
  "Surplus AI is a student prototype built for the Sime Darby Property University Hackathon 2026. It is not affiliated with or endorsed by Sime Darby Property. All operational data is simulated.";

export const CREDIT = "Built by Team ALICE, UTM KL. Code by Kaveetiran A/L Sitambaram.";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
          {[
            ["#how", "How it works"],
            ["#radar", "Radar"],
            ["#roles", "Who it is for"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/app">Open the app</Link>
          </Button>
          <Button asChild>
            <Link href="/app?demo=start">Try the guided demo</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">{DISCLAIMER}</p>
        </div>
        <nav aria-label="Product" className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Product</span>
          <Link href="/app/radar" className="text-muted-foreground hover:text-foreground">Surplus Radar</Link>
          <Link href="/app/surplus" className="text-muted-foreground hover:text-foreground">Surplus inventory</Link>
          <Link href="/app/impact" className="text-muted-foreground hover:text-foreground">Impact dashboard</Link>
          <Link href="/app/pilot" className="text-muted-foreground hover:text-foreground">Pilot plan</Link>
        </nav>
        <nav aria-label="About" className="flex flex-col gap-2 text-sm">
          <span className="font-medium">About</span>
          <Link href="/app/evidence" className="text-muted-foreground hover:text-foreground">Evidence and assumptions</Link>
          <Link href="/app/settings" className="text-muted-foreground hover:text-foreground">Assumptions in use</Link>
          <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
        </nav>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>{CREDIT}</p>
          <p>MIT licence. No SDP logos or trademarks are used. Township names appear for realism only; quantities, people and companies are fictional.</p>
        </div>
      </div>
    </footer>
  );
}
