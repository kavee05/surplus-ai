"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[60dvh] place-items-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
          <TriangleAlert className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">This screen could not load</h1>
          <p className="mt-2 text-muted-foreground">
            Something in the saved demo data may be out of date. Try again, or reset the demo data to the original simulated seed.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button
            variant="outline"
            onClick={() => {
              try {
                localStorage.removeItem("surplus-ai:state");
              } catch {}
              window.location.href = "/app";
            }}
          >
            <RotateCcw aria-hidden /> Reset demo data
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Home page</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
