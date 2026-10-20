"use client";

import { ChevronDown } from "lucide-react";
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A page section that folds to its title and a one-line explanation, so every
 * feature on a page is visible on the first screen. Content stays in the page
 * while folded (just hidden), so the guided tour can find a target inside and
 * ask the section to open with `revealDemoTarget`.
 */

const REVEAL = "surplus-ai:reveal";
const KEY = "surplus-ai:section:";

/** Ask whichever folded section holds this tour target to open. */
export function revealDemoTarget(target: string) {
  window.dispatchEvent(new CustomEvent(REVEAL, { detail: target }));
}

const OpenContext = createContext(true);
/** False while the surrounding section is folded. Heavy content (the 3D world) can pause. */
export function useSectionOpen() {
  return useContext(OpenContext);
}

export function PageSection({
  id,
  title,
  description,
  badge,
  defaultOpen = false,
  forceOpen = false,
  actions,
  demo,
  anchorId,
  onOpenChange,
  className,
  bodyClassName,
  children,
}: {
  /** Stable id, used to remember the open state on this device. */
  id: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  /** Open regardless of the saved state, e.g. when a link points at a record inside. */
  forceOpen?: boolean;
  /** Controls beside the header button (toggles, links, badges that take focus). */
  actions?: React.ReactNode;
  demo?: string;
  onOpenChange?: (open: boolean) => void;
  /** DOM id for in-page links (#anchor). */
  anchorId?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const body = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const headingId = useId();
  const bodyId = useId();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY + id);
      if (saved === "1" || saved === "0") setOpen(saved === "1");
    } catch {
      // Storage unavailable: keep the default.
    }
  }, [id]);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  // An in-page link to this section (#anchor) opens it.
  useEffect(() => {
    if (!anchorId) return;
    const onHash = () => {
      if (window.location.hash === `#${anchorId}`) setOpen(true);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [anchorId]);

  useEffect(() => {
    const onReveal = (e: Event) => {
      const target = (e as CustomEvent<string>).detail;
      const sel = `[data-demo="${CSS.escape(target)}"]`;
      if (root.current?.matches(sel) || body.current?.querySelector(sel)) setOpen(true);
    };
    window.addEventListener(REVEAL, onReveal);
    return () => window.removeEventListener(REVEAL, onReveal);
  }, []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(KEY + id, o ? "0" : "1");
      } catch {
        // Ignore: the choice just lasts for this visit.
      }
      return !o;
    });
  };

  return (
    <section ref={root} id={anchorId} aria-labelledby={headingId} data-demo={demo} data-open={open || undefined} className={cn("overflow-hidden rounded-2xl bg-card shadow-card", className)}>
      <div className={cn("flex items-center gap-2 px-4 py-3 sm:px-5", open && "border-b")}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="group -my-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="min-w-0 flex-1">
            <span id={headingId} role="heading" aria-level={2} className="flex items-center gap-2 font-semibold">
              {title}
              {badge !== undefined && <span className="tabular text-sm font-normal text-muted-foreground">{badge}</span>}
            </span>
            <span className="block text-xs text-muted-foreground">{description}</span>
          </span>
          <span className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground">
            <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
          </span>
        </button>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div ref={body} id={bodyId} hidden={!open} className={bodyClassName}>
        <OpenContext.Provider value={open}>{children}</OpenContext.Provider>
      </div>
    </section>
  );
}
