"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { StatusBadge } from "@/components/app/status-badge";
import { CertaintyBadge } from "@/components/explain/certainty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HERO_INPUT } from "@/data/initial";
import { globalAssumptions, materialAssumptions, type GlobalAssumptionKey } from "@/lib/assumptions";
import { preOrderCheck } from "@/lib/engine/preorder";
import { explainPreOrder } from "@/lib/explain/builders";
import { fmtDate, fmtNum, fmtRm } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { MaterialValues, OwnershipPolicy } from "@/lib/types";

const groups: { title: string; description: string; keys: GlobalAssumptionKey[] }[] = [
  { title: "Forecast score", description: "A rule of thumb that rises with phase progress. It is not a calibrated probability; a pilot would back-test it.", keys: ["confidenceMin", "confidenceMax", "progressLow", "progressHigh", "riskHigh", "riskMedium", "confirmTolerancePct"] },
  { title: "Logistics", description: "Distance, timing and haulage.", keys: ["maxHaulKm", "handlingBufferDays", "truckCapacityT", "haulCostRmPerKm"] },
  { title: "Ranking weights", description: "How forecast sources and matches are scored. They should add up to 1.", keys: ["weightCoverage", "weightDistance", "weightTiming", "weightConfidence"] },
  { title: "Alerts and community", description: "When unclaimed surplus is flagged and offered onward.", keys: ["unclaimedAlertDays", "communityOfferDays"] },
];

const ownership: { id: OwnershipPolicy; label: string; body: string }[] = [
  { id: "sdp", label: "Developer-owned", body: "Surplus belongs to the developer, which decides where it goes." },
  { id: "contractor", label: "Contractor-owned", body: "Surplus belongs to the contractor who bought it; the platform brokers transfers." },
  { id: "shared", label: "Shared credit", body: "Savings are split between developer and contractor by an agreed rule." },
];

const matFields: { key: keyof MaterialValues; label: string; step: string }[] = [
  { key: "unitCostRm", label: "Unit cost (RM)", step: "0.5" },
  { key: "kgPerUnit", label: "kg per unit", step: "0.1" },
  { key: "co2ePerKg", label: "kg CO2e per kg", step: "0.01" },
  { key: "leadTimeDays", label: "Lead time (days)", step: "1" },
  { key: "wastageAllowance", label: "Wastage (fraction)", step: "0.01" },
];

export function Settings() {
  const { state, ready, dispatch } = useStore();
  const preview = useMemo(() => preOrderCheck(state, { ...HERO_INPUT }), [state]);
  const previewE = useMemo(() => explainPreOrder(preview, state), [preview, state]);
  if (!ready) return <PageSkeleton cards={0} />;
  const g = state.assumptions.global;
  const wsum = g.weightCoverage + g.weightDistance + g.weightTiming + g.weightConfidence;

  return (
    <>
      <PageHeader
        title="Assumptions"
        description="Every number the engine uses is an assumption with a source still to confirm. Change one and the Radar, matches and dashboard update straight away."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                dispatch({ type: "resetAssumptions" });
                toast.success("Assumptions reset to defaults");
              }}
            >
              Reset assumptions
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                dispatch({ type: "reset" });
                toast.success("Demo data reset to the original simulated seed");
              }}
            >
              <RotateCcw aria-hidden /> Reset demo data
            </Button>
          </>
        }
      />

      <div className="sticky top-16 z-20 mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card/95 p-3 text-sm shadow-card backdrop-blur" aria-live="polite">
        <span className="font-medium">Live check, hero scenario:</span>
        <span>
          Reserve <strong className="tabular">{fmtNum(preview.reservedForecast)}</strong>, order <strong className="tabular">{fmtNum(preview.orderNow)}</strong>
        </span>
        <span>Decide by {fmtDate(preview.decisionDate)}</span>
        <span>Saves about {fmtRm(preview.expected.savedRm)}</span>
        <CertaintyBadge level={previewE.certainty.level} />
        <Link href="/app/radar" className="font-medium text-brand underline-offset-2 hover:underline sm:ml-auto">
          Open in Radar
        </Link>
      </div>

      <Tabs defaultValue="global">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="global">Engine</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="policy">Ownership policy</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="flex flex-col gap-6">
          {groups.map((grp) => (
            <Card key={grp.title}>
              <CardHeader>
                <CardTitle>{grp.title}</CardTitle>
                <CardDescription>
                  {grp.description}
                  {grp.title === "Ranking weights" && Math.abs(wsum - 1) > 0.001 && <span className="ml-1 font-medium text-warning">Currently {wsum.toFixed(2)}.</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {grp.keys.map((k) => {
                    const meta = globalAssumptions[k];
                    return (
                      <li key={k} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                        <div className="min-w-0">
                          <Label htmlFor={`a-${k}`} className="font-medium">
                            {meta.label}
                          </Label>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <StatusBadge tone="forecast">{meta.tag}</StatusBadge>
                            Source to confirm: {meta.sourceToConfirm}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`a-${k}`}
                            type="number"
                            step="any"
                            value={g[k]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (Number.isFinite(v)) dispatch({ type: "setGlobal", key: k, value: v });
                            }}
                            className="tabular w-28"
                          />
                          <span className="w-28 text-xs text-muted-foreground">{meta.unit}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Material values</CardTitle>
              <CardDescription>All ASSUMPTION. Costs to confirm with supplier quotes; carbon with ICE v3 or supplier EPDs (illustrative); lead times with procurement records; wastage with the QS standard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    {matFields.map((f) => (
                      <TableHead key={f.key} className="whitespace-nowrap">
                        {f.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.materials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="min-w-44 font-medium">
                        {m.name}
                        <span className="block text-xs font-normal text-muted-foreground">per {m.unit}</span>
                      </TableCell>
                      {matFields.map((f) => (
                        <TableCell key={f.key}>
                          <Input
                            type="number"
                            step={f.step}
                            aria-label={`${m.name}: ${f.label}. Source to confirm: ${materialAssumptions[m.id][f.key].sourceToConfirm}`}
                            value={state.assumptions.materials[m.id][f.key]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (Number.isFinite(v)) dispatch({ type: "setMaterial", id: m.id, field: f.key, value: v });
                            }}
                            className="tabular h-8 w-24"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card>
            <CardHeader>
              <CardTitle>Who owns surplus?</CardTitle>
              <CardDescription>An open question we cannot answer yet. It must be confirmed with the developer and contractors in a pilot before any material moves.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={state.ownership}
                onValueChange={(v) => {
                  dispatch({ type: "setOwnership", ownership: v as OwnershipPolicy });
                  toast.success("Ownership policy updated");
                }}
                className="gap-3"
              >
                {ownership.map((o) => (
                  <Label key={o.id} htmlFor={`own-${o.id}`} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft">
                    <RadioGroupItem id={`own-${o.id}`} value={o.id} className="mt-0.5" />
                    <span>
                      <span className="block font-medium">{o.label}</span>
                      <span className="text-sm text-muted-foreground">{o.body}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
              <p className="mt-4 text-xs text-muted-foreground">This setting is recorded for the pilot discussion. In the prototype it does not change the calculations.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
