import { addDays, diffDays, fmtDate, fmtNum, fmtRm } from "../format";
import type { CertaintyLevel } from "../explain/types";
import { matchCertainty } from "../explain/builders";
import { materialById, siteName, type EngineData } from "./context";
import { impactSummary, listingAgeDays, listingValueRm, transferSavings } from "./impact";
import { matchNeed } from "./matching";

export type QueueKind = "approval" | "forecast-decision" | "match" | "reserve" | "unclaimed";

export interface QueueItem {
  id: string;
  kind: QueueKind;
  title: string;
  detail: string;
  blocker?: string;
  action: string;
  href: string;
  certainty?: CertaintyLevel;
  /** Days until it becomes late. Negative means overdue. */
  dueInDays?: number;
}

/** Everything that is waiting on a person, most urgent first. Derived only from records. */
export function decisionQueue(data: EngineData & { dismissedMatches?: { needId: string; listingId: string }[] }): QueueItem[] {
  const items: QueueItem[] = [];
  const g = data.assumptions.global;

  for (const t of data.transfers) {
    const m = materialById(data, t.materialId);
    const route = `${siteName(data, t.fromSiteId)} to ${siteName(data, t.toSiteId)}`;
    if (t.status === "Awaiting approval" && !t.approvedBy) {
      items.push({
        id: `approve-${t.id}`,
        kind: "approval",
        title: `Engineer approval: ${fmtNum(t.qty)} ${m.unit} ${m.name}`,
        detail: route,
        blocker: "Structural item. A site engineer must check it before it can be reserved.",
        action: "Review",
        href: `/app/transfers?transfer=${t.id}`,
        certainty: "tentative",
      });
    } else if (t.status === "Matched" && t.forecastId && !t.listingId) {
      const need = data.needs.find((n) => n.id === t.needId);
      const neededBy = need?.neededBy;
      const decideBy = neededBy ? addDays(neededBy, -(data.assumptions.materials[t.materialId].leadTimeDays + g.handlingBufferDays)) : undefined;
      items.push({
        id: `forecast-${t.id}`,
        kind: "forecast-decision",
        title: `Forecast hold: ${fmtNum(t.qty)} ${m.unit} ${m.name}`,
        detail: `${route}. Waiting for the other site to record what is actually left.`,
        blocker: "Surplus not logged yet.",
        action: decideBy ? `Confirm or top up by ${fmtDate(decideBy)}` : "Check forecast",
        href: `/app/radar?forecast=${t.forecastId}`,
        certainty: "tentative",
        dueInDays: decideBy ? diffDays(data.today, decideBy) : undefined,
      });
    } else if (t.status === "Matched" && t.listingId) {
      items.push({ id: `reserve-${t.id}`, kind: "reserve", title: `Ready to reserve: ${fmtNum(t.qty)} ${m.unit} ${m.name}`, detail: route, action: "Reserve", href: `/app/transfers?transfer=${t.id}` });
    }
  }

  for (const need of data.needs.filter((n) => n.status === "open")) {
    const best = matchNeed(data, need).matches.find((x) => !data.dismissedMatches?.some((d) => d.needId === need.id && d.listingId === x.listing.id));
    if (!best) continue;
    const c = matchCertainty(best, need, data);
    if (c.level !== "strong" && c.level !== "moderate") continue;
    items.push({
      id: `match-${need.id}`,
      kind: "match",
      title: `Match available: ${fmtNum(best.qty)} ${materialById(data, best.listing.materialId).unit} ${materialById(data, need.materialId).name}`,
      detail: `${siteName(data, best.listing.siteId)} to ${siteName(data, need.siteId)}, ${fmtNum(best.distanceKm, 1)} km, saves about ${fmtRm(best.savings.savedRm)}`,
      action: "Review match",
      href: `/app/needs?need=${need.id}`,
      certainty: c.level,
      dueInDays: diffDays(data.today, need.neededBy),
    });
  }

  for (const a of impactSummary(data).alerts.slice(0, 3)) {
    const m = materialById(data, a.listing.materialId);
    items.push({
      id: `unclaimed-${a.listing.id}`,
      kind: "unclaimed",
      title: `Unclaimed ${a.age} days: ${m.name}`,
      detail: `${fmtNum(a.listing.qty)} ${m.unit} at ${siteName(data, a.listing.siteId)}, ${fmtRm(a.valueRm)}`,
      action: a.age > g.communityOfferDays ? "Offer to community" : "Open listing",
      href: a.age > g.communityOfferDays ? "/app/community" : `/app/surplus?listing=${a.listing.id}`,
    });
  }

  const rank: Record<QueueKind, number> = { approval: 0, "forecast-decision": 1, reserve: 2, match: 3, unclaimed: 4 };
  return items.sort((a, b) => rank[a.kind] - rank[b.kind] || (a.dueInDays ?? 999) - (b.dueInDays ?? 999));
}

/** Impact split so nothing is counted twice: achieved, in progress, and held on forecast. */
export function impactStages(data: EngineData) {
  const stage = (pred: (t: EngineData["transfers"][number]) => boolean) => {
    const ts = data.transfers.filter(pred);
    const sv = ts.map((t) => transferSavings(data, t));
    return { count: ts.length, savedRm: sv.reduce((a, s) => a + s.savedRm, 0), tonnes: sv.reduce((a, s) => a + s.tonnes, 0) };
  };
  return {
    achieved: stage((t) => t.status === "Completed"),
    inProgress: stage((t) => !!t.listingId && ["Matched", "Awaiting approval", "Reserved", "Collected"].includes(t.status)),
    onForecast: stage((t) => !!t.forecastId && !t.listingId && t.status !== "Cancelled"),
    available: data.listings.filter((l) => l.status === "available").reduce((a, l) => a + listingValueRm(data, l), 0),
    oldestUnclaimedDays: Math.max(0, ...data.listings.filter((l) => l.status === "available").map((l) => listingAgeDays(data, l))),
  };
}
