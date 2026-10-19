"use client";

import { ArrowRight, Flag, MousePointerClick, Truck, X } from "lucide-react";
import Link from "next/link";
import { describe, findSite, type World, type WorldSelection } from "@/lib/engine/world";
import { fmtNum, fmtRm } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneClass = {
  brand: "bg-brand-soft text-brand-strong",
  forecast: "bg-forecast-soft text-forecast-ink",
  success: "bg-success-soft text-success",
  warning: "bg-info-soft text-info",
  ink: "bg-muted text-foreground",
} as const;

/** The info card beside the world. Same content whichever view the object was clicked in. */
export function WorldCard({ world, selection, onSelect }: { world: World; selection: WorldSelection | null; onSelect: (s: WorldSelection | null) => void }) {
  const card = selection ? describe(world, selection) : null;

  if (!card) {
    const piles = world.sites.reduce((a, s) => a + s.piles.length + s.hiddenPiles, 0);
    const ghosts = world.sites.reduce((a, s) => a + s.ghosts.length + s.hiddenGhosts, 0);
    return (
      <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <MousePointerClick className="size-[18px]" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">Click anything in the world</p>
            <p className="text-sm text-muted-foreground">Buildings, material piles, lorries, flags and the landfill all open their numbers.</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {[
            { k: "Sites", v: fmtNum(world.sites.length) },
            { k: "Leftovers logged", v: fmtNum(piles) },
            { k: "Leftovers forecast", v: fmtNum(ghosts) },
            { k: "Lorries moving", v: fmtNum(world.transfers.length) },
          ].map((r) => (
            <div key={r.k} className="rounded-xl bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">{r.k}</dt>
              <dd className="tabular font-semibold">{r.v}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => onSelect({ kind: "landfill", id: "landfill" })}
          className="rounded-xl border border-success/25 bg-success-soft/60 px-3 py-2.5 text-left text-sm transition-colors hover:bg-success-soft"
        >
          <span className="block text-xs text-success">Kept out of landfill so far</span>
          <span className="tabular font-semibold">{fmtRm(world.impact.savedRm)}</span>
        </button>
        <WorldLegend className="mt-auto" />
      </div>
    );
  }

  const site = selection?.kind === "site" ? findSite(world, selection.id) : null;

  return (
    <div className="flex h-full flex-col p-4 sm:p-5" aria-live="polite">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase", toneClass[card.tone])}>{card.eyebrow}</span>
        <button type="button" onClick={() => onSelect(null)} aria-label="Close details" className="-mt-1 -mr-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <h3 className="mt-2 text-lg leading-snug font-semibold">{card.title}</h3>
      <dl className="mt-3 divide-y text-sm">
        {card.rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 py-1.5">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="tabular text-right font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
      {card.note && <p className="mt-2 text-xs text-muted-foreground">{card.note}</p>}

      {site && (
        <div className="mt-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">In its yard</p>
          <ul className="mt-1.5 flex max-h-44 flex-col gap-1 overflow-y-auto pr-1">
            {site.piles.map((p) => (
              <YardItem key={p.id} onClick={() => onSelect({ kind: "pile", id: p.id })} dot={p.status === "reserved" ? "bg-brand-strong" : "bg-success"}>
                {fmtNum(p.qty)} {p.unit} {p.materialName}
              </YardItem>
            ))}
            {site.ghosts.map((g) => (
              <YardItem key={g.id} onClick={() => onSelect({ kind: "ghost", id: g.id })} dot="border border-dashed border-forecast-ink bg-forecast/30">
                About {fmtNum(g.qty)} {g.unit} {g.materialName} (forecast)
              </YardItem>
            ))}
            {site.needs.map((n) => (
              <YardItem key={n.id} onClick={() => onSelect({ kind: "need", id: n.id })} icon={<Flag className="size-3 text-info" aria-hidden />}>
                Needs {fmtNum(n.qty)} {n.unit} {n.materialName}
              </YardItem>
            ))}
            {world.transfers
              .filter((t) => t.fromSiteId === site.id || t.toSiteId === site.id)
              .map((t) => (
                <YardItem key={t.id} onClick={() => onSelect({ kind: "transfer", id: t.id })} icon={<Truck className="size-3 text-brand" aria-hidden />}>
                  Lorry {t.fromSiteId === site.id ? "out" : "in"}: {fmtNum(t.qty)} {t.unit} {t.materialName}
                </YardItem>
              ))}
          </ul>
          {(site.hiddenPiles > 0 || site.hiddenGhosts > 0) && (
            <p className="mt-1 text-xs text-muted-foreground">Plus {site.hiddenPiles + site.hiddenGhosts} smaller ones, listed on the page.</p>
          )}
        </div>
      )}

      {card.href && (
        <Link href={card.href} className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {card.hrefLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function YardItem({ children, onClick, dot, icon }: { children: React.ReactNode; onClick: () => void; dot?: string; icon?: React.ReactNode }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted">
        {icon ?? <span className={cn("size-2.5 shrink-0 rounded-[3px]", dot)} aria-hidden />}
        <span className="min-w-0 truncate">{children}</span>
      </button>
    </li>
  );
}

export function WorldLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-1.5 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-1", className)}>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-[3px] bg-success" aria-hidden /> Leftovers ready to reuse
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-[3px] bg-brand-strong" aria-hidden /> Leftovers reserved
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-[3px] border border-dashed border-forecast-ink bg-forecast/30" aria-hidden /> Forecast, not logged yet
      </li>
      <li className="flex items-center gap-2">
        <Flag className="size-3 text-info" aria-hidden /> A site needs material
      </li>
      <li className="flex items-center gap-2">
        <Truck className="size-3 text-brand" aria-hidden /> Lorry moving leftovers
      </li>
    </ul>
  );
}
