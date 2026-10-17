"use client";

import { useEffect, useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtDate, fmtNum } from "@/lib/format";
import type { Forecast } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TimelineCore, todayPosition, type TimelineProps } from "./timeline-core";

export { RadarLegend } from "./timeline-core";
export type { TimelineNeed } from "./timeline-core";

/** Interactive timeline for the app: tooltips, click to open the explanation, scrolls to today on small screens. */
export function RadarTimeline({ className, onSelect, ...props }: TimelineProps & { className?: string; onSelect?: (f: Forecast) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const todayPos = todayPosition(props.data.today, props.from, props.to);
  useEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const label = el.querySelector("[data-label-col]")?.clientWidth ?? 0;
    el.scrollLeft = Math.max(0, (todayPos / 100) * (el.scrollWidth - label) - 24);
  }, [todayPos]);

  return (
    <div ref={scroller} className={cn("blueprint relative overflow-x-auto rounded-xl border", className)}>
      <TimelineCore
        {...props}
        renderNeed={(n) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className={n.className} style={n.style} aria-label={n.label} />
            </TooltipTrigger>
            <TooltipContent>{n.label}</TooltipContent>
          </Tooltip>
        )}
        renderMarker={(m) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelect?.(m.f)}
                aria-label={m.label}
                className={cn(m.className, "transition-transform hover:scale-110 focus-visible:scale-110")}
                style={m.style}
              >
                {m.children}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              <p className="font-medium">{m.name}</p>
              <p>
                {fmtNum(m.f.qty)} {m.unit} {m.confirmed ? m.f.status.toLowerCase() : "forecast"} from {fmtDate(m.f.availableFrom)}
              </p>
              <p>Confidence {m.f.confidence.toFixed(2)}</p>
            </TooltipContent>
          </Tooltip>
        )}
      />
    </div>
  );
}
