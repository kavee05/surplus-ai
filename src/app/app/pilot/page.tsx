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
  { w: "Weeks 1 and 2", title: "Set up", body: "Agree surplus ownership. Load purchase plans and BoQ quantities for active phases. Confirm costs, lead times and wastage allowances with procurement and the QS." },
  { w: "Weeks 3 and 4", title: "Forecast and log", body: "Run Radar on live phases. Site engineers log actual surplus by photo at each handover. Buyers run a Pre-Order Check before orders of the chosen materials." },
  { w: "Weeks 5 and 6", title: "Transfer", body: "Complete the first transfers between phases, with engineer approval where needed. Record haul costs and handling time." },
  { w: "Weeks 7 and 8", title: "Review", body: "Compare forecasts with actual surplus. Measure savings and match rate. Decide whether to extend to a second township." },
];

const metrics = [
  ["RM saved", "Net of haulage, on completed transfers"],
  ["Tonnes diverted", "Weight of material reused instead of disposed"],
  ["Match rate", "Share of posted needs filled at least partly from surplus"],
  ["Forecast accuracy", "1 minus the mean absolute percentage error, forecast versus actual"],
];

const confirm = [
  "Who owns surplus: the developer, the contractor, or shared credit",
  "Whether ordered and BoQ quantities are available per phase, and how often",
  "Real wastage allowances, unit costs and supplier lead times",
  "Typical haul cost and the furthest distance teams will accept",
  "Which items engineers will approve for reuse, and how quickly",
  "Whether site engineers will log surplus from a phone at handover",
];

export default function PilotPage() {
  return (
    <>
      <PageHeader
        title="Pilot plan"
        description="A proposal, not an agreement. One township, about eight weeks, a few material types, measured against clear success metrics."
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
