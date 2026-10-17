import { Compass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist in Surplus AI.",
};

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <Link href="/" aria-label="Surplus AI home">
          <Logo />
        </Link>
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Compass className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="mt-2 text-muted-foreground">The link may be old or mistyped. Go back to the app, or start from the home page.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/app">Open the app</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home page</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
