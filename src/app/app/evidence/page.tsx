import { ExternalLink, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { differentiation, evidence, evidenceLimits } from "@/data/evidence";

export const metadata: Metadata = {
  title: "Evidence and assumptions",
  description: "The public evidence behind Surplus AI, what each source can and cannot tell us, and how Radar differs from existing surplus exchanges.",
};

export default function EvidencePage() {
  return (
    <>
      <PageHeader
        title="Evidence and assumptions"
        description="What we know, where it comes from, and its limits. Sources are paraphrased. The app's operational data is simulated; the figures on this page are from the cited sources."
      />

      <Card className="mb-6 border-warning/30 bg-warning-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <TriangleAlert className="size-4" aria-hidden /> Limits to keep in mind
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {evidenceLimits.map((l) => (
              <li key={l} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
                {l}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Sources</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {evidence.map((e) => (
          <Card key={e.id} className="min-w-0">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{e.who}</CardTitle>
                <StatusBadge tone="neutral">{e.kind}</StatusBadge>
              </div>
              <CardDescription>
                <span className="tabular font-semibold text-foreground">{e.figure}</span> {e.figureLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="text-pretty">{e.summary}</p>
              <p className="rounded-lg bg-muted p-3 text-muted-foreground">
                <span className="font-medium text-foreground">Limit:</span> {e.limits}
              </p>
              <p className="text-xs text-muted-foreground">
                Source: {e.source}
                {e.url && (
                  <>
                    {" "}
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-brand underline-offset-2 hover:underline">
                      Open <ExternalLink className="size-3" aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 mb-3 font-semibold">Differentiation and its limits</h2>
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 text-sm">
          <p>{differentiation.intro}</p>
          <ul className="flex flex-col gap-2">
            {differentiation.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <span className="text-pretty">{p}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <h2 className="mt-10 mb-3 font-semibold">Assumptions in the model</h2>
      <Card>
        <CardContent className="flex flex-col gap-2 pt-6 text-sm">
          <p>
            Every cost, weight, carbon factor, lead time, wastage allowance, haul distance and scoring weight is an assumption, tagged with the source we would use to confirm it. They are listed and editable on the{" "}
            <Link href="/app/settings" className="font-medium text-brand underline-offset-2 hover:underline">
              Assumptions page
            </Link>
            .
          </p>
          <p className="text-muted-foreground">Township coordinates are approximate centres, used only for straight-line distance (haversine). Carbon figures are illustrative.</p>
        </CardContent>
      </Card>
    </>
  );
}
