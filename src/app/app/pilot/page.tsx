import { CheckCircle2, CircleHelp } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pilot plan",
  description: "A proposed 8-week pilot in one township to test Surplus Radar with real ordering data.",
};

const weeks = [
  { w: "Weeks 1 and 2", title: "Set up", body: "Agree who owns leftover material. Load the purchase plans and planned quantities for active phases. Check prices, delivery times and wastage with procurement and the QS." },
  { w: "Weeks 3 and 4", title: "Forecast and log", body: "Run Radar on live phases. Site engineers photograph what is left at each handover. Buyers check Surplus AI before ordering the chosen materials." },
  { w: "Weeks 5 and 6", title: "Transfer", body: "Move the first materials between phases, with an engineer's OK where needed. Record transport costs and time spent." },
  { w: "Weeks 7 and 8", title: "Review", body: "Compare what we expected with what was really left. Measure savings and matches. Decide whether to try a second township." },
];

const metrics = [
  ["RM saved", "After transport costs, on finished transfers"],
  ["Tonnes diverted", "Weight of material reused instead of thrown away"],
  ["Match rate", "Share of requests met at least partly from leftovers"],
  ["Forecast accuracy", "1 minus the mean absolute percentage error, forecast versus actual"],
];

const confirm = [
  "Who owns surplus: the developer, the contractor, or shared credit",
  "Whether we can get ordered and planned quantities for each phase, and how often",
  "Real wastage allowances, unit costs and supplier lead times",
  "Typical transport cost and the furthest distance teams will accept",
  "Which items engineers will approve for reuse, and how quickly",
  "Whether site engineers will log surplus from a phone at handover",
];

export default function PilotPage() {
  return (
    <>
      <PageHeader
        title="Pilot plan"
        description="Our suggested trial, not an agreement: one township, about eight weeks, a few materials, with clear goals to measure. Sime Darby Property would be the first pilot; any developer could follow."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              <span className="font-medium">One township</span> with several active phases, for example City of Elmina, plus one nearby receiving site.
            </p>
            <p>
              <span className="font-medium">Four material types:</span> floor tiles, plywood formwork, interlocking pavers, and safety barriers. All non-structural, so the first transfers need no engineering sign-off.
            </p>
            <p>
              <span className="font-medium">About 8 weeks</span>, with a go or no-go review at the end.
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-4 sm:grid-cols-2">
              {weeks.map((x) => (
                <li key={x.w} className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">{x.w}</p>
                  <p className="mt-1 font-medium">{x.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">{x.body}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Success metrics</CardTitle>
            <CardDescription>Targets to be set with the pilot team before week 1.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {metrics.map(([k, v]) => (
                <li key={k} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <span className="text-sm">
                    <span className="font-medium">{k}.</span> <span className="text-muted-foreground">{v}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Confirm first</CardTitle>
              <StatusBadge tone="forecast">Assumptions</StatusBadge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5 text-sm">
              {confirm.map((c) => (
                <li key={c} className="flex gap-2">
                  <CircleHelp className="mt-0.5 size-4 shrink-0 text-forecast-ink" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
