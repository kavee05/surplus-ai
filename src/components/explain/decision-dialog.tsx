"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Explanation } from "@/lib/explain/types";
import { CertaintyBadge } from "./certainty";

export type DecisionMode = "approve" | "reject";

/**
 * Confirms a consequential action, or captures why a recommendation was rejected.
 * Approve can optionally let the person change the quantity (a "modified" decision).
 */
export function DecisionDialog({
  open,
  onOpenChange,
  mode,
  e,
  title,
  consequence,
  confirmLabel,
  quantity,
  quickReasons = [],
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: DecisionMode;
  e: Explanation;
  title: string;
  consequence: string;
  confirmLabel: string;
  quantity?: { value: number; max: number; unit: string; label: string };
  quickReasons?: string[];
  onConfirm: (p: { reason?: string; qty?: number }) => void;
}) {
  const [reason, setReason] = useState("");
  const [qty, setQty] = useState<number | undefined>(quantity?.value);
  const reject = mode === "reject";
  const reasonOk = !reject || reason.trim().length >= 4;
  const qtyOk = !quantity || (qty !== undefined && qty > 0 && qty <= quantity.max);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setReason("");
          setQty(quantity?.value);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{consequence}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-sm">
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium">{e.recommendation}</p>
              <CertaintyBadge level={e.certainty.level} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{e.certainty.basis}</p>
          </div>
          {!reject && quantity && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dd-qty">{quantity.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="dd-qty"
                  type="number"
                  min={1}
                  max={quantity.max}
                  value={qty ?? ""}
                  onChange={(ev) => setQty(Number(ev.target.value) || undefined)}
                  className="tabular w-32"
                  aria-describedby="dd-qty-hint"
                />
                <span className="text-muted-foreground">{quantity.unit}</span>
              </div>
              <p id="dd-qty-hint" className="text-xs text-muted-foreground">
                Recommended {quantity.value}. Up to {quantity.max}. A different number is recorded as a modified decision.
              </p>
            </div>
          )}
          {reject && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dd-reason">Why are you rejecting this?</Label>
              {quickReasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {quickReasons.map((q) => (
                    <button key={q} type="button" onClick={() => setReason(q)} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <Textarea id="dd-reason" rows={3} maxLength={300} value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="A short reason helps the next person and improves the rules." />
              <p className="text-xs text-muted-foreground">Saved to the activity log with the recommendation as it was shown.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={reject ? "destructive" : "default"}
            disabled={!reasonOk || !qtyOk}
            onClick={() => {
              onConfirm({ reason: reason.trim() || undefined, qty });
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
