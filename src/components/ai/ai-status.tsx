"use client";

import { Cpu, FlaskConical } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AiStatus {
  mode: "live" | "demo";
  reason: string | null;
  provider?: string;
  model?: string;
  loaded: boolean;
}

const initial: AiStatus = { mode: "demo", reason: null, loaded: false };
const Ctx = createContext<AiStatus>(initial);

/** Fetches /api/ai-status once per page load. Never exposes keys: the route returns booleans only. */
export function AiStatusProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<AiStatus>(initial);
  useEffect(() => {
    let alive = true;
    fetch("/api/ai-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => alive && setS({ mode: j.mode === "live" ? "live" : "demo", reason: j.reason ?? null, provider: j.provider, model: j.model, loaded: true }))
      .catch(() => alive && setS({ mode: "demo", reason: "Could not reach the AI status check. Demo mode is on.", loaded: true }));
    return () => {
      alive = false;
    };
  }, []);
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}

export const useAiStatus = () => useContext(Ctx);

export function AiModeBadge({ className, mode: forced }: { className?: string; mode?: "live" | "demo" }) {
  const s = useAiStatus();
  const mode = forced ?? s.mode;
  const live = mode === "live";
  const label = live ? "Live AI" : "Demo mode";
  const tip = live ? `Live AI is on${s.model ? ` (${s.model})` : ""}. Results are suggestions; you confirm every one.` : (s.reason ?? "Demo mode: pre-written AI results. No model runs.");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex h-5 shrink-0 cursor-help items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium whitespace-nowrap",
            live ? "border-success/30 bg-success-soft text-success" : "border-info/30 bg-info-soft text-info",
            className,
          )}
          aria-label={`${label}. ${tip}`}
        >
          {live ? <Cpu className="size-3" aria-hidden /> : <FlaskConical className="size-3" aria-hidden />}
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">{tip}</TooltipContent>
    </Tooltip>
  );
}
