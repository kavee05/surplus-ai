import type { Transfer, TransferStatus } from "../types";

export const transferSteps: TransferStatus[] = ["Matched", "Awaiting approval", "Reserved", "Collected", "Completed"];

/**
 * The next status in the workflow, or null if none.
 * Structural items must pass "Awaiting approval" and be approved before "Reserved".
 * A forecast reservation stays at Matched until the actual surplus is logged.
 */
export function nextStatus(t: Pick<Transfer, "status" | "requiresApproval" | "approvedBy" | "listingId">): TransferStatus | null {
  switch (t.status) {
    case "Matched":
      if (!t.listingId) return null;
      return t.requiresApproval && !t.approvedBy ? "Awaiting approval" : "Reserved";
    case "Awaiting approval":
      return t.approvedBy ? "Reserved" : null;
    case "Reserved":
      return "Collected";
    case "Collected":
      return "Completed";
    default:
      return null;
  }
}

export function nextActionLabel(t: Transfer): string | null {
  if (t.status === "Matched" && !t.listingId) return null;
  if (t.status === "Awaiting approval") return t.approvedBy ? "Reserve" : "Approve as engineer";
  const n = nextStatus(t);
  if (!n) return null;
  return { "Awaiting approval": "Send for approval", Reserved: "Reserve", Collected: "Mark collected", Completed: "Mark completed" }[n as string] ?? null;
}

export function visibleSteps(t: Pick<Transfer, "requiresApproval">): TransferStatus[] {
  return transferSteps.filter((s) => s !== "Awaiting approval" || t.requiresApproval);
}
