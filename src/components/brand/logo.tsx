import { cn } from "@/lib/utils";

/** Mark: a stack of material seen through radar arcs, with one forecast blip. */
export function LogoMark({ className, title, onDark = false }: { className?: string; title?: string; onDark?: boolean }) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={onDark ? "#34D399" : "#10B981"} />
          <stop offset="1" stopColor={onDark ? "#38BDF8" : "#0284C7"} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-g)" />
      <path d="M7 25 A18 18 0 0 1 25 7" fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 25 A11 11 0 0 1 18 14" fill="none" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
      <rect x="7" y="21" width="9" height="4" rx="1" fill="#FFFFFF" />
      <rect x="9" y="17" width="7" height="3.2" rx="1" fill="#FFFFFF" opacity="0.8" />
      <circle cx="22.5" cy="11.5" r="3" fill="#F2A541" />
    </svg>
  );
}

export function Logo({ className, compact = false, onDark = false }: { className?: string; compact?: boolean; onDark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark onDark={onDark} />
      {!compact && (
        <span className={cn("text-[17px] font-extrabold tracking-[-0.02em]", onDark ? "text-white" : "text-foreground")}>
          Surplus <span className={cn("font-normal", onDark ? "text-forecast" : "text-brand")}>AI</span>
        </span>
      )}
    </span>
  );
}
