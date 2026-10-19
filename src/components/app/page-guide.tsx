"use client";

import { Lightbulb } from "lucide-react";
import { PageSection } from "./page-section";

/** A folded "How this page works" note, so features hidden in tables and side panels are not missed. */
export function PageGuide({ id, points, className = "mb-6" }: { id: string; points: string[]; className?: string }) {
  return (
    <PageSection id={`guide-${id}`} demo={`guide-${id}`} title="How this page works" description="What you can do here, in a few lines. Open to read." className={className}>
      <ul className="flex flex-col gap-2 p-4 text-sm sm:px-5">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
